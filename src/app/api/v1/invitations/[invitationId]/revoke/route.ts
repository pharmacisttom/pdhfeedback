import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { authenticateApiKey, apiError } from "@/lib/api-auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { invitationId: string } }
) {
  try {
    const { invitationId } = params;
    let orgId: string | null = null;
    let userId: string | null = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const authResult = await authenticateApiKey(req, "invitations:write");
      if (!authResult.success) {
        return authResult.response;
      }
      orgId = authResult.organizationId;
    } else {
      const session = await getSession();
      if (!session || !session.activeOrgId) {
        return apiError("UNAUTHORIZED", "ต้องระบุ Bearer API Key หรือเข้าสู่ระบบ", 401);
      }
      orgId = session.activeOrgId;
      userId = session.userId;
    }

    const invitation = await prisma.surveyInvitation.findFirst({
      where: {
        id: invitationId,
        organizationId: orgId,
      },
    });

    if (!invitation) {
      return apiError("INVITATION_NOT_FOUND", "ไม่พบคำเชิญที่ระบุในองค์กรนี้", 404);
    }

    if (invitation.isConsumed) {
      return NextResponse.json({
        success: true,
        message: "คำเชิญนี้ถูกใช้งานหรือเพิกถอนไปก่อนหน้านี้แล้ว",
        invitationId: invitation.id,
        isRevoked: true,
      });
    }

    const updated = await prisma.surveyInvitation.update({
      where: { id: invitation.id },
      data: {
        isConsumed: true,
        consumedAt: new Date(),
      },
    });

    await logAuditEvent({
      userId,
      organizationId: orgId,
      action: "API_REVOKE_SURVEY_INVITATION",
      targetType: "SURVEY_INVITATION",
      targetId: updated.id,
      details: "Invitation revoked via API",
    });

    return NextResponse.json({
      success: true,
      message: "เพิกถอนคำเชิญเรียบร้อยแล้ว",
      invitationId: updated.id,
      isRevoked: true,
    });
  } catch (error) {
    console.error("Revoke invitation error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถเพิกถอนคำเชิญได้", 500);
  }
}
