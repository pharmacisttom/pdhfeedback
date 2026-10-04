import { prisma } from "./prisma";
import {
  FeatureKey,
  FEATURE_CATALOGUE,
  PLAN_FEATURE_MATRIX,
  PlanLimits,
} from "./entitlements";

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
 * 
 * Rules:
 * - If anchorDay is 31, and reference month has fewer days (e.g. Feb 28/29, Apr 30),
 *   it clamps to the last day of that month.
 * - Handles leap years correctly (Feb 29 on leap years, Feb 28 on regular years).
 * - Even for annual subscriptions, response quotas reset monthly based on this anchor!
 */
export function getCurrentMonthlyQuotaWindow(
  anchorDay: number,
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth(); // 0-indexed (0=Jan)
  const refDate = referenceDate.getDate();

  // Determine current period start month & year
  // If referenceDate is on or after clamped anchorDay for this month, start is this month.
  // Otherwise, start is previous month.
  const daysInCurrentMonth = getDaysInMonth(refYear, refMonth + 1);
  const clampedAnchorCurrentMonth = Math.min(anchorDay, daysInCurrentMonth);

  let startYear = refYear;
  let startMonth = refMonth;

  if (refDate >= clampedAnchorCurrentMonth) {
    // Current period started this month
    startYear = refYear;
    startMonth = refMonth;
  } else {
    // Current period started last month
    if (refMonth === 0) {
      startYear = refYear - 1;
      startMonth = 11;
    } else {
      startMonth = refMonth - 1;
    }
  }

  const daysInStartMonth = getDaysInMonth(startYear, startMonth + 1);
  const clampedStartDay = Math.min(anchorDay, daysInStartMonth);

  // Next month for period end
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
    // ANNUAL
    const year = result.getFullYear() + 1;
    const month = result.getMonth();
    const daysInMonth = getDaysInMonth(year, month + 1);
    const clampedDay = Math.min(day, daysInMonth);
    return new Date(year, month, clampedDay, 23, 59, 59, 999);
  }
}

/**
 * Resolves active subscription and effective entitlements for an organization
 */
export async function getOrganizationSubscription(organizationId: string) {
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

  // If no subscription or expired/suspended, fall back to FREE tier
  const isActive =
    sub &&
    sub.status === "ACTIVE" &&
    sub.currentPeriodEnd >= now;

  let planCode = "FREE";
  let limits: PlanLimits = { ...PLAN_FEATURE_MATRIX.FREE.limits };
  let features: Set<FeatureKey> = new Set(PLAN_FEATURE_MATRIX.FREE.features);

  if (isActive && sub.plan) {
    planCode = sub.plan.code;
    const matrix = PLAN_FEATURE_MATRIX[planCode] || PLAN_FEATURE_MATRIX.FREE;

    limits = {
      servicePoints: sub.customServicePointsLimit ?? sub.plan.maxServicePoints ?? matrix.limits.servicePoints,
      members: sub.customMembersLimit ?? sub.plan.maxMembers ?? matrix.limits.members,
      activeSurveys: sub.customSurveysLimit ?? sub.plan.maxActiveSurveys ?? matrix.limits.activeSurveys,
      responsesPerMonth:
        sub.customMonthlyResponseQuota ??
        sub.plan.monthlyResponseQuota ??
        matrix.limits.responsesPerMonth,
    };

    // Parse features from plan record and matrix
    let planFeatures: FeatureKey[] = [];
    try {
      if (sub.plan.features) {
        planFeatures = JSON.parse(sub.plan.features);
      }
    } catch {
      planFeatures = matrix.features;
    }
    if (planFeatures.length === 0) {
      planFeatures = matrix.features;
    }

    features = new Set(planFeatures);

    // Apply custom feature overrides if present
    if (sub.customFeatures) {
      try {
        const custom: FeatureKey[] = JSON.parse(sub.customFeatures);
        custom.forEach((f) => features.add(f));
      } catch {
        // ignore JSON parse error
      }
    }
  }

  // Calculate monthly quota window
  const anchorDay = sub?.anchorDay ?? 1;
  const quotaWindow = getCurrentMonthlyQuotaWindow(anchorDay, now);

  // Count responses recorded within this billing month window
  const monthlyUsage = await prisma.response.count({
    where: {
      organizationId,
      submittedAt: {
        gte: quotaWindow.start,
        lt: quotaWindow.end,
      },
    },
  });

  return {
    organization: org,
    subscription: sub,
    isActive: Boolean(isActive),
    planCode,
    planName: sub?.plan?.name ?? (planCode === "FREE" ? "Free" : planCode),
    billingInterval: sub?.billingInterval ?? "MONTHLY",
    currentPeriodStart: sub?.currentPeriodStart ?? now,
    currentPeriodEnd: sub?.currentPeriodEnd ?? quotaWindow.end,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    anchorDay,
    quotaWindow,
    limits,
    monthlyUsage,
    remainingResponses: Math.max(0, limits.responsesPerMonth - monthlyUsage),
    hasFeature: (key: FeatureKey) => features.has(key),
    allFeatures: Array.from(features),
  };
}

/**
 * Guard check: throws or returns error response if feature is not entitled
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
  if (!sub || !sub.hasFeature(feature)) {
    return {
      allowed: false,
      error: `ฟีเจอร์ '${meta?.name || feature}' จำเป็นต้องอัปเกรดเป็นแพ็กเกจที่สูงขึ้น กรุณาตรวจสอบแพ็กเกจของคุณ`,
    };
  }

  return { allowed: true };
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

/**
 * Generate standard Thai PromptPay QR payload string with exact amount
 * 
 * target: Phone number (08x, 09x) or 13-digit National ID / Tax ID
 * amountSatang: satang integer (e.g. 29900 = 299.00 THB)
 */
export function generatePromptPayPayload(
  target: string,
  amountSatang?: number
): string {
  const cleaned = target.replace(/[^0-9]/g, "");

  let targetField = "";
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    // Mobile number: international format 0066...
    const formatted = "0066" + cleaned.substring(1);
    targetField = emvField("01", formatted);
  } else if (cleaned.length === 13) {
    // National ID or Tax ID
    targetField = emvField("02", cleaned);
  } else {
    // Fallback formatted mobile
    const formatted = cleaned.startsWith("66") ? "00" + cleaned : "0066" + cleaned;
    targetField = emvField("01", formatted);
  }

  // Merchant Account Info (PromptPay AID: A000000677010111)
  const maiValue = emvField("00", "A000000677010111") + targetField;
  const mai = emvField("29", maiValue);

  let payload = "";
  payload += emvField("00", "01"); // Format Indicator
  payload += emvField("01", amountSatang && amountSatang > 0 ? "12" : "11"); // 12=Dynamic, 11=Static
  payload += mai;
  payload += emvField("53", "764"); // Currency: THB (764)

  if (amountSatang && amountSatang > 0) {
    const bahtStr = (amountSatang / 100).toFixed(2);
    payload += emvField("54", bahtStr);
  }

  payload += emvField("58", "TH"); // Country: TH
  payload += "6304"; // Checksum tag

  const checksum = crc16(payload);
  return payload + checksum;
}
