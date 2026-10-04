import { describe, it, expect } from "vitest";
import { calculateCSAT, calculateNPS, calculateAverage, calculateGrowth } from "../lib/metrics";
import { sanitizeForSpreadsheet, generateSafeCsv } from "../lib/anti-injection";
import { hasPermission, isServicePointAllowed, UserContext } from "../lib/permissions";

describe("Metrics Calculation Engine", () => {
  it("calculates CSAT accurately (top-2-box 4 & 5 out of valid responses * 100)", () => {
    // 10 responses: ratings [5, 5, 4, 4, 4, 3, 3, 2, 1, 5] -> 6 out of 10 are 4 or 5 -> 60.0%
    const ratings = [5, 5, 4, 4, 4, 3, 3, 2, 1, 5];
    expect(calculateCSAT(ratings)).toBe(60.0);

    // Empty responses return null
    expect(calculateCSAT([])).toBeNull();

    // 100% satisfied
    expect(calculateCSAT([5, 5, 4, 5])).toBe(100.0);
  });

  it("calculates NPS accurately (% Promoters 9-10 minus % Detractors 0-6)", () => {
    // 10 scores: [10, 10, 9, 8, 8, 7, 6, 5, 4, 2]
    // Promoters (9-10): 3 (30%)
    // Passives (7-8): 3 (30%)
    // Detractors (0-6): 4 (40%)
    // NPS: 30% - 40% = -10
    const scores = [10, 10, 9, 8, 8, 7, 6, 5, 4, 2];
    const nps = calculateNPS(scores);
    expect(nps.totalResponses).toBe(10);
    expect(nps.promoters).toBe(3);
    expect(nps.detractors).toBe(4);
    expect(nps.passives).toBe(3);
    expect(nps.promoterPct).toBe(30.0);
    expect(nps.detractorPct).toBe(40.0);
    expect(nps.npsScore).toBe(-10);

    // All promoters: 100
    expect(calculateNPS([10, 9, 10]).npsScore).toBe(100);

    // Empty returns null
    expect(calculateNPS([]).npsScore).toBeNull();
  });

  it("computes averages correctly without treating missing optional answers as zero", () => {
    expect(calculateAverage([4, 5, 3])).toBe(4.0);
    expect(calculateAverage([5, 5])).toBe(5.0);
    expect(calculateAverage([])).toBeNull();
  });

  it("calculates period-over-period growth with zero-denominator handling", () => {
    expect(calculateGrowth(150, 100)).toBe(50.0);
    expect(calculateGrowth(80, 100)).toBe(-20.0);
    expect(calculateGrowth(10, 0)).toBe(100);
    expect(calculateGrowth(0, 0)).toBe(0);
  });
});

describe("Spreadsheet Anti-Formula Injection", () => {
  it("prefixes dangerous leading characters (=, +, -, @) with a single quote", () => {
    expect(sanitizeForSpreadsheet("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
    expect(sanitizeForSpreadsheet("+123456789")).toBe("'+123456789");
    expect(sanitizeForSpreadsheet("-555")).toBe("'-555");
    expect(sanitizeForSpreadsheet("@SUM(A1:A10)")).toBe("'@SUM(A1:A10)");
    expect(sanitizeForSpreadsheet("บริการดีมาก")).toBe("บริการดีมาก");
  });

  it("generates safe CSV with UTF-8 BOM", () => {
    const csv = generateSafeCsv(["ชื่อ", "ความคิดเห็น"], [["สมชาย", "=1+1"]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("\"'=1+1\"");
  });
});

describe("RBAC & Tenant Scoping", () => {
  const ownerCtx: UserContext = {
    userId: "u1",
    email: "owner@test.com",
    fullName: "Owner User",
    isPlatformAdmin: false,
    activeOrgId: "org-1",
    activeRole: "OWNER",
  };

  const viewerCtx: UserContext = {
    userId: "u2",
    email: "viewer@test.com",
    fullName: "Viewer User",
    isPlatformAdmin: false,
    activeOrgId: "org-1",
    activeRole: "VIEWER",
    canExport: false,
    canViewContacts: false,
  };

  const scopedManagerCtx: UserContext = {
    userId: "u3",
    email: "manager@test.com",
    fullName: "Manager User",
    isPlatformAdmin: false,
    activeOrgId: "org-1",
    activeRole: "SERVICE_MANAGER",
    servicePointScope: ["sp-pharmacy"],
  };

  it("permits Owner to manage team, surveys, export, and view contacts", () => {
    expect(hasPermission(ownerCtx, "canManageTeam")).toBe(true);
    expect(hasPermission(ownerCtx, "canManageSurveys")).toBe(true);
    expect(hasPermission(ownerCtx, "canExport")).toBe(true);
    expect(hasPermission(ownerCtx, "canViewContacts")).toBe(true);
  });

  it("forbids Viewer from managing surveys, export, and viewing contacts", () => {
    expect(hasPermission(viewerCtx, "canManageSurveys")).toBe(false);
    expect(hasPermission(viewerCtx, "canExport")).toBe(false);
    expect(hasPermission(viewerCtx, "canViewContacts")).toBe(false);
    expect(hasPermission(viewerCtx, "canViewDashboard")).toBe(true);
  });

  it("strictly enforces Service Manager scope to assigned service points", () => {
    expect(isServicePointAllowed(scopedManagerCtx, "sp-pharmacy")).toBe(true);
    expect(isServicePointAllowed(scopedManagerCtx, "sp-opd")).toBe(false);
    // Owner can access all service points
    expect(isServicePointAllowed(ownerCtx, "sp-opd")).toBe(true);
  });
});
