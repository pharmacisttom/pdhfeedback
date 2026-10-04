import { prisma } from "./prisma";
import {
  FeatureKey,
  FEATURE_CATALOGUE,
  PLAN_FEATURE_MATRIX,
  PlanLimits,
} from "./entitlements";
import { isBillingDisabled, isSandboxMode } from "./billing-config";
import { logAuditEvent } from "./audit";

export interface PlanPricingInfo {
  code: string;
  name: string;
  description: string;
  displayOrder: number;
  monthlySatang: number;
  annualSatang: number;
  limits: PlanLimits;
  features: FeatureKey[];
}

export const SEED_PLANS: PlanPricingInfo[] = [
  {
    code: "FREE",
    name: "Free",
    description: "สำหรับทดลองใช้ 1 จุดบริการ เริ่มต้นรับฟังเสียงผู้รับบริการทันที",
    displayOrder: 1,
    monthlySatang: 0,
    annualSatang: 0,
    limits: PLAN_FEATURE_MATRIX.FREE.limits,
    features: PLAN_FEATURE_MATRIX.FREE.features,
  },
  {
    code: "STARTER",
    name: "Starter",
    description: "สำหรับคลินิก ร้านค้า สหกรณ์ หรือหน่วยงานขนาดเล็ก",
    displayOrder: 2,
    monthlySatang: 29900, // 299 THB
    annualSatang: 299000, // 2,990 THB (~249 THB/mo)
    limits: PLAN_FEATURE_MATRIX.STARTER.limits,
    features: PLAN_FEATURE_MATRIX.STARTER.features,
  },
  {
    code: "PROFESSIONAL",
    name: "Professional",
    description: "สำหรับโรงพยาบาลชุมชน ศูนย์บริการสาธารณสุข หรือธุรกิจบริการหลายจุด",
    displayOrder: 3,
    monthlySatang: 79900, // 799 THB
    annualSatang: 799000, // 7,990 THB (~665 THB/mo)
    limits: PLAN_FEATURE_MATRIX.PROFESSIONAL.limits,
    features: PLAN_FEATURE_MATRIX.PROFESSIONAL.features,
  },
  {
    code: "BUSINESS",
    name: "Business",
    description: "สำหรับโรงพยาบาลทั่วไป องค์กรขนาดใหญ่ หรือเครือข่ายหลายสาขา",
    displayOrder: 4,
    monthlySatang: 199000, // 1,990 THB
    annualSatang: 1990000, // 19,900 THB (~1,658 THB/mo)
    limits: PLAN_FEATURE_MATRIX.BUSINESS.limits,
    features: PLAN_FEATURE_MATRIX.BUSINESS.features,
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    description: "สำหรับองค์กรขนาดใหญ่ เครือข่ายสุขภาพระดับเขต หรือระบบภาครัฐ",
    displayOrder: 5,
    monthlySatang: 0, // Custom quote
    annualSatang: 0,
    limits: PLAN_FEATURE_MATRIX.ENTERPRISE.limits,
    features: PLAN_FEATURE_MATRIX.ENTERPRISE.features,
  },
];

/**
 * Format Satang integer into standard Thai Baht display
 * e.g. 29900 -> "299" or "299.00"
 */
export function formatSatang(satang: number, showDecimals: boolean = false): string {
  const baht = satang / 100;
  if (!showDecimals && satang % 100 === 0) {
    return new Intl.NumberFormat("th-TH").format(baht);
  }
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(baht);
}

/**
 * Returns the last day of a given year and month (1-indexed month: 1=Jan, 12=Dec)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Monthly quota window calculation based on subscription anchor day.
 */
export function getCurrentMonthlyQuotaWindow(
  anchorDay: number,
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth(); // 0-indexed (0=Jan)
  const refDate = referenceDate.getDate();

  const daysInCurrentMonth = getDaysInMonth(refYear, refMonth + 1);
  const clampedAnchorCurrentMonth = Math.min(anchorDay, daysInCurrentMonth);

  let startYear = refYear;
  let startMonth = refMonth;

  if (refDate >= clampedAnchorCurrentMonth) {
    startYear = refYear;
    startMonth = refMonth;
  } else {
    if (refMonth === 0) {
      startYear = refYear - 1;
      startMonth = 11;
    } else {
      startMonth = refMonth - 1;
    }
  }

  const daysInStartMonth = getDaysInMonth(startYear, startMonth + 1);
  const clampedStartDay = Math.min(anchorDay, daysInStartMonth);

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endYear = startYear + 1;
    endMonth = 0;
  }

  const daysInEndMonth = getDaysInMonth(endYear, endMonth + 1);
  const clampedEndDay = Math.min(anchorDay, daysInEndMonth);

  const start = new Date(startYear, startMonth, clampedStartDay, 0, 0, 0, 0);
  const end = new Date(endYear, endMonth, clampedEndDay, 0, 0, 0, 0);

  return { start, end };
}

/**
 * Calculates next subscription period end given interval and anchor day
 */
export function calculateNextPeriodEnd(
  interval: "MONTHLY" | "ANNUAL",
  startDate: Date = new Date(),
  anchorDay?: number
): Date {
  const result = new Date(startDate.getTime());
  const day = anchorDay ?? startDate.getDate();

  if (interval === "MONTHLY") {
    let year = result.getFullYear();
    let month = result.getMonth() + 1;
    if (month > 11) {
      year += 1;
      month = 0;
    }
    const daysInMonth = getDaysInMonth(year, month + 1);
    const clampedDay = Math.min(day, daysInMonth);
    return new Date(year, month, clampedDay, 23, 59, 59, 999);
  } else {
    const year = result.getFullYear() + 1;
    const month = result.getMonth();
    const daysInMonth = getDaysInMonth(year, month + 1);
    const clampedDay = Math.min(day, daysInMonth);
    return new Date(year, month, clampedDay, 23, 59, 59, 999);
  }
}

export interface SerializedSubscriptionInfo {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  isActive: boolean;
  planCode: string;
  planName: string;
  subscriptionType: "ADMIN_GRANT" | "PAID";
  isGrant: boolean;
  isPerpetual: boolean;
  adminOverrideReason: string | null;
  billingInterval: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  anchorDay: number;
  quotaWindow: {
    start: string;
    end: string;
  };
  limits: PlanLimits;
  monthlyUsage: number;
  remainingResponses: number;
  allFeatures: FeatureKey[];
}

/**
 * Resolves effective subscription, entitlements, and quotas for an organization.
 * 
 * Resolution Priority Hierarchy:
 * 1. Administrative Access Grant (`subscriptionType === "ADMIN_GRANT"`):
 *    - If within granted validity window: grant overrides all paid checks.
 *    - If expired: falls back safely to `fallbackPlanCode` (default FREE) without deleting tenant data.
 * 2. Active Paid Subscription (`subscriptionType === "PAID"`):
 *    - If within paid validity window, uses paid plan.
 *    - If billing is globally disabled, paid subscription remains active and never suspends tenant.
 * 3. Default Fallback: FREE tier.
 */
export async function getOrganizationSubscription(
  organizationId: string
): Promise<SerializedSubscriptionInfo | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: {
        include: {
          plan: {
            include: {
              prices: true,
            },
          },
        },
      },
    },
  });

  if (!org) return null;

  const now = new Date();
  const sub = org.subscription;

  let planCode = "FREE";
  let subscriptionType: "ADMIN_GRANT" | "PAID" = "ADMIN_GRANT";
  let isGrant = false;
  let isPerpetual = false;
  let isActive = true;

  if (sub && sub.status === "ACTIVE") {
    if (sub.subscriptionType === "ADMIN_GRANT") {
      // Priority 1: Admin Grant
      const isExpired = sub.currentPeriodEnd && sub.currentPeriodEnd < now;
      if (!isExpired) {
        planCode = sub.plan?.code || "FREE";
        subscriptionType = "ADMIN_GRANT";
        isGrant = true;
        isPerpetual = sub.currentPeriodEnd.getFullYear() >= 2090;
      } else {
        // Expired grant -> fallback
        planCode = sub.fallbackPlanCode || "FREE";
        subscriptionType = "ADMIN_GRANT";
        isGrant = false;
      }
    } else {
      // Priority 2: Paid Subscription
      const isPaidValid = sub.currentPeriodEnd >= now;
      if (isPaidValid || isBillingDisabled()) {
        planCode = sub.plan?.code || "FREE";
        subscriptionType = "PAID";
        isGrant = false;
      } else {
        planCode = "FREE";
        subscriptionType = "PAID";
      }
    }
  } else {
    // Priority 3: Fallback Free
    planCode = "FREE";
  }

  // Resolve limits and features
  const matrix = PLAN_FEATURE_MATRIX[planCode] || PLAN_FEATURE_MATRIX.FREE;
  const targetPlan = sub?.plan?.code === planCode ? sub.plan : null;

  const limits: PlanLimits = {
    servicePoints: sub?.customServicePointsLimit ?? targetPlan?.maxServicePoints ?? matrix.limits.servicePoints,
    members: sub?.customMembersLimit ?? targetPlan?.maxMembers ?? matrix.limits.members,
    activeSurveys: sub?.customSurveysLimit ?? targetPlan?.maxActiveSurveys ?? matrix.limits.activeSurveys,
    responsesPerMonth:
      sub?.customMonthlyResponseQuota ??
      targetPlan?.monthlyResponseQuota ??
      matrix.limits.responsesPerMonth,
  };

  let planFeatures: FeatureKey[] = [];
  try {
    if (targetPlan?.features) {
      planFeatures = JSON.parse(targetPlan.features);
    }
  } catch {
    planFeatures = matrix.features;
  }
  if (planFeatures.length === 0) {
    planFeatures = matrix.features;
  }

  const featuresSet = new Set<FeatureKey>(planFeatures);

  if (sub?.customFeatures) {
    try {
      const custom: FeatureKey[] = JSON.parse(sub.customFeatures);
      custom.forEach((f) => featuresSet.add(f));
    } catch {
      // ignore JSON parse error
    }
  }

  // Quota window
  const anchorDay = sub?.anchorDay ?? 1;
  const quotaWindow = getCurrentMonthlyQuotaWindow(anchorDay, now);

  const monthlyUsage = await prisma.response.count({
    where: {
      organizationId,
      submittedAt: {
        gte: quotaWindow.start,
        lt: quotaWindow.end,
      },
    },
  });

  const periodStart = sub?.currentPeriodStart ?? now;
  const periodEnd = sub?.currentPeriodEnd ?? quotaWindow.end;

  return {
    organizationId: org.id,
    organizationName: org.name,
    organizationSlug: org.slug,
    isActive,
    planCode,
    planName: targetPlan?.name ?? (planCode === "FREE" ? "Free" : planCode),
    subscriptionType,
    isGrant,
    isPerpetual,
    adminOverrideReason: sub?.adminOverrideReason || null,
    billingInterval: sub?.billingInterval ?? "MONTHLY",
    currentPeriodStart: periodStart.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    anchorDay,
    quotaWindow: {
      start: quotaWindow.start.toISOString(),
      end: quotaWindow.end.toISOString(),
    },
    limits,
    monthlyUsage,
    remainingResponses: Math.max(0, limits.responsesPerMonth - monthlyUsage),
    allFeatures: Array.from(featuresSet),
  };
}

/**
 * Guard check: checks if organization has feature entitlement
 */
export async function requireFeature(
  organizationId: string,
  feature: FeatureKey
): Promise<{ allowed: boolean; error?: string }> {
  const meta = FEATURE_CATALOGUE[feature];
  if (meta && meta.status === "COMING_SOON") {
    return {
      allowed: false,
      error: `ฟีเจอร์ '${meta.name}' อยู่ระหว่างการพัฒนา (Coming Soon) และยังไม่เปิดให้ใช้งาน`,
    };
  }

  const sub = await getOrganizationSubscription(organizationId);
  if (!sub || !sub.allFeatures.includes(feature)) {
    return {
      allowed: false,
      error: `ฟีเจอร์ '${meta?.name || feature}' จำเป็นต้องอัปเกรดเป็นแพ็กเกจที่สูงขึ้น กรุณาตรวจสอบแพ็กเกจของคุณ`,
    };
  }

  return { allowed: true };
}

/**
 * Platform Admin function to grant plan access without payment (Administrative Access Grant)
 * Does NOT generate billing orders, payments, or revenue.
 */
export async function grantAdministrativeAccess(params: {
  organizationId: string;
  planCode: string;
  expiresAt?: Date | null;
  reason: string;
  adminUserId: string;
  adminEmail: string;
  fallbackPlanCode?: string;
  customLimits?: Partial<PlanLimits>;
}) {
  const {
    organizationId,
    planCode,
    expiresAt,
    reason,
    adminUserId,
    adminEmail,
    fallbackPlanCode = "FREE",
    customLimits,
  } = params;

  const plan = await prisma.plan.findUnique({
    where: { code: planCode },
  });

  if (!plan) {
    throw new Error(`ไม่พบแพ็กเกจ ${planCode} ในระบบ`);
  }

  const now = new Date();
  const effectiveEnd = expiresAt ?? new Date("2099-12-31T23:59:59Z"); // Perpetual if null

  const existingSub = await prisma.subscription.findUnique({
    where: { organizationId },
  });

  let subscription;
  if (existingSub) {
    subscription = await prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        planId: plan.id,
        subscriptionType: "ADMIN_GRANT",
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: effectiveEnd,
        fallbackPlanCode,
        adminOverrideReason: reason,
        adminOverrideExpiresAt: expiresAt ?? null,
        isSandbox: false,
        customServicePointsLimit: customLimits?.servicePoints ?? null,
        customMembersLimit: customLimits?.members ?? null,
        customSurveysLimit: customLimits?.activeSurveys ?? null,
        customMonthlyResponseQuota: customLimits?.responsesPerMonth ?? null,
      },
      include: {
        plan: true,
      },
    });
  } else {
    subscription = await prisma.subscription.create({
      data: {
        organizationId,
        planId: plan.id,
        subscriptionType: "ADMIN_GRANT",
        status: "ACTIVE",
        billingInterval: "ANNUAL",
        currentPeriodStart: now,
        currentPeriodEnd: effectiveEnd,
        anchorDay: 1,
        fallbackPlanCode,
        adminOverrideReason: reason,
        adminOverrideExpiresAt: expiresAt ?? null,
        isSandbox: false,
        customServicePointsLimit: customLimits?.servicePoints ?? null,
        customMembersLimit: customLimits?.members ?? null,
        customSurveysLimit: customLimits?.activeSurveys ?? null,
        customMonthlyResponseQuota: customLimits?.responsesPerMonth ?? null,
      },
      include: {
        plan: true,
      },
    });
  }

  // Update Organization tier & limits
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      planTier: plan.code,
      maxServicePoints: customLimits?.servicePoints ?? plan.maxServicePoints,
      maxMonthlyResponses: customLimits?.responsesPerMonth ?? plan.monthlyResponseQuota,
    },
  });

  // Log Audit trail
  await logAuditEvent({
    organizationId,
    userId: adminUserId,
    userEmail: adminEmail,
    action: "ADMIN_ACCESS_GRANT_ISSUED",
    targetType: "SUBSCRIPTION",
    targetId: subscription.id,
    details: `Platform admin issued Administrative Access Grant: Plan ${plan.code} until ${expiresAt ? expiresAt.toISOString() : 'perpetual'}. Reason: ${reason}`,
  });

  return subscription;
}

// -----------------------------------------------------------------------------
// PromptPay EMVCo QR Code Payload Generator
// -----------------------------------------------------------------------------

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  const hex = crc.toString(16).toUpperCase();
  return hex.padStart(4, "0");
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(
  target: string,
  amountSatang?: number
): string {
  const cleaned = target.replace(/[^0-9]/g, "");

  let targetField = "";
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    const formatted = "0066" + cleaned.substring(1);
    targetField = emvField("01", formatted);
  } else if (cleaned.length === 13) {
    targetField = emvField("02", cleaned);
  } else {
    const formatted = cleaned.startsWith("66") ? "00" + cleaned : "0066" + cleaned;
    targetField = emvField("01", formatted);
  }

  const maiValue = emvField("00", "A000000677010111") + targetField;
  const mai = emvField("29", maiValue);

  let payload = "";
  payload += emvField("00", "01");
  payload += emvField("01", amountSatang && amountSatang > 0 ? "12" : "11");
  payload += mai;
  payload += emvField("53", "764");

  if (amountSatang && amountSatang > 0) {
    const bahtStr = (amountSatang / 100).toFixed(2);
    payload += emvField("54", bahtStr);
  }

  payload += emvField("58", "TH");
  payload += "6304";

  const checksum = crc16(payload);
  return payload + checksum;
}
