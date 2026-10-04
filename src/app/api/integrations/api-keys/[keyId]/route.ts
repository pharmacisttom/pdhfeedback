import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateApiKeySecret, apiError } from "@/lib/api-auth";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: { keyId: string } }
) {
  try {
    const { keyId } = params;
    const session = await getSession();
    if (!session || !session.activeOrgId) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const isPrivileged = session.isPlatformAdmin || session.activeRole === "OWNER" || session.activeRole === "ADMIN";
    if (!isPrivileged) {
      return apiError("FORBIDDEN", "คุณไม่มีสิทธิ์เพิกถอน API Key", 403);
    }

    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, organizationId: session.activeOrgId },
    });

    if (!key) {
      return apiError("NOT_FOUND", "ไม่พบ API Key ที่ระบุ", 404);
    }

    const updated = await prisma.apiKey.update({
      where: { id: key.id },
      data: { isRevoked: true },
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: session.activeOrgId,
      action: "API_KEY_REVOKED",
      targetType: "API_KEY",
      targetId: updated.id,
      details: { name: key.name, keyPrefix: key.keyPrefix },
    });

    return NextResponse.json({
      success: true,
      message: "เพิกถอนการใช้งาน API Key สำเร็จ",
      keyId: updated.id,
    });
  } catch (error) {
    console.error("Revoke API Key error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถเพิกถอน API Key ได้", 500);
  }
}

// POST to rotate API key: revokes existing and creates a replacement with identical scopes/settings
export async function POST(
  req: Request,
  { params }: { params: { keyId: string } }
) {
  try {
    const { keyId } = params;
    const session = await getSession();
    if (!session || !session.activeOrgId) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const isPrivileged = session.isPlatformAdmin || session.activeRole === "OWNER" || session.activeRole === "ADMIN";
    if (!isPrivileged) {
      return apiError("FORBIDDEN", "คุณไม่มีสิทธิ์หมุนเวียน (Rotate) API Key", 403);
    }

    const oldKey = await prisma.apiKey.findFirst({
      where: { id: keyId, organizationId: session.activeOrgId },
    });

    if (!oldKey) {
      return apiError("NOT_FOUND", "ไม่พบ API Key ที่ระบุ", 404);
    }

    // Revoke old key
    await prisma.apiKey.update({
      where: { id: oldKey.id },
      data: { isRevoked: true },
    });

    // Create new key with same name & scopes
    const { rawKey, prefix, hash } = generateApiKeySecret("live");

    const newKey = await prisma.apiKey.create({
      data: {
        organizationId: session.activeOrgId,
        name: `${oldKey.name} (Rotated)`,
        keyPrefix: prefix,
        keyHash: hash,
        scopes: oldKey.scopes,
        servicePointId: oldKey.servicePointId,
        expiresAt: oldKey.expiresAt,
        isRevoked: false,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: session.activeOrgId,
      action: "API_KEY_ROTATED",
      targetType: "API_KEY",
      targetId: newKey.id,
      details: {
        oldKeyId: oldKey.id,
        newKeyId: newKey.id,
        newPrefix: prefix,
      },
    });

    return NextResponse.json({
      success: true,
      message: "หมุนเวียน (Rotate) API Key สำเร็จ คีย์เดิมถูกระงับแล้ว กรุณาบันทึกคีย์ใหม่ทันที",
      apiKey: {
        id: newKey.id,
        name: newKey.name,
        keyPrefix: newKey.keyPrefix,
        rawKey, // Returned once!
        scopes: newKey.scopes.split(","),
        createdAt: newKey.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Rotate API Key error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถหมุนเวียน API Key ได้", 500);
  }
}
