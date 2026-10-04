import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getOrganizationSubscription } from "@/lib/billing";
import { normalizeWebsiteOrigin } from "@/lib/embed-security";
import { apiError } from "@/lib/api-auth";
import { logAuditEvent } from "@/lib/audit";

const CreateEmbedSchema = z.object({
  surveyVersionId: z.string(),
  servicePointId: z.string().optional().nullable(),
  name: z.string().min(2, "ชื่อการเชื่อมต่อต้องมีอย่างน้อย 2 ตัวอักษร").max(100),
  displayMode: z.enum(["FULLPAGE", "INLINE_IFRAME", "JS_WIDGET"]).default("INLINE_IFRAME"),
  allowedOrigins: z.array(z.string()).default([]),
  widgetConfig: z
    .object({
      buttonText: z.string().optional(),
      themeColor: z.string().optional(),
      language: z.string().optional(),
      dialogTitle: z.string().optional(),
      isFloating: z.boolean().optional(),
    })
    .optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.activeOrgId) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const publications = await prisma.surveyPublication.findMany({
      where: { organizationId: session.activeOrgId },
      include: {
        servicePoint: { select: { id: true, code: true, name: true } },
        surveyVersion: {
          select: {
            id: true,
            versionNumber: true,
            title: true,
            status: true,
            survey: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      embeds: publications.map((p) => {
        let allowedOrigins: string[] = [];
        try {
          if (p.allowedOrigins) allowedOrigins = JSON.parse(p.allowedOrigins);
        } catch {}

        let widgetConfig: any = {};
        try {
          if (p.widgetConfig) widgetConfig = JSON.parse(p.widgetConfig);
        } catch {}

        return {
          id: p.id,
          name: p.name || p.surveyVersion.title,
          publicCode: p.publicCode,
          displayMode: p.displayMode,
          allowedOrigins,
          widgetConfig,
          isActive: p.isActive,
          isRevoked: Boolean(p.revokedAt),
          expiresAt: p.expiresAt?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
          servicePoint: p.servicePoint,
          survey: {
            id: p.surveyVersion.survey.id,
            title: p.surveyVersion.survey.title,
            versionNumber: p.surveyVersion.versionNumber,
            versionTitle: p.surveyVersion.title,
          },
        };
      }),
    });
  } catch (error) {
    console.error("List embeds error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถดึงข้อมูลการเชื่อมต่อ Embed ได้", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.activeOrgId) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const isPrivileged = session.isPlatformAdmin || session.activeRole === "OWNER" || session.activeRole === "ADMIN";
    if (!isPrivileged) {
      return apiError("FORBIDDEN", "คุณไม่มีสิทธิ์สร้าง Embed Configuration", 403);
    }

    // Check entitlement: embed_widget
    const subInfo = await getOrganizationSubscription(session.activeOrgId);
    if (!subInfo?.allFeatures.includes("embed_widget")) {
      return apiError(
        "ENTITLEMENT_REQUIRED",
        "ฟีเจอร์ Embeddable Survey Widget ต้องใช้แพ็กเกจ Business / Enterprise หรือได้รับสิทธิ์พิเศษจากผู้ดูแลระบบ (Admin Grant)",
        403
      );
    }

    const body = await req.json();
    const result = CreateEmbedSchema.safeParse(body);
    if (!result.success) {
      return apiError("VALIDATION_ERROR", result.error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง", 400);
    }

    const {
      surveyVersionId,
      servicePointId,
      name,
      displayMode,
      allowedOrigins: rawOrigins,
      widgetConfig,
    } = result.data;

    // Validate and normalize allowed origins
    const validOrigins: string[] = [];
    for (const raw of rawOrigins) {
      const normRes = normalizeWebsiteOrigin(raw);
      if (!normRes.isValid) {
        return apiError("INVALID_ORIGIN", `Allowed Origin "${raw}" ไม่ถูกต้อง: ${normRes.error}`, 400);
      }
      if (normRes.normalized && !validOrigins.includes(normRes.normalized)) {
        validOrigins.push(normRes.normalized);
      }
    }

    // Verify survey version belongs to this organization
    const version = await prisma.surveyVersion.findUnique({
      where: { id: surveyVersionId },
      include: { survey: true },
    });

    if (!version || version.survey.organizationId !== session.activeOrgId) {
      return apiError("SURVEY_NOT_FOUND", "แบบประเมินไม่ถูกต้องหรือไม่ตรงกับองค์กร", 404);
    }

    // Generate clean publicCode identifier (e.g. "emb_" + 12 random hex characters)
    const publicCode = `emb_${crypto.randomBytes(6).toString("hex")}`;

    const publication = await prisma.surveyPublication.create({
      data: {
        organizationId: session.activeOrgId,
        surveyVersionId,
        servicePointId: servicePointId || null,
        name,
        publicCode,
        displayMode,
        allowedOrigins: JSON.stringify(validOrigins),
        widgetConfig: widgetConfig ? JSON.stringify(widgetConfig) : null,
        isActive: true,
      },
      include: {
        servicePoint: true,
        surveyVersion: true,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: session.activeOrgId,
      action: "EMBED_CONFIGURATION_CREATED",
      targetType: "SURVEY_PUBLICATION",
      targetId: publication.id,
      details: { name, publicCode, displayMode, allowedOrigins: validOrigins },
    });

    return NextResponse.json(
      {
        success: true,
        message: "สร้างการเชื่อมต่อ Embed สำเร็จ",
        embed: {
          id: publication.id,
          name: publication.name,
          publicCode: publication.publicCode,
          displayMode: publication.displayMode,
          allowedOrigins: validOrigins,
          widgetConfig,
          isActive: publication.isActive,
          createdAt: publication.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create embed error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถสร้าง Embed Configuration ได้", 500);
  }
}
