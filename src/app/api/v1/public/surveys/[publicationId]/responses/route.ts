import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getOrganizationSubscription } from "@/lib/billing";
import { hashIp, checkRateLimit } from "@/lib/rate-limiter";
import { apiError } from "@/lib/api-auth";

const SubmitPublicResponseSchema = z.object({
  overallRating: z.number().int().min(1).max(5),
  npsScore: z.number().int().min(0).max(10).optional().nullable(),
  commentText: z.string().max(1000).optional().nullable(),
  invitationToken: z.string().optional().nullable(),
  idempotencyKey: z.string().max(100).optional().nullable(),
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        ratingValue: z.number().int().min(1).max(10).optional().nullable(),
        textValue: z.string().max(1000).optional().nullable(),
        booleanValue: z.boolean().optional().nullable(),
        selectedOptions: z.string().optional().nullable(),
      })
    )
    .default([]),
});

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { publicationId: string } }
) {
  try {
    const { publicationId } = params;

    // Rate Limiting by IP (max 30 submissions per minute per IP)
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const ipHashed = hashIp(ip);
    const rl = checkRateLimit(`pub_submit:${ipHashed}`, 30, 60);
    if (!rl.allowed) {
      return apiError(
        "RATE_LIMIT_EXCEEDED",
        "ส่งคำตอบถี่เกินไป กรุณารอสักครู่ก่อนทำรายการใหม่",
        429,
        { retryAfter: rl.resetInSeconds }
      );
    }

    // 1. Resolve Publication strictly on server
    const publication = await prisma.surveyPublication.findFirst({
      where: {
        OR: [{ publicCode: publicationId }, { id: publicationId }],
        isActive: true,
      },
      include: {
        organization: true,
        surveyVersion: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!publication || publication.revokedAt) {
      return apiError(
        "PUBLICATION_NOT_FOUND",
        "ไม่พบรหัสแบบประเมิน หรือแบบประเมินนี้ปิดรับคำตอบแล้ว",
        404
      );
    }

    if (publication.expiresAt && publication.expiresAt < new Date()) {
      return apiError("PUBLICATION_EXPIRED", "แบบประเมินนี้หมดอายุการเปิดรับคำตอบแล้ว", 410);
    }

    const orgId = publication.organizationId;
    const versionId = publication.surveyVersionId;
    const servicePointId = publication.servicePointId;

    // 2. Monthly Quota Check
    const subInfo = await getOrganizationSubscription(orgId);
    if (subInfo && subInfo.remainingResponses <= 0) {
      return apiError(
        "QUOTA_EXCEEDED",
        "หน่วยงานนี้ได้รับคำตอบครบตามโควตาประจำเดือนแล้ว กรุณาติดต่อผู้ดูแลเพื่อเพิ่มโควตา",
        429
      );
    }

    // 3. Parse & Validate Payload
    const body = await req.json();
    const result = SubmitPublicResponseSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        "VALIDATION_ERROR",
        result.error.errors[0]?.message || "ข้อมูลคำตอบไม่ถูกต้อง",
        400
      );
    }

    const {
      overallRating,
      npsScore,
      commentText,
      invitationToken,
      answers,
    } = result.data;

    // Check Idempotency Key (from header or body)
    const headerIdempotencyKey = req.headers.get("idempotency-key");
    const idempotencyKey = headerIdempotencyKey || result.data.idempotencyKey || null;

    if (idempotencyKey) {
      const existingResponse = await prisma.response.findUnique({
        where: { idempotencyKey },
        select: { id: true, submittedAt: true },
      });

      if (existingResponse) {
        return NextResponse.json({
          success: true,
          responseId: existingResponse.id,
          submittedAt: existingResponse.submittedAt.toISOString(),
          idempotentReplay: true,
        });
      }
    }

    // 4. Validate Invitation Token (if provided)
    let invitationId: string | null = null;
    if (invitationToken) {
      const tokenHash = hashIp(invitationToken);
      const invitation = await prisma.surveyInvitation.findUnique({
        where: { tokenHash },
      });

      if (!invitation || invitation.organizationId !== orgId) {
        return apiError("INVALID_INVITATION", "ลิงก์คำเชิญไม่ถูกต้อง", 400);
      }

      if (invitation.isConsumed) {
        return apiError("INVITATION_ALREADY_USED", "ลิงก์คำเชิญนี้ถูกใช้งานไปแล้ว", 409);
      }

      if (invitation.expiresAt < new Date()) {
        return apiError("INVITATION_EXPIRED", "ลิงก์คำเชิญนี้หมดอายุแล้ว", 410);
      }

      invitationId = invitation.id;
    }

    // 5. Atomic Transaction: Record response, answers, consume invitation, auto-case if critical rating
    const saved = await prisma.$transaction(async (tx) => {
      // Create Response
      const response = await tx.response.create({
        data: {
          organizationId: orgId,
          surveyVersionId: versionId,
          servicePointId,
          invitationId,
          idempotencyKey,
          overallRating,
          npsScore: npsScore ?? null,
          commentText: commentText?.trim() || null,
          ipHash: ipHashed,
        },
      });

      // Create Answers
      if (answers.length > 0) {
        const validQuestionIds = new Set(
          publication.surveyVersion.questions.map((q) => q.id)
        );

        for (const ans of answers) {
          if (validQuestionIds.has(ans.questionId)) {
            await tx.responseAnswer.create({
              data: {
                responseId: response.id,
                questionId: ans.questionId,
                ratingValue: ans.ratingValue ?? null,
                textValue: ans.textValue?.trim() || null,
                booleanValue: ans.booleanValue ?? null,
                selectedOptions: ans.selectedOptions || null,
              },
            });
          }
        }
      }

      // Mark invitation as consumed if used
      if (invitationId) {
        await tx.surveyInvitation.update({
          where: { id: invitationId },
          data: {
            isConsumed: true,
            consumedAt: new Date(),
          },
        });
      }

      // Auto-create FeedbackCase if overallRating <= 2 (Critical / Low Rating)
      if (overallRating <= 2) {
        const caseNumber = `CASE-${Date.now().toString().slice(-6)}`;
        await tx.feedbackCase.create({
          data: {
            organizationId: orgId,
            responseId: response.id,
            servicePointId,
            caseNumber,
            category: "QUALITY",
            urgency: overallRating === 1 ? "HIGH" : "MEDIUM",
            status: "NEW",
          },
        });
      }

      return response;
    });

    return NextResponse.json(
      {
        success: true,
        responseId: saved.id,
        submittedAt: saved.submittedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit public response error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถบันทึกผลการประเมินได้", 500);
  }
}
