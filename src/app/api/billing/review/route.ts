import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { calculateNextPeriodEnd } from "@/lib/billing";

const ReviewSchema = z.object({
  orderId: z.string(),
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    if (!user.isPlatformAdmin) {
      return NextResponse.json(
        { error: "เฉพาะผู้ดูแลระบบแพลตฟอร์ม (Platform Admin) เท่านั้นที่สามารถตรวจสอบและอนุมัติการชำระเงินได้" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = ReviewSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "ข้อมูลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { orderId, action, rejectionReason } = parseResult.data;

    if (action === "REJECT" && (!rejectionReason || rejectionReason.trim().length === 0)) {
      return NextResponse.json(
        { error: "กรุณาระบุเหตุผลการปฏิเสธหลักฐานการชำระเงิน" },
        { status: 400 }
      );
    }

    const order = await prisma.billingOrder.findUnique({
      where: { id: orderId },
      include: {
        organization: {
          include: {
            subscription: true,
            billingProfile: true,
          },
        },
        plan: true,
        paymentEvidence: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ไม่พบคำสั่งซื้อนี้" }, { status: 404 });
    }

    if (order.status === "APPROVED") {
      return NextResponse.json(
        { error: "คำสั่งซื้อนี้ได้รับการอนุมัติไปแล้ว ไม่สามารถดำเนินการซ้ำได้" },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === "APPROVE") {
      await prisma.$transaction(async (tx) => {
        // 1. Update Order status
        await tx.billingOrder.update({
          where: { id: order.id },
          data: {
            status: "APPROVED",
            reviewedAt: now,
            reviewedByUserId: user.id,
            rejectionReason: null,
          },
        });

        // 2. Resolve / Extend Subscription
        const existingSub = order.organization.subscription;
        const interval = order.billingInterval as "MONTHLY" | "ANNUAL";

        let newStart = now;
        let newEnd: Date;

        if (existingSub && existingSub.status === "ACTIVE" && existingSub.currentPeriodEnd > now) {
          // Extend from existing period end
          newStart = existingSub.currentPeriodStart;
          newEnd = calculateNextPeriodEnd(interval, existingSub.currentPeriodEnd, existingSub.anchorDay);
        } else {
          // Fresh activation
          newStart = now;
          newEnd = calculateNextPeriodEnd(interval, now, now.getDate());
        }

        if (existingSub) {
          await tx.subscription.update({
            where: { id: existingSub.id },
            data: {
              planId: order.planId,
              status: "ACTIVE",
              billingInterval: interval,
              currentPeriodStart: newStart,
              currentPeriodEnd: newEnd,
              cancelAtPeriodEnd: false,
              canceledAt: null,
            },
          });
        } else {
          await tx.subscription.create({
            data: {
              organizationId: order.organizationId,
              planId: order.planId,
              status: "ACTIVE",
              billingInterval: interval,
              currentPeriodStart: newStart,
              currentPeriodEnd: newEnd,
              anchorDay: now.getDate(),
            },
          });
        }

        // 3. Update organization tier & limits
        await tx.organization.update({
          where: { id: order.organizationId },
          data: {
            planTier: order.planCodeSnapshot,
            maxServicePoints: order.plan.maxServicePoints,
            maxMonthlyResponses: order.plan.monthlyResponseQuota,
          },
        });

        // 4. Generate Billing Document (RECEIPT)
        const docCount = await tx.billingDocument.count();
        const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
        const docNumber = `REC-${yearMonth}-${String(docCount + 1).padStart(4, "0")}`;

        const bp = order.organization.billingProfile;
        await tx.billingDocument.create({
          data: {
            documentNumber: docNumber,
            documentType: "RECEIPT",
            organizationId: order.organizationId,
            billingOrderId: order.id,
            title: `ใบยืนยันการชำระเงินค่าบริการแพ็กเกจ ${order.planNameSnapshot}`,
            status: "VALID",
            amountSatang: order.amountSatang,
            taxSatang: order.taxSatang,
            netAmountSatang: order.netAmountSatang,
            customerName: bp?.companyName || order.organization.name,
            customerAddress: bp?.address || null,
            customerTaxId: bp?.taxId || null,
            issuedAt: now,
          },
        });
      });

      await logAuditEvent({
        organizationId: order.organizationId,
        userId: user.id,
        userEmail: user.email,
        action: "PAYMENT_ORDER_APPROVED",
        targetType: "BILLING_ORDER",
        targetId: order.id,
        details: `Approved billing order ${order.orderNumber} for plan ${order.planCodeSnapshot} (${order.billingInterval})`,
      });

      return NextResponse.json({
        success: true,
        message: `อนุมัติคำสั่งซื้อ ${order.orderNumber} และเปิดใช้งานสิทธิ์แพ็กเกจเรียบร้อยแล้ว`,
      });
    } else {
      // REJECT action
      await prisma.billingOrder.update({
        where: { id: order.id },
        data: {
          status: "REJECTED",
          reviewedAt: now,
          reviewedByUserId: user.id,
          rejectionReason: rejectionReason?.trim(),
        },
      });

      await logAuditEvent({
        organizationId: order.organizationId,
        userId: user.id,
        userEmail: user.email,
        action: "PAYMENT_ORDER_REJECTED",
        targetType: "BILLING_ORDER",
        targetId: order.id,
        details: `Rejected billing order ${order.orderNumber}. Reason: ${rejectionReason}`,
      });

      return NextResponse.json({
        success: true,
        message: `ปฏิเสธคำสั่งซื้อ ${order.orderNumber} เรียบร้อยแล้ว`,
      });
    }
  } catch (err: any) {
    console.error("Review payment error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการประมวลผลคำสั่งซื้อ" }, { status: 500 });
  }
}
