import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, hashIp } from "@/lib/rate-limiter";
import { logAuditEvent } from "@/lib/audit";

const AnswerSchema = z.object({
  questionId: z.string(),
  ratingValue: z.number().int().optional().nullable(),
  textValue: z.string().optional().nullable(),
  booleanValue: z.boolean().optional().nullable(),
  selectedOptions: z.array(z.string()).optional().nullable(),
});

const ContactSchema = z.object({
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().nullable().or(z.literal("")),
  preferredTime: z.string().optional().nullable(),
  consentGiven: z.boolean(),
});

const SubmitResponseSchema = z.object({
  publicCode: z.string(),
  idempotencyKey: z.string().min(10, "Invalid idempotency key"),
  answers: z.array(AnswerSchema),
  commentText: z.string().optional().nullable(),
  contact: ContactSchema.optional().nullable(),
  honeypot: z.string().optional().nullable(), // Bot detection: must be empty
  invitationToken: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;
    const ipHashed = hashIp(ip);

    // Rate limit public submissions: max 20 per minute per IP
    const rateLimit = checkRateLimit(`survey_submit:${ipHashed}`, 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "ระบบตรวจพบการส่งข้อมูลถี่ผิดปกติ กรุณารอสักครู่แล้วลองใหม่" },
        { status: 429 }
      );
    }

    const body = await req.json();

    // Honeypot check: If bot filled this invisible field, silently return success without saving
    if (body.honeypot && body.honeypot.trim().length > 0) {
      return NextResponse.json({ success: true, message: "บันทึกสำเร็จ" });
    }

    const parseResult = SubmitResponseSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const {
      publicCode,
      idempotencyKey,
      answers,
      commentText,
      contact,
      invitationToken,
    } = parseResult.data;

    // 1. Idempotency Check: if this exact key was already processed, return existing success response!
    const existingResponse = await prisma.response.findUnique({
      where: { idempotencyKey },
    });
    if (existingResponse) {
      return NextResponse.json({
        success: true,
        responseId: existingResponse.id,
        isDuplicate: true,
        message: "คำตอบของท่านถูกบันทึกเรียบร้อยแล้ว",
      });
    }

    // 2. Resolve Public Survey & Service Point from public identifier
    const publication = await prisma.surveyPublication.findUnique({
      where: { publicCode },
      include: {
        organization: true,
        surveyVersion: {
          include: {
            questions: true,
          },
        },
        servicePoint: true,
      },
    });

    if (!publication || !publication.isActive) {
      return NextResponse.json(
        { error: "จุดบริการหรือแบบประเมินนี้ไม่ได้เปิดรับคำตอบในขณะนี้" },
        { status: 404 }
      );
    }

    const { organization, surveyVersion, servicePoint } = publication;

    // Check organization status
    if (organization.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "ระบบบริการขององค์กรนี้ปิดปรับปรุงชั่วคราว" },
        { status: 403 }
      );
    }

    // Check survey version status
    if (surveyVersion.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "แบบประเมินนี้ปิดรับคำตอบแล้ว" },
        { status: 403 }
      );
    }

    // Check schedule if configured
    const now = new Date();
    if (surveyVersion.startsAt && now < surveyVersion.startsAt) {
      return NextResponse.json(
        { error: "แบบประเมินยังไม่เริ่มเปิดรับคำตอบ" },
        { status: 403 }
      );
    }
    if (surveyVersion.endsAt && now > surveyVersion.endsAt) {
      return NextResponse.json(
        { error: "แบบประเมินหมดเวลาการรับคำตอบแล้ว" },
        { status: 403 }
      );
    }

    // 3. Quota check: Monthly responses quota using Subscription anchor window
    const { getOrganizationSubscription } = await import("@/lib/billing");
    const subInfo = await getOrganizationSubscription(organization.id);
    if (subInfo && subInfo.remainingResponses <= 0) {
      return NextResponse.json(
        { error: "ขออภัย องค์กรนี้ถึงขีดจำกัดการรับคำตอบประจำเดือนตามแพ็กเกจแล้ว กรุณาติดต่อผู้ดูแลระบบเพื่ออัปเกรดแพ็กเกจ" },
        { status: 403 }
      );
    }

    // 4. Invitation Token check (if provided)
    let validatedInvitationId: string | undefined = undefined;
    if (invitationToken) {
      const hashedToken = hashIp(invitationToken);
      const inv = await prisma.surveyInvitation.findUnique({
        where: { tokenHash: hashedToken },
      });

      if (!inv || inv.organizationId !== organization.id) {
        return NextResponse.json({ error: "ลิงก์คำเชิญไม่ถูกต้อง" }, { status: 400 });
      }
      if (inv.isConsumed) {
        return NextResponse.json({ error: "ลิงก์คำเชิญนี้ถูกใช้งานตอบแบบประเมินไปแล้ว" }, { status: 400 });
      }
      if (now > inv.expiresAt) {
        return NextResponse.json({ error: "ลิงก์คำเชิญนี้หมดอายุแล้ว" }, { status: 400 });
      }
      validatedInvitationId = inv.id;
    }

    // 5. Calculate overall rating and NPS score
    let overallRating: number | null = null;
    let npsScore: number | null = null;

    // Filter answers to only valid questions defined in this published survey version
    const validQuestionIds = new Set(surveyVersion.questions.map((q) => q.id));
    const validAnswers = answers.filter((a) => validQuestionIds.has(a.questionId));

    for (const q of surveyVersion.questions) {
      const ans = validAnswers.find((a) => a.questionId === q.id);
      if (ans && typeof ans.ratingValue === "number") {
        if (q.isOverallCSAT || (q.type === "RATING_1_5" && !overallRating)) {
          overallRating = ans.ratingValue;
        }
        if (q.type === "NPS_0_10") {
          npsScore = ans.ratingValue;
        }
      }
    }

    // 6. Execute atomic transaction to save response, answers, contacts, and trigger cases
    const saved = await prisma.$transaction(async (tx) => {
      const response = await tx.response.create({
        data: {
          organizationId: organization.id,
          surveyVersionId: surveyVersion.id,
          servicePointId: servicePoint?.id || null,
          invitationId: validatedInvitationId || null,
          idempotencyKey,
          ipHash: ipHashed,
          userAgent,
          overallRating,
          npsScore,
          commentText: commentText?.trim() || null,
        },
      });

      // Save valid answers
      if (validAnswers.length > 0) {
        await tx.responseAnswer.createMany({
          data: validAnswers.map((a) => ({
            responseId: response.id,
            questionId: a.questionId,
            ratingValue: a.ratingValue ?? null,
            textValue: a.textValue ?? null,
            booleanValue: a.booleanValue ?? null,
            selectedOptions: a.selectedOptions ? JSON.stringify(a.selectedOptions) : null,
          })),
        });
      }

      // Segregated Contact Info
      if (contact && contact.consentGiven && (contact.phone || contact.name || contact.email)) {
        await tx.responseContact.create({
          data: {
            responseId: response.id,
            organizationId: organization.id,
            name: contact.name?.trim() || null,
            phone: contact.phone?.trim() || null,
            email: contact.email?.trim() || null,
            preferredTime: contact.preferredTime?.trim() || null,
            consentGiven: true,
          },
        });
      }

      // Mark invitation token as consumed
      if (validatedInvitationId) {
        await tx.surveyInvitation.update({
          where: { id: validatedInvitationId },
          data: {
            isConsumed: true,
            consumedAt: now,
          },
        });
      }

      // Check notification rule & create low rating case
      if (overallRating !== null && overallRating <= 2) {
        const caseNumber = `CASE-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

        await tx.feedbackCase.create({
          data: {
            organizationId: organization.id,
            responseId: response.id,
            servicePointId: servicePoint?.id || null,
            caseNumber,
            category: "SERVICE",
            urgency: overallRating === 1 ? "CRITICAL" : "HIGH",
            status: "NEW",
            rootCause: null,
          },
        });

        // In-app alert notification
        await tx.notification.create({
          data: {
            organizationId: organization.id,
            title: `แจ้งเตือนคะแนนประเมินต่ำ (${overallRating}/5 ดาว)`,
            message: `จุดบริการ ${servicePoint?.name || "ทั่วไป"} ได้รับคะแนนประเมิน ${overallRating}/5 ดาว พร้อมคำติชม กรุณาตรวจสอบและดำเนินการแก้ไข`,
            type: "LOW_RATING",
            link: `/${organization.slug}/feedback`,
          },
        });
      }

      return response;
    });

    return NextResponse.json({
      success: true,
      responseId: saved.id,
      thankYouTitle: surveyVersion.thankYouTitle,
      thankYouMessage: surveyVersion.thankYouMessage,
    });
  } catch (error) {
    console.error("Submit survey error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกคำตอบ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}
