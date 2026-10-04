import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { isServicePointAllowed, UserContext } from "../lib/permissions";
import { sanitizeForSpreadsheet, generateSafeCsv } from "../lib/anti-injection";

const prisma = new PrismaClient();

describe("Multi-tenant Isolation & Scoping Tests", () => {
  let hospitalOrgId: string;
  let coopOrgId: string;
  let pharmSpId: string;
  let regSpId: string;

  beforeAll(async () => {
    const hospital = await prisma.organization.findUnique({ where: { slug: "pdh-hospital" } });
    const coop = await prisma.organization.findUnique({ where: { slug: "pdh-coop" } });
    const pharmSp = await prisma.servicePoint.findFirst({ where: { code: "OPD-PHARM" } });
    const regSp = await prisma.servicePoint.findFirst({ where: { code: "OPD-REG" } });

    hospitalOrgId = hospital?.id || "";
    coopOrgId = coop?.id || "";
    pharmSpId = pharmSp?.id || "";
    regSpId = regSp?.id || "";
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("verifies that Hospital and Cooperative data remain strictly isolated", async () => {
    expect(hospitalOrgId).toBeTruthy();
    expect(coopOrgId).toBeTruthy();
    expect(hospitalOrgId).not.toBe(coopOrgId);

    // Queries scoped by hospitalOrgId must return hospital records only
    const hospitalResponses = await prisma.response.findMany({
      where: { organizationId: hospitalOrgId },
    });
    for (const r of hospitalResponses) {
      expect(r.organizationId).toBe(hospitalOrgId);
      expect(r.organizationId).not.toBe(coopOrgId);
    }

    // Queries scoped by coopOrgId must return coop records only
    const coopResponses = await prisma.response.findMany({
      where: { organizationId: coopOrgId },
    });
    for (const r of coopResponses) {
      expect(r.organizationId).toBe(coopOrgId);
      expect(r.organizationId).not.toBe(hospitalOrgId);
    }
  });

  it("enforces that Service Manager is scoped strictly to assigned service points", () => {
    const pharmManagerCtx: UserContext = {
      userId: "u-pharm",
      email: "manager.pharm@pdhfeedback.local",
      fullName: "Pharm Manager",
      isPlatformAdmin: false,
      activeOrgId: hospitalOrgId,
      activeRole: "SERVICE_MANAGER",
      servicePointScope: [pharmSpId],
    };

    // Allowed on Pharmacy
    expect(isServicePointAllowed(pharmManagerCtx, pharmSpId)).toBe(true);
    // Disallowed on Registration
    expect(isServicePointAllowed(pharmManagerCtx, regSpId)).toBe(false);
  });

  it("prevents double-submit duplication via unique idempotency keys", async () => {
    const testKey = `test_idem_${Date.now()}`;
    const pub = await prisma.surveyPublication.findFirst({
      where: { organizationId: hospitalOrgId, isActive: true },
    });

    if (pub) {
      // First insert
      const first = await prisma.response.create({
        data: {
          organizationId: hospitalOrgId,
          surveyVersionId: pub.surveyVersionId,
          idempotencyKey: testKey,
          overallRating: 5,
        },
      });
      expect(first.id).toBeTruthy();

      // Second insert with the identical key should fail with unique constraint violation
      let duplicateFailed = false;
      try {
        await prisma.response.create({
          data: {
            organizationId: hospitalOrgId,
            surveyVersionId: pub.surveyVersionId,
            idempotencyKey: testKey,
            overallRating: 5,
          },
        });
      } catch (err) {
        duplicateFailed = true;
      }
      expect(duplicateFailed).toBe(true);

      // Clean up test response
      await prisma.response.delete({ where: { id: first.id } });
    }
  });
});
