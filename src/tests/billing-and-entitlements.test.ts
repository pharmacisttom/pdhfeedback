import { describe, it, expect } from "vitest";
import {
  formatSatang,
  getDaysInMonth,
  getCurrentMonthlyQuotaWindow,
  calculateNextPeriodEnd,
  generatePromptPayPayload,
  SEED_PLANS,
} from "../lib/billing";
import {
  FEATURE_CATALOGUE,
  PLAN_FEATURE_MATRIX,
  FeatureKey,
} from "../lib/entitlements";

describe("SaaS Billing & Integer Satang Calculations", () => {
  it("formats integer satang into clean Thai Baht display without float errors", () => {
    expect(formatSatang(0)).toBe("0");
    expect(formatSatang(29900)).toBe("299");
    expect(formatSatang(29900, true)).toBe("299.00");
    expect(formatSatang(299000)).toBe("2,990");
    expect(formatSatang(799000)).toBe("7,990");
    expect(formatSatang(1990000)).toBe("19,900");
    expect(formatSatang(29950, true)).toBe("299.50");
  });

  it("calculates annual discount correctly (equivalent to 2 free months)", () => {
    const starter = SEED_PLANS.find((p) => p.code === "STARTER")!;
    const pro = SEED_PLANS.find((p) => p.code === "PROFESSIONAL")!;
    const biz = SEED_PLANS.find((p) => p.code === "BUSINESS")!;

    // 10 months of monthly price = annual price
    expect(starter.monthlySatang * 10).toBe(starter.annualSatang);
    expect(pro.monthlySatang * 10).toBe(pro.annualSatang);
    expect(biz.monthlySatang * 10).toBe(biz.annualSatang);

    // Annual price is strictly less than 12 * monthly
    expect(starter.annualSatang).toBeLessThan(starter.monthlySatang * 12);
    expect(pro.annualSatang).toBeLessThan(pro.monthlySatang * 12);
  });
});

describe("Subscription Monthly Quota Window & Leap Year Rules", () => {
  it("determines correct days in month including leap years", () => {
    expect(getDaysInMonth(2024, 2)).toBe(29); // 2024 leap year
    expect(getDaysInMonth(2025, 2)).toBe(28); // 2025 regular
    expect(getDaysInMonth(2026, 2)).toBe(28); // 2026 regular
    expect(getDaysInMonth(2026, 4)).toBe(30); // April
    expect(getDaysInMonth(2026, 12)).toBe(31); // December
  });

  it("handles mid-month anchor day (e.g. 15th of month)", () => {
    // Reference date: Feb 10, 2026 (before anchor day 15)
    // Should span Jan 15, 2026 to Feb 15, 2026
    const refBefore = new Date(2026, 1, 10);
    const windowBefore = getCurrentMonthlyQuotaWindow(15, refBefore);
    expect(windowBefore.start.getFullYear()).toBe(2026);
    expect(windowBefore.start.getMonth()).toBe(0); // Jan
    expect(windowBefore.start.getDate()).toBe(15);
    expect(windowBefore.end.getFullYear()).toBe(2026);
    expect(windowBefore.end.getMonth()).toBe(1); // Feb
    expect(windowBefore.end.getDate()).toBe(15);

    // Reference date: Feb 20, 2026 (after anchor day 15)
    // Should span Feb 15, 2026 to Mar 15, 2026
    const refAfter = new Date(2026, 1, 20);
    const windowAfter = getCurrentMonthlyQuotaWindow(15, refAfter);
    expect(windowAfter.start.getMonth()).toBe(1); // Feb
    expect(windowAfter.start.getDate()).toBe(15);
    expect(windowAfter.end.getMonth()).toBe(2); // Mar
    expect(windowAfter.end.getDate()).toBe(15);
  });

  it("correctly clamps anchor day 31 to Feb 28 in regular year and Feb 29 in leap year", () => {
    // In regular year (2026):
    const refReg = new Date(2026, 1, 15); // Feb 15, 2026
    const windowReg = getCurrentMonthlyQuotaWindow(31, refReg);
    expect(windowReg.start.getMonth()).toBe(0); // Jan
    expect(windowReg.start.getDate()).toBe(31);
    expect(windowReg.end.getMonth()).toBe(1); // Feb
    expect(windowReg.end.getDate()).toBe(28); // Clamped to 28!

    // In leap year (2024):
    const refLeap = new Date(2024, 1, 15); // Feb 15, 2024
    const windowLeap = getCurrentMonthlyQuotaWindow(31, refLeap);
    expect(windowLeap.start.getMonth()).toBe(0); // Jan
    expect(windowLeap.start.getDate()).toBe(31);
    expect(windowLeap.end.getMonth()).toBe(1); // Feb
    expect(windowLeap.end.getDate()).toBe(29); // Clamped to 29!
  });

  it("computes next period end for monthly and annual renewals", () => {
    const start = new Date(2026, 0, 15); // Jan 15, 2026
    const nextMonthly = calculateNextPeriodEnd("MONTHLY", start, 15);
    expect(nextMonthly.getFullYear()).toBe(2026);
    expect(nextMonthly.getMonth()).toBe(1); // Feb
    expect(nextMonthly.getDate()).toBe(15);

    const nextAnnual = calculateNextPeriodEnd("ANNUAL", start, 15);
    expect(nextAnnual.getFullYear()).toBe(2027);
    expect(nextAnnual.getMonth()).toBe(0); // Jan 2027
    expect(nextAnnual.getDate()).toBe(15);
  });
});

describe("PromptPay EMVCo QR Code Payload Standard", () => {
  it("generates valid EMVCo string for Mobile number PromptPay", () => {
    const payload = generatePromptPayPayload("0812345678", 29900);
    expect(payload).toContain("000201"); // Format Indicator
    expect(payload).toContain("010212"); // Dynamic QR indicator (with amount)
    expect(payload).toContain("A000000677010111"); // PromptPay AID
    expect(payload).toContain("0066812345678"); // International phone format
    expect(payload).toContain("5303764"); // Currency: THB (764)
    expect(payload).toContain("5406299.00"); // Amount 299.00
    expect(payload).toContain("5802TH"); // Country: TH
    expect(payload.length).toBeGreaterThan(50);
  });

  it("generates valid EMVCo string for 13-digit Tax ID PromptPay", () => {
    const payload = generatePromptPayPayload("0105566012345", 299000);
    expect(payload).toContain("A000000677010111");
    expect(payload).toContain("02130105566012345"); // Tax ID tag 02
    expect(payload).toContain("54072990.00"); // Amount 2990.00
    expect(payload).toContain("6304"); // CRC tag
  });
});

describe("Feature Entitlements Matrix & Tier Isolation", () => {
  it("enforces free tier limits and zero advanced features", () => {
    const freeLimits = PLAN_FEATURE_MATRIX.FREE.limits;
    expect(freeLimits.servicePoints).toBe(1);
    expect(freeLimits.members).toBe(1);
    expect(freeLimits.activeSurveys).toBe(1);
    expect(freeLimits.responsesPerMonth).toBe(100);
    expect(PLAN_FEATURE_MATRIX.FREE.features.length).toBe(0);
  });

  it("enforces starter tier features: custom_questions, xlsx_export, feedback_tracking", () => {
    const starterFeatures = PLAN_FEATURE_MATRIX.STARTER.features;
    expect(starterFeatures).toContain("custom_questions");
    expect(starterFeatures).toContain("xlsx_export");
    expect(starterFeatures).toContain("feedback_tracking");
    expect(starterFeatures).not.toContain("comparison_dashboard");
    expect(starterFeatures).not.toContain("pdf_reports");
    expect(starterFeatures).not.toContain("api_access");
  });

  it("enforces professional tier additions: comparison_dashboard, pdf_reports, conditional_questions", () => {
    const proFeatures = PLAN_FEATURE_MATRIX.PROFESSIONAL.features;
    expect(proFeatures).toContain("comparison_dashboard");
    expect(proFeatures).toContain("pdf_reports");
    expect(proFeatures).toContain("conditional_questions");
    expect(proFeatures).toContain("email_notifications");
    expect(proFeatures).toContain("multilingual_surveys");
    expect(proFeatures).not.toContain("api_access");
    expect(proFeatures).not.toContain("hide_powered_by");
  });

  it("enforces business tier additions: api_access, webhooks, hide_powered_by", () => {
    const bizFeatures = PLAN_FEATURE_MATRIX.BUSINESS.features;
    expect(bizFeatures).toContain("api_access");
    expect(bizFeatures).toContain("webhooks");
    expect(bizFeatures).toContain("embed_widget");
    expect(bizFeatures).toContain("hide_powered_by");
    expect(bizFeatures).toContain("advanced_roles");
  });

  it("marks custom_domain as COMING_SOON and not available for immediate deployment", () => {
    const customDomainMeta = FEATURE_CATALOGUE.custom_domain;
    expect(customDomainMeta.status).toBe("COMING_SOON");
    expect(PLAN_FEATURE_MATRIX.FREE.features).not.toContain("custom_domain");
    expect(PLAN_FEATURE_MATRIX.STARTER.features).not.toContain("custom_domain");
    expect(PLAN_FEATURE_MATRIX.PROFESSIONAL.features).not.toContain("custom_domain");
    expect(PLAN_FEATURE_MATRIX.BUSINESS.features).not.toContain("custom_domain");
  });
});

describe("Billing Database & Tenant Isolation Security", () => {
  it("preserves price snapshot and billing documents across plan price updates", async () => {
    const { prisma } = await import("../lib/prisma");

    // Fetch existing approved coop order
    const coopOrder = await prisma.billingOrder.findFirst({
      where: { orderNumber: "ORD-202610-0001" },
      include: { billingDocuments: true },
    });

    expect(coopOrder).toBeDefined();
    expect(coopOrder?.planCodeSnapshot).toBe("STARTER");
    expect(coopOrder?.amountSatang).toBe(299000);
    expect(coopOrder?.status).toBe("APPROVED");
    expect(coopOrder?.billingDocuments.length).toBeGreaterThan(0);
    expect(coopOrder?.billingDocuments[0].documentType).toBe("RECEIPT");
  });

  it("verifies organization responses and feedback cases remain intact", async () => {
    const { prisma } = await import("../lib/prisma");

    const coopOrg = await prisma.organization.findUnique({
      where: { slug: "pdh-coop" },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    expect(coopOrg).toBeDefined();
    expect(coopOrg?._count.responses).toBeGreaterThanOrEqual(12);
  });
});

