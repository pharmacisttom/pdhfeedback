import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashIp } from "@/lib/rate-limiter";
import { logAuditEvent } from "@/lib/audit";

const CreateInvitationSchema = z.object({
  organizationId: z.string(),
  surveyVersionId: z.string(),
  servicePointId: z.string().optional().nullable(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    // Allow either active session or API key authorization
    const authHeader = req.headers.get("authorization");
    let organizationId: string | null = session?.activeOrgId || null;

    if (!session && authHeader?.startsWith("Bearer ")) {
      const apiKeyRaw = authHeader.substring(7);
      const hashedKey = crypto.createHash("sha256").update(apiKeyRaw).digest("hex");
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash: hashedKey },
      });
      if (apiKey && !apiKey.isRevoked && (!apiKey.expiresAt || apiKey.expiresAt > new Date())) {
        organizationId = apiKey.organizationId;
        await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or API Key" }, { status: 401 });
    }

    const body = await req.json();
    const result = CreateInvitationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0]?.message }, { status: 400 });
    }

    const { surveyVersionId, servicePointId, expiresInDays } = result.data;

    // Verify survey version belongs to this organization
    const version = await prisma.surveyVersion.findUnique({
      where: { id: surveyVersionId },
      include: { survey: true, publications: true },
    });

    if (!version || version.survey.organizationId !== organizationId) {
      return NextResponse.json({ error: "แบบประเมินไม่ถูกต้องหรือไม่ตรงกับองค์กร" }, { status: 400 });
    }

    // Generate high-entropy 32-byte random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashIp(rawToken); // salted hash for storage

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invitation = await prisma.surveyInvitation.create({
      data: {
        organizationId,
        surveyVersionId,
        servicePointId: servicePointId || null,
        tokenHash: hashedToken,
        expiresAt,
        isConsumed: false,
      },
    });

    // Find publication public code to assemble clean URL
    const publication = version.publications[0] || (await prisma.surveyPublication.findFirst({
      where: { surveyVersionId, isActive: true },
    }));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const surveyUrl = `${appUrl}/s/${publication?.publicCode || "survey"}?invite=${rawToken}`;

    await logAuditEvent({
      userId: session?.userId || null,
      organizationId,
      action: "GENERATE_SURVEY_INVITATION",
      targetType: "SURVEY_INVITATION",
      targetId: invitation.id,
      details: { expiresInDays },
    });

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
      invitationUrl: surveyUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Generate invitation error:", error);
    return NextResponse.json({ error: "ไม่สามารถสร้างลิงก์คำเชิญได้" }, { status: 500 });
  }
}
