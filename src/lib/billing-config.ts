/**
 * PdhFeedback SaaS Billing Configuration
 * 
 * Controls server-wide billing activation mode:
 * - "disabled": Packaging, quotas, and feature entitlements are ACTIVE, but
 *               monetization, checkout, orders, slip uploads, and payment provider connections
 *               are strictly DISABLED on both server and client.
 *               Organizations use features via Free plan or Administrative Access Grants.
 * - "sandbox":  Full billing modules, slip uploads, and payment reviews can be tested
 *               using mock / test evidence. Marked with clear sandbox banners.
 *               Excluded from production live revenue reports.
 * - "live":     Full live billing with real payments. Requires explicit activation,
 *               provider readiness check, and recipient configuration.
 */

export type BillingMode = "disabled" | "sandbox" | "live";

export function getBillingMode(): BillingMode {
  const mode = (process.env.BILLING_MODE || "disabled").toLowerCase().trim();
  if (mode === "live") return "live";
  if (mode === "sandbox") return "sandbox";
  return "disabled";
}

export function isBillingDisabled(): boolean {
  return getBillingMode() === "disabled";
}

export function isSandboxMode(): boolean {
  return getBillingMode() === "sandbox";
}

export function isLiveMode(): boolean {
  return getBillingMode() === "live";
}

export function shouldShowPricingPage(): boolean {
  return process.env.SHOW_PRICING_PAGE !== "false";
}

export const BILLING_DISABLED_MESSAGE =
  "ขณะนี้เปิดให้ใช้งานตามสิทธิ์ที่ผู้ดูแลกำหนด โดยยังไม่มีการเรียกเก็บเงิน";

export const BILLING_DISABLED_API_ERROR =
  "ระบบการชำระเงินยังไม่เปิดให้บริการในขณะนี้ ขณะนี้เปิดให้ใช้งานตามสิทธิ์ที่ผู้ดูแลระบบกำหนดโดยไม่มีการเรียกเก็บเงิน";

export const SANDBOX_BANNER_TEXT =
  "โหมดทดสอบ (Sandbox) - ข้อมูลทดสอบ ไม่มีการเรียกเก็บเงินจริง";
