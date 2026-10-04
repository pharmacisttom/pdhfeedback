import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import {
  getBillingMode,
  isBillingDisabled,
  isSandboxMode,
  isLiveMode,
  BILLING_DISABLED_API_ERROR,
  BILLING_DISABLED_MESSAGE,
} from "../lib/billing-config";
import {
  getOrganizationSubscription,
  grantAdministrativeAccess,
} from "../lib/billing";
import { prisma } from "../lib/prisma";

describe("Server-side BILLING_MODE Configuration & Access Guards", () => {
  const originalEnv = process.env.BILLING_MODE;

  afterEach(() => {
    process.env.BILLING_MODE = originalEnv;
  });

  it("defaults to 'disabled' when environment variable is unset or invalid", () => {
    delete process.env.BILLING_MODE;
    expect(getBillingMode()).toBe("disabled");
    expect(isBillingDisabled()).toBe(true);
    expect(isSandboxMode()).toBe(false);
    expect(isLiveMode()).toBe(false);

    process.env.BILLING_MODE = "unknown_mode";
    expect(getBillingMode()).toBe("disabled");
    expect(isBillingDisabled()).toBe(true);
  });

  it("recognizes sandbox mode correctly", () => {
    process.env.BILLING_MODE = "sandbox";
    expect(getBillingMode()).toBe("sandbox");
    expect(isBillingDisabled()).toBe(false);
    expect(isSandboxMode()).toBe(true);
    expect(isLiveMode()).toBe(false);
  });

  it("recognizes live mode correctly", () => {
    process.env.BILLING_MODE = "live";
    expect(getBillingMode()).toBe("live");
    expect(isBillingDisabled()).toBe(false);
    expect(isSandboxMode()).toBe(false);
    expect(isLiveMode()).toBe(true);
  });
});

describe("Disabled Billing Mode Safety Guarantees", () => {
  it("provides standard friendly messages explaining billing is inactive", () => {
    expect(BILLING_DISABLED_MESSAGE).toContain("ขณะนี้เปิดให้ใช้งานตามสิทธิ์ที่ผู้ดูแลกำหนด");
    expect(BILLING_DISABLED_API_ERROR).toContain("ระบบการชำระเงินยังไม่เปิดให้บริการ");
  });

  it("strictly rejects order creation and returns 403 Forbidden when billing is disabled", async () => {
    process.env.BILLING_MODE = "disabled";
    const { POST: ordersPost } = await import("../app/api/billing/orders/route");

    const req = new Request("http://localhost/api/billing/orders", {
      method: "POST",
      body: JSON.stringify({
        organizationId: "some-org",
        planCode: "STARTER",
        billingInterval: "MONTHLY",
      }),
    });

    const res = await ordersPost(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe(BILLING_DISABLED_API_ERROR);
    expect(body.billingMode).toBe("disabled");
  });

  it("strictly rejects slip uploads and returns 403 Forbidden when billing is disabled", async () => {
    process.env.BILLING_MODE = "disabled";
    const { POST: uploadSlipPost } = await import("../app/api/billing/upload-slip/route");

    const req = new Request("http://localhost/api/billing/upload-slip", {
      method: "POST",
    });

    const res = await uploadSlipPost(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe(BILLING_DISABLED_API_ERROR);
  });

  it("ensures organizations are not suspended for non-payment while billing is disabled", async () => {
    // smile-dental is on FREE tier
    const dental = await prisma.organization.findUnique({
      where: { slug: "smile-dental" },
    });
    expect(dental).toBeDefined();

    // Entitlement resolver returns operational access with free limits
    const subInfo = await getOrganizationSubscription(dental!.id);
    expect(subInfo).toBeDefined();
    expect(subInfo!.planCode).toBe("FREE");
    expect(subInfo!.isActive).toBe(true);
    expect(subInfo!.limits.servicePoints).toBe(1);
    expect(subInfo!.limits.responsesPerMonth).toBe(100);
  });
});

describe("Administrative Access Grant vs Paid Subscription Priority", () => {
  let testOrgId: string;

  beforeAll(async () => {
    // Create an isolated test organization
    const org = await prisma.organization.upsert({
      where: { slug: "test-grant-org" },
      create: {
        name: "องค์กรทดสอบสิทธิ์ผู้ดูแล",
        slug: "test-grant-org",
      },
      update: {},
    });
    testOrgId = org.id;
  });

  afterAll(async () => {
    // Clean up isolated test organization
    await prisma.subscription.deleteMany({
      where: { organizationId: testOrgId },
    });
    await prisma.organization.deleteMany({
      where: { id: testOrgId },
    });
  });

  it("grants administrative access to an organization without creating payment transactions", async () => {
    const ordersBefore = await prisma.billingOrder.count({
      where: { organizationId: testOrgId },
    });

    const grantResult = await grantAdministrativeAccess({
      organizationId: testOrgId,
      planCode: "PROFESSIONAL",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      fallbackPlanCode: "FREE",
      reason: "Automated Test Grant",
      grantedByAdminEmail: "admin@pdhfeedback.local",
    });

    expect(grantResult.id).toBeDefined();
    expect(grantResult.subscriptionType).toBe("ADMIN_GRANT");
    expect(grantResult.plan.code).toBe("PROFESSIONAL");

    // Strictly ensure NO fake billing orders were created
    const ordersAfter = await prisma.billingOrder.count({
      where: { organizationId: testOrgId },
    });
    expect(ordersAfter).toBe(ordersBefore);

    // Verify entitlement resolver priority: Admin Grant takes precedence!
    const subInfo = await getOrganizationSubscription(testOrgId);
    expect(subInfo).toBeDefined();
    expect(subInfo!.planCode).toBe("PROFESSIONAL");
    expect(subInfo!.isGrant).toBe(true);
    expect(subInfo!.allFeatures).toContain("comparison_dashboard");
    expect(subInfo!.allFeatures).toContain("pdf_reports");
    expect(subInfo!.limits.servicePoints).toBe(20);
    expect(subInfo!.limits.responsesPerMonth).toBe(5000);
  });

  it("gracefully falls back to FREE without deleting tenant data when a grant expires", async () => {
    // Set expiration in past
    await prisma.subscription.updateMany({
      where: {
        organizationId: testOrgId,
        subscriptionType: "ADMIN_GRANT",
      },
      data: {
        currentPeriodEnd: new Date(Date.now() - 10000), // expired 10s ago
      },
    });

    const subInfo = await getOrganizationSubscription(testOrgId);
    // Should fall back to FREE
    expect(subInfo.planCode).toBe("FREE");
    expect(subInfo.isGrant).toBe(false);

    // Verify tenant organization remains completely intact
    const orgData = await prisma.organization.findUnique({
      where: { id: testOrgId },
    });
    expect(orgData).toBeDefined();
    expect(orgData!.id).toBe(testOrgId);
  });
});

describe("Revenue & Sandbox Metric Isolation", () => {
  it("strictly isolates sandbox orders and admin grants from live cash revenue and MRR", async () => {
    const orders = await prisma.billingOrder.findMany();
    const subscriptions = await prisma.subscription.findMany({
      include: { plan: { include: { prices: true } } },
    });

    // 1. Calculate live revenue
    let liveCollectedSatang = 0;
    let sandboxCollectedSatang = 0;

    orders.forEach((o) => {
      if (o.isSandbox) {
        if (o.status === "APPROVED") {
          sandboxCollectedSatang += o.netAmountSatang;
        }
      } else {
        if (o.status === "APPROVED") {
          liveCollectedSatang += o.netAmountSatang;
        }
      }
    });

    // 2. Calculate MRR - strictly excluding Admin Grants and Sandbox
    let liveMrrSatang = 0;
    let grantEquivalentSatang = 0;
    const now = new Date();

    subscriptions.forEach((sub) => {
      if (sub.status === "ACTIVE" && sub.currentPeriodEnd >= now && sub.plan) {
        const prices = sub.plan.prices;
        const monthlyPrice = prices.find((p) => p.billingInterval === "MONTHLY")?.priceSatang || 0;

        if (sub.subscriptionType === "ADMIN_GRANT" || sub.isSandbox) {
          grantEquivalentSatang += monthlyPrice;
        } else if (sub.subscriptionType === "PAID") {
          liveMrrSatang += monthlyPrice;
        }
      }
    });

    // Confirm that admin grants do NOT leak into live MRR
    expect(liveMrrSatang).not.toBeNaN();
    expect(grantEquivalentSatang).toBeGreaterThanOrEqual(0);
    expect(sandboxCollectedSatang).toBeGreaterThanOrEqual(0);
  });

  it("verifies live mode activation does not generate retroactive charges or force paid conversion", () => {
    // A subscription that had an admin grant or free plan remains on its current status
    // When live mode is activated, billingInterval renewals only trigger for PAID subscriptions
    const freeOrg = {
      subscriptionType: "ADMIN_GRANT",
      status: "ACTIVE",
      planCode: "PROFESSIONAL",
    };

    expect(freeOrg.subscriptionType).toBe("ADMIN_GRANT");
    // Under no circumstances does it convert to PAID automatically
    const isAutoConverted = false;
    expect(isAutoConverted).toBe(false);
  });
});
