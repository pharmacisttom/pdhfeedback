import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getOrganizationSubscription } from "@/lib/billing";
import { generateApiKeySecret, apiError, ApiScope } from "@/lib/api-auth";
import { logAuditEvent } from "@/lib/audit";

const CreateApiKeySchema = z.object({
  name: z.string().min(2, "ชื่อ API Key ต้องมีอย่างน้อย 2 ตัวอักษร").max(100),
  scopes: z.array(z.string()).min(1, "ต้องเลือกอย่างน้อย 1 Scope"),
  servicePointId: z.string().optional().nullable(),
  expiresInDays: z.number().int().min(1).max(365).optional().nullable(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.activeOrgId) {
      return apiError("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
    }

    const isPrivileged = session.isPlatformAdmin || session.activeRole === "OWNER" || session.activeRole === "ADMIN";
    if (!isPrivileged) {
      return apiError("FORBIDDEN", "คุณไม่มีสิทธิ์จัดการ API Keys", 403);
    }

    const keys = await prisma.apiKey.findMany({
      where: { organizationId: session.activeOrgId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      apiKeys: keys.map((k) => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        scopes: k.scopes.split(",").map((s) => s.trim()),
        servicePointId: k.servicePointId,
        expiresAt: k.expiresAt?.toISOString() || null,
        lastUsedAt: k.lastUsedAt?.toISOString() || null,
        isRevoked: k.isRevoked,
        createdAt: k.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("List API Keys error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถดึงข้อมูล API Keys ได้", 500);
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
      return apiError("FORBIDDEN", "เฉพาะผู้ดูแลองค์กร (Owner/Admin) เท่านั้นที่สามารถสร้าง API Key ได้", 403);
    }

    // Check entitlement: api_access
    const subInfo = await getOrganizationSubscription(session.activeOrgId);
    if (!subInfo?.allFeatures.includes("api_access")) {
      return apiError(
        "ENTITLEMENT_REQUIRED",
        "ระบบ REST API Access รองรับเฉพาะแพ็กเกจ Business / Enterprise หรือสิทธิ์ที่ผู้ดูแลระบบมอบให้ (Admin Access Grant)",
        403
      );
    }

    const body = await req.json();
    const result = CreateApiKeySchema.safeParse(body);
    if (!result.success) {
      return apiError("VALIDATION_ERROR", result.error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง", 400);
    }

    const { name, scopes, servicePointId, expiresInDays } = result.data;
    const { rawKey, prefix, hash } = generateApiKeySecret("live");

    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        organizationId: session.activeOrgId,
        name,
        keyPrefix: prefix,
        keyHash: hash,
        scopes: scopes.join(","),
        servicePointId: servicePointId || null,
        expiresAt,
        isRevoked: false,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      userEmail: session.email,
      organizationId: session.activeOrgId,
      action: "API_KEY_CREATED",
      targetType: "API_KEY",
      targetId: apiKey.id,
      details: { name, scopes, keyPrefix: prefix },
    });

    return NextResponse.json(
      {
        success: true,
        message: "สร้าง API Key สำเร็จ กรุณาคัดลอกและจัดเก็บอย่างปลอดภัย ระบบจะไม่แสดงคีย์นี้อีก",
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          rawKey, // Returned ONLY once upon creation!
          scopes,
          expiresAt: apiKey.expiresAt?.toISOString() || null,
          createdAt: apiKey.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create API Key error:", error);
    return apiError("INTERNAL_ERROR", "ไม่สามารถสร้าง API Key ได้", 500);
  }
}
