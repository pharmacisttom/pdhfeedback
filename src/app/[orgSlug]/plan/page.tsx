import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrganizationSubscription, formatSatang } from "@/lib/billing";
import { FEATURE_CATALOGUE, PLAN_FEATURE_MATRIX } from "@/lib/entitlements";
import PlanClientConsole from "./PlanClientConsole";

interface Props {
  params: { orgSlug: string };
}

export default async function PlanPage({ params }: Props) {
  const { orgSlug } = params;
  const session = await getSession();
  if (!session) redirect(`/login?returnUrl=/${orgSlug}/plan`);

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      memberships: {
        where: { userId: session.userId, status: "ACTIVE" },
      },
      billingProfile: true,
      billingOrders: {
        orderBy: { createdAt: "desc" },
        include: {
          paymentEvidence: true,
          billingDocuments: true,
        },
      },
    },
  });

  if (!org) notFound();

  // Membership check
  const isMember = org.memberships.length > 0;
  if (!isMember && !session.isPlatformAdmin) {
    redirect(`/${orgSlug}/dashboard`);
  }

  const userRole = org.memberships[0]?.role || (session.isPlatformAdmin ? "OWNER" : "VIEWER");
  const canManageBilling = ["OWNER", "ADMIN"].includes(userRole) || session.isPlatformAdmin;

  // Resolve active subscription, quotas and effective usage
  const subInfo = await getOrganizationSubscription(org.id);

  // Count current actual service points, active surveys, and team members
  const [servicePointsCount, membersCount, activeSurveysCount] = await Promise.all([
    prisma.servicePoint.count({ where: { organizationId: org.id, isArchived: false } }),
    prisma.membership.count({ where: { organizationId: org.id, status: "ACTIVE" } }),
    prisma.surveyPublication.count({ where: { organizationId: org.id, isActive: true } }),
  ]);

  // Fetch bank settings for manual transfer & PromptPay
  const settings = await prisma.platformSetting.findMany();
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  const platformBankInfo = {
    bankName: settingsMap.get("bank_name") || "ธนาคารกสิกรไทย (KBANK)",
    accountNumber: settingsMap.get("bank_account_number") || "012-3-45678-9",
    accountName: settingsMap.get("bank_account_name") || "บจก. ทอมวิส ดิจิทัล (Tomvis Digital Co., Ltd.)",
    promptPayId: settingsMap.get("promptpay_id") || "0105566012345",
  };

  return (
    <PlanClientConsole
      orgSlug={orgSlug}
      organization={org}
      userRole={userRole}
      canManageBilling={canManageBilling}
      subInfo={subInfo}
      actualCounts={{
        servicePoints: servicePointsCount,
        members: membersCount,
        activeSurveys: activeSurveysCount,
        responses: subInfo?.monthlyUsage || 0,
      }}
      orders={org.billingOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        planCode: o.planCodeSnapshot,
        planName: o.planNameSnapshot,
        billingInterval: o.billingInterval,
        amountSatang: o.amountSatang,
        netAmountSatang: o.netAmountSatang,
        status: o.status,
        expiresAt: o.expiresAt.toISOString(),
        reviewedAt: o.reviewedAt?.toISOString() || null,
        rejectionReason: o.rejectionReason,
        createdAt: o.createdAt.toISOString(),
        hasEvidence: Boolean(o.paymentEvidence),
        evidenceId: o.paymentEvidence?.id || null,
        hasReceipt: o.billingDocuments.some((d) => d.documentType === "RECEIPT" && d.status === "VALID"),
      }))}
      billingProfile={org.billingProfile}
      platformBankInfo={platformBankInfo}
    />
  );
}
