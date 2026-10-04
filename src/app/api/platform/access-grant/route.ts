import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { grantAdministrativeAccess } from "@/lib/billing";

const AccessGrantSchema = z.object({
  organizationId: z.string(),
  planCode: z.enum(["FREE", "STARTER", "PROFESSIONAL", "BUSINESS", "ENTERPRISE"]),
  expiresAt: z.string().nullable().optional(),
  reason: z.string().min(3, "กรุณาระบุเหตุผลการมอบสิทธิ์"),
  fallbackPlanCode: z.enum(["FREE", "STARTER", "PROFESSIONAL", "BUSINESS"]).optional(),
  customLimits: z
    .object({
      servicePoints: z.number().int().positive().optional(),
      members: z.number().int().positive().optional(),
      activeSurveys: z.number().int().positive().optional(),
      responsesPerMonth: z.number().int().positive().optional(),
    })
    .optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.isPlatformAdmin) {
      return NextResponse.json(
        { error: "เฉพาะผู้ดูแลระบบแพลตฟอร์ม (Platform Admin) เท่านั้นที่สามารถมอบสิทธิ์ใช้งานได้" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = AccessGrantSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const {
      organizationId,
      planCode,
      expiresAt,
      reason,
      fallbackPlanCode,
      customLimits,
    } = parseResult.data;

    const parsedExpiry = expiresAt ? new Date(expiresAt) : null;

    const subscription = await grantAdministrativeAccess({
      organizationId,
      planCode,
      expiresAt: parsedExpiry,
      reason,
      adminUserId: user.id,
      adminEmail: user.email,
      fallbackPlanCode,
      customLimits,
    });

    return NextResponse.json({
      success: true,
      message: `มอบสิทธิ์แพ็กเกจ ${planCode} ให้แก่องค์กรเรียบร้อยแล้ว (Administrative Access Grant)`,
      subscription: {
        id: subscription.id,
        planCode,
        subscriptionType: subscription.subscriptionType,
        status: subscription.status,
        expiresAt: parsedExpiry ? parsedExpiry.toISOString() : null,
        reason,
      },
    });
  } catch (err: any) {
    console.error("Access grant error:", err);
    return NextResponse.json(
      { error: err.message || "เกิดข้อผิดพลาดในการมอบสิทธิ์" },
      { status: 500 }
    );
  }
}
