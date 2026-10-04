import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBillingMode } from "@/lib/billing-config";
import PlatformBillingClient from "./PlatformBillingClient";

export default async function PlatformBillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!session.isPlatformAdmin) {
    redirect("/");
  }

  // 1. Fetch all organizations for admin access grants
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  // 2. Fetch all billing orders with relations
  const orders = await prisma.billingOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
      paymentEvidence: true,
      billingDocuments: true,
      plan: true,
    },
  });

  // 3. Fetch all subscriptions
  const subscriptions = await prisma.subscription.findMany({
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
      plan: {
        include: {
          prices: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 4. Fetch Plans & Prices
  const plans = await prisma.plan.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      prices: true,
      _count: {
        select: { subscriptions: true },
      },
    },
  });

  // 5. Fetch Platform Settings (Bank Transfer & PromptPay)
  const settings = await prisma.platformSetting.findMany();
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  // 6. Calculate Strict Live Revenue Metrics (in satang)
  // Strictly excludes Admin Grants and Sandbox orders
  let totalCollectedSatang = 0;
  let totalPendingSatang = 0;
  let sandboxCollectedSatang = 0;
  let mrrSatang = 0;

  orders.forEach((o) => {
    if (o.isSandbox) {
      if (o.status === "APPROVED") {
        sandboxCollectedSatang += o.netAmountSatang;
      }
      return; // Do not mix with live revenue
    }

    if (o.status === "APPROVED") {
      totalCollectedSatang += o.netAmountSatang;
    } else if (["PENDING_PAYMENT", "UNDER_REVIEW"].includes(o.status)) {
      totalPendingSatang += o.netAmountSatang;
    }
  });

  const now = new Date();
  subscriptions.forEach((sub) => {
    // Only PAID active subscriptions count towards MRR/ARR
    // Administrative Access Grants and Sandbox subscriptions do NOT contribute to MRR
    if (
      sub.status === "ACTIVE" &&
      sub.subscriptionType === "PAID" &&
      !sub.isSandbox &&
      sub.currentPeriodEnd >= now &&
      sub.plan
    ) {
      const prices = sub.plan.prices;
      if (sub.billingInterval === "MONTHLY") {
        const monthlyPrice = prices.find((p) => p.billingInterval === "MONTHLY")?.priceSatang || 0;
        mrrSatang += monthlyPrice;
      } else if (sub.billingInterval === "ANNUAL") {
        const annualPrice = prices.find((p) => p.billingInterval === "ANNUAL")?.priceSatang || 0;
        mrrSatang += Math.round(annualPrice / 12);
      }
    }
  });

  const arrSatang = mrrSatang * 12;
  const adminGrantsCount = subscriptions.filter(
    (s) => s.subscriptionType === "ADMIN_GRANT" && s.status === "ACTIVE"
  ).length;

  return (
    <PlatformBillingClient
      adminUser={{
        userId: session.userId,
        fullName: session.fullName,
        email: session.email,
      }}
      billingMode={getBillingMode()}
      metrics={{
        totalCollectedSatang,
        totalPendingSatang,
        sandboxCollectedSatang,
        mrrSatang,
        arrSatang,
        pendingReviewCount: orders.filter((o) => o.status === "UNDER_REVIEW").length,
        activeSubscriptionsCount: subscriptions.filter(
          (s) => s.status === "ACTIVE" && s.currentPeriodEnd >= now
        ).length,
        adminGrantsCount,
      }}
      organizations={organizations}
      orders={orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        orgName: o.organization.name,
        orgSlug: o.organization.slug,
        planCode: o.planCodeSnapshot,
        planName: o.planNameSnapshot,
        billingInterval: o.billingInterval,
        amountSatang: o.amountSatang,
        netAmountSatang: o.netAmountSatang,
        status: o.status,
        isSandbox: Boolean(o.isSandbox),
        notes: o.notes,
        rejectionReason: o.rejectionReason,
        createdAt: o.createdAt.toISOString(),
        reviewedAt: o.reviewedAt?.toISOString() || null,
        evidence: o.paymentEvidence
          ? {
              id: o.paymentEvidence.id,
              fileName: o.paymentEvidence.fileName,
              fileSize: o.paymentEvidence.fileSize,
              mimeType: o.paymentEvidence.mimeType,
              transferredAt: o.paymentEvidence.transferredAt?.toISOString() || null,
              userNotes: o.paymentEvidence.userNotes,
            }
          : null,
        hasReceipt: o.billingDocuments.some(
          (d) => d.documentType === "RECEIPT" && d.status === "VALID"
        ),
      }))}
      subscriptions={subscriptions.map((s) => ({
        id: s.id,
        orgId: s.organizationId,
        orgName: s.organization.name,
        orgSlug: s.organization.slug,
        planCode: s.plan.code,
        planName: s.plan.name,
        status: s.status,
        subscriptionType: s.subscriptionType || "PAID",
        fallbackPlanCode: s.fallbackPlanCode || "FREE",
        isSandbox: Boolean(s.isSandbox),
        billingInterval: s.billingInterval,
        currentPeriodStart: s.currentPeriodStart.toISOString(),
        currentPeriodEnd: s.currentPeriodEnd.toISOString(),
        anchorDay: s.anchorDay,
      }))}
      plans={plans.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        maxServicePoints: p.maxServicePoints,
        maxMembers: p.maxMembers,
        maxActiveSurveys: p.maxActiveSurveys,
        monthlyResponseQuota: p.monthlyResponseQuota,
        subscriptionsCount: p._count.subscriptions,
        prices: p.prices.map((pr) => ({
          interval: pr.billingInterval,
          priceSatang: pr.priceSatang,
        })),
      }))}
      bankSettings={{
        bankName: settingsMap.get("bank_name") || "",
        accountNumber: settingsMap.get("bank_account_number") || "",
        accountName: settingsMap.get("bank_account_name") || "",
        promptPayId: settingsMap.get("promptpay_id") || "",
      }}
    />
  );
}
