import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { SEED_PLANS } from "@/lib/billing";

import { isBillingDisabled, isSandboxMode, BILLING_DISABLED_API_ERROR } from "@/lib/billing-config";

const CreateOrderSchema = z.object({
  organizationId: z.string(),
  planCode: z.enum(["STARTER", "PROFESSIONAL", "BUSINESS"]),
  billingInterval: z.enum(["MONTHLY", "ANNUAL"]),
  notes: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Check if billing system is disabled
    if (isBillingDisabled()) {
      return NextResponse.json(
        {
          error: BILLING_DISABLED_API_ERROR,
          billingMode: "disabled",
        },
        { status: 403 }
      );
    }

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = CreateOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "ข้อมูลคำสั่งซื้อไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { organizationId, planCode, billingInterval, notes } = parseResult.data;

    // Check organization membership & role (Must be OWNER or ADMIN)
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
      include: { organization: true },
    });

    if (!membership && !user.isPlatformAdmin) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึงองค์กรนี้" }, { status: 403 });
    }

    if (membership && !["OWNER", "ADMIN"].includes(membership.role) && !user.isPlatformAdmin) {
      return NextResponse.json(
        { error: "เฉพาะผู้ดูแลระบบ (Owner หรือ Admin) เท่านั้นที่สามารถสั่งซื้อแพ็กเกจได้" },
        { status: 403 }
      );
    }

    // Resolve plan and price from database
    const plan = await prisma.plan.findUnique({
      where: { code: planCode },
      include: {
        prices: {
          where: { billingInterval, isActive: true },
        },
      },
    });

    if (!plan || plan.prices.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลแพ็กเกจหรือราคาที่เลือกในระบบ" },
        { status: 404 }
      );
    }

    const priceRecord = plan.prices[0];
    const amountSatang = priceRecord.priceSatang;

    // Generate unique order number: ORD-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const orderCount = await prisma.billingOrder.count();
    const orderNumber = `ORD-${yearMonth}-${String(orderCount + 1).padStart(4, "0")}`;

    // Order expires in 7 days
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const order = await prisma.billingOrder.create({
      data: {
        orderNumber,
        organizationId,
        planId: plan.id,
        planPriceId: priceRecord.id,
        planCodeSnapshot: plan.code,
        planNameSnapshot: `${plan.name} (${billingInterval === "ANNUAL" ? "รายปี" : "รายเดือน"})`,
        billingInterval,
        amountSatang,
        taxSatang: 0, // Not subject to VAT currently
        netAmountSatang: amountSatang,
        currency: "THB",
        status: "PENDING_PAYMENT",
        paymentMethod: "BANK_TRANSFER",
        isSandbox: isSandboxMode(),
        notes: notes?.trim() || null,
        expiresAt,
      },
    });

    await logAuditEvent({
      organizationId,
      userId: user.id,
      userEmail: user.email,
      action: "BILLING_ORDER_CREATED",
      targetType: "BILLING_ORDER",
      targetId: order.id,
      details: `Created billing order ${orderNumber} for plan ${planCode} (${billingInterval}) - ${amountSatang / 100} THB`,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        planCode: order.planCodeSnapshot,
        planName: order.planNameSnapshot,
        billingInterval: order.billingInterval,
        amountSatang: order.amountSatang,
        netAmountSatang: order.netAmountSatang,
        status: order.status,
        expiresAt: order.expiresAt,
      },
    });
  } catch (err: any) {
    console.error("Create billing order error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ" }, { status: 500 });
  }
}
