import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { normalizeWebsiteOrigin } from "@/lib/embed-security";
import { apiError } from "@/lib/api-auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Toggle active/revoked
export async function DELETE(
  req: Request,
  { params }: { params: { embedId: string } }
) {
  try {
    const { embedId } = params;
    const session = await getSession();
    if (!session || !session.activeOrgId) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const isPrivileged = session.isPlatformAdmin || session.activeRole === "OWNER" || session.activeRole === "ADMIN";
    if (!isPrivileged) {
      return apiError("FORBIDDEN", "คุณไม่มีสิทธิ์จัดการ Embed Configuration", 403);
    }

    const publication = await prisma.surveyPublication.findFirst({
      where: { id: embedId, organizationId: session.activeOrgId },
    });

    if (!publication) {
      return apiError("NOT_FOUND", "ไม่พบ Embed Configuration ที่ระบุ", 404);
    }

    const updated = await prisma.surveyPublication.update({
      where: { id: publication.id },
      data: {
        isActive: !publication.isActive,
        revokedAt: publication.isActive ? new Date() : null,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: session.activeOrgId,
      action: updated.isActive ? "EMBED_CONFIG_ACTIVATED" : "EMBED_CONFIG_REVOKED",
      targetType: "SURVEY_PUBLICATION",
      targetId: updated.id,
      details: { publicCode: publication.publicCode, isActive: updated.isActive },
    });

    return NextResponse.json({
      success: true,
      message: updated.isActive ? "เปิดใช้งานการเชื่อมต่อแล้ว" : "ระงับการเชื่อมต่อแล้ว",
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error("Toggle embed status error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถเปลี่ยนสถานะ Embed ได้", 500);
  }
}

// POST: Rotate publicCode identifier
export async function POST(
  req: Request,
  { params }: { params: { embedId: string } }
) {
  try {
    const { embedId } = params;
    const session = await getSession();
    if (!session || !session.activeOrgId) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const isPrivileged = session.isPlatformAdmin || session.activeRole === "OWNER" || session.activeRole === "ADMIN";
    if (!isPrivileged) {
      return apiError("FORBIDDEN", "คุณไม่มีสิทธิ์หมุนเวียน (Rotate) รหัส Embed", 403);
    }

    const publication = await prisma.surveyPublication.findFirst({
      where: { id: embedId, organizationId: session.activeOrgId },
    });

    if (!publication) {
      return apiError("NOT_FOUND", "ไม่พบ Embed Configuration ที่ระบุ", 404);
    }

    const newPublicCode = `emb_${crypto.randomBytes(6).toString("hex")}`;

    const updated = await prisma.surveyPublication.update({
      where: { id: publication.id },
      data: {
        publicCode: newPublicCode,
        revokedAt: null,
        isActive: true,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: session.activeOrgId,
      action: "EMBED_CODE_ROTATED",
      targetType: "SURVEY_PUBLICATION",
      targetId: updated.id,
      details: { oldPublicCode: publication.publicCode, newPublicCode },
    });

    return NextResponse.json({
      success: true,
      message: "หมุนเวียน (Rotate) รหัส Embed สำเร็จ รหัสเดิมจะไม่สามารถใช้ได้อีกต่อไป กรุณาอัปเดตโค้ดบนเว็บไซต์ของคุณ",
      newPublicCode,
    });
  } catch (error) {
    console.error("Rotate embed code error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถหมุนเวียนรหัส Embed ได้", 500);
  }
}
