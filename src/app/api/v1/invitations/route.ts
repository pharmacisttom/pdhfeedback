import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashIp } from "@/lib/rate-limiter";
import { logAuditEvent } from "@/lib/audit";
import { authenticateApiKey, apiError } from "@/lib/api-auth";
import { getAppBaseUrl } from "@/lib/app-url";

const CreateInvitationSchema = z.object({
  publicationId: z.string().optional(),
  surveyVersionId: z.string().optional(),
  servicePointId: z.string().optional().nullable(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
  externalReference: z.string().max(120).optional().nullable(),
  idempotencyKey: z.string().max(100).optional().nullable(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let orgId: string | null = null;
    let apiKeyId: string | null = null;
    let keyServicePointId: string | null = null;
    let userId: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const authResult = await authenticateApiKey(req, "invitations:write");
      if (!authResult.success) {
        return authResult.response;
      }
      orgId = authResult.organizationId;
      apiKeyId = authResult.apiKeyId;
      keyServicePointId = authResult.servicePointId || null;
    } else {
      const session = await getSession();
      if (!session || !session.activeOrgId) {
        return apiError("UNAUTHORIZED", "ต้องระบุ Bearer API Key หรือเข้าสู่ระบบ", 401);
      }
      orgId = session.activeOrgId;
      userId = session.userId;
    }

    const body = await req.json();
    const result = CreateInvitationSchema.safeParse(body);
    if (!result.success) {
      return apiError(
        "VALIDATION_ERROR",
        result.error.errors[0]?.message || "ข้อมูลคำเชิญไม่ถูกต้อง",
        400
      );
    }

    const {
      publicationId,
      surveyVersionId,
      servicePointId,
      expiresInDays,
      externalReference,
    } = result.data;

    // Check Idempotency-Key from header or body
    const headerIdempotencyKey = req.headers.get("idempotency-key");
    const idempotencyKey = headerIdempotencyKey || result.data.idempotencyKey || null;

    if (idempotencyKey) {
      const existing = await prisma.surveyInvitation.findFirst({
        where: {
          organizationId: orgId,
          idempotencyKey,
        },
      });

      if (existing) {
        // Return existing invitation
        const appUrl = getAppBaseUrl(req);
        // Note: For existing, token hash cannot be reversed, so return existing id & metadata
        return NextResponse.json({
          success: true,
          invitationId: existing.id,
          expiresAt: existing.expiresAt.toISOString(),
          isConsumed: existing.isConsumed,
          externalReference: existing.externalReference,
          idempotentReplay: true,
        });
      }
    }

    // Verify service point scope if API key has restriction
    if (keyServicePointId && servicePointId && servicePointId !== keyServicePointId) {
      return apiError(
        "FORBIDDEN_SERVICE_POINT",
        "API Key นี้ถูกจำกัดให้สร้างคำเชิญเฉพาะจุดบริการที่กำหนดเท่านั้น",
        403
      );
    }

    const targetServicePointId = servicePointId || keyServicePointId || null;

    // Resolve SurveyVersion
    let version: any = null;
    let targetPublication: any = null;

    if (publicationId) {
      targetPublication = await prisma.surveyPublication.findFirst({
        where: {
          organizationId: orgId,
          OR: [{ id: publicationId }, { publicCode: publicationId }],
          isActive: true,
        },
        include: { surveyVersion: true },
      });

      if (!targetPublication) {
        return apiError("PUBLICATION_NOT_FOUND", "ไม่พบรหัส Publication ที่ระบุหรือไม่ได้เปิดใช้งาน", 404);
      }
      version = targetPublication.surveyVersion;
    } else if (surveyVersionId) {
      version = await prisma.surveyVersion.findUnique({
        where: { id: surveyVersionId },
        include: { survey: true, publications: { where: { isActive: true } } },
      });

      if (!version || version.survey.organizationId !== orgId) {
        return apiError("SURVEY_NOT_FOUND", "แบบประเมินไม่ถูกต้องหรือไม่ตรงกับองค์กร", 404);
      }
      targetPublication = version.publications[0] || null;
    } else {
      return apiError(
        "MISSING_PARAMETER",
        "กรุณาระบุ publicationId หรือ surveyVersionId เพื่อผูกกับคำเชิญ",
        400
      );
    }

    // Generate high-entropy 32-byte cryptographic random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashIp(rawToken);

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invitation = await prisma.surveyInvitation.create({
      data: {
        organizationId: orgId,
        surveyVersionId: version.id,
        servicePointId: targetServicePointId,
        tokenHash: hashedToken,
        externalReference: externalReference || null,
        idempotencyKey,
        expiresAt,
        isConsumed: false,
      },
    });

    const appUrl = getAppBaseUrl(req);
    const pubCode = targetPublication?.publicCode || "survey";
    const invitationUrl = `${appUrl}/s/${pubCode}?invite=${rawToken}`;

    await logAuditEvent({
      userId,
      organizationId: orgId,
      action: "API_CREATE_SURVEY_INVITATION",
      targetType: "SURVEY_INVITATION",
      targetId: invitation.id,
      details: {
        expiresInDays,
        hasExternalRef: Boolean(externalReference),
        hasIdempotencyKey: Boolean(idempotencyKey),
      },
    });

    return NextResponse.json(
      {
        success: true,
        invitationId: invitation.id,
        invitationUrl,
        expiresAt: expiresAt.toISOString(),
        externalReference: invitation.externalReference,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create invitation error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถสร้างลิงก์คำเชิญได้", 500);
  }
}
