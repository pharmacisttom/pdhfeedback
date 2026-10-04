import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  normalizeWebsiteOrigin,
  isOriginAllowed,
  buildFrameAncestorsCsp,
  isValidWidgetMessage,
} from "../lib/embed-security";
import {
  generateApiKeySecret,
  authenticateApiKey,
  redactSecret,
} from "../lib/api-auth";
import { getAppBaseUrl } from "../lib/app-url";
import { prisma } from "../lib/prisma";
import crypto from "crypto";
import { grantAdministrativeAccess } from "../lib/billing";

describe("Embed & Website Origin Security", () => {
  it("normalizes and validates clean HTTPS origins correctly", () => {
    const res1 = normalizeWebsiteOrigin("https://myhospital.com");
    expect(res1.isValid).toBe(true);
    expect(res1.normalized).toBe("https://myhospital.com");

    const res2 = normalizeWebsiteOrigin("https://portal.clinic.th:8443/");
    expect(res2.isValid).toBe(true);
    expect(res2.normalized).toBe("https://portal.clinic.th:8443");
  });

  it("strictly rejects wildcard, suffix, path and query patterns", () => {
    expect(normalizeWebsiteOrigin("https://*.myhospital.com").isValid).toBe(false);
    expect(normalizeWebsiteOrigin("*").isValid).toBe(false);
    expect(normalizeWebsiteOrigin("https://myhospital.com/subpath").isValid).toBe(false);
    expect(normalizeWebsiteOrigin("https://myhospital.com?param=value").isValid).toBe(false);
    expect(normalizeWebsiteOrigin("javascript:alert(1)").isValid).toBe(false);
  });

  it("checks allowed origins with exact match only", () => {
    const allowed = ["https://hospital.th", "https://sub.hospital.th:3000"];

    expect(isOriginAllowed("https://hospital.th", allowed)).toBe(true);
    expect(isOriginAllowed("https://sub.hospital.th:3000/", allowed)).toBe(true);

    // Subdomains without explicit entry or different schemes must fail
    expect(isOriginAllowed("https://other.hospital.th", allowed)).toBe(false);
    expect(isOriginAllowed("http://hospital.th", allowed)).toBe(false);
    expect(isOriginAllowed(null, allowed)).toBe(false);
  });

  it("builds correct Content-Security-Policy frame-ancestors header", () => {
    expect(buildFrameAncestorsCsp([])).toBe("frame-ancestors 'self'");
    expect(buildFrameAncestorsCsp(["https://hospital.th", "https://crm.hospital.th"])).toBe(
      "frame-ancestors 'self' https://hospital.th https://crm.hospital.th"
    );
  });

  it("validates widget postMessage protocol and protects against malformed events", () => {
    expect(
      isValidWidgetMessage({
        type: "pdhfeedback:ready",
        publicationId: "pub-123",
      })
    ).toBe(true);

    expect(
      isValidWidgetMessage({
        type: "pdhfeedback:resize",
        publicationId: "pub-123",
        height: 640,
      })
    ).toBe(true);

    expect(
      isValidWidgetMessage({
        type: "pdhfeedback:submitted",
        publicationId: "pub-123",
      })
    ).toBe(true);

    // Invalid messages
    expect(isValidWidgetMessage(null)).toBe(false);
    expect(isValidWidgetMessage({ type: "unknown:event", publicationId: "pub-123" })).toBe(false);
    expect(isValidWidgetMessage({ type: "pdhfeedback:ready" })).toBe(false);
    expect(isValidWidgetMessage({ type: "pdhfeedback:ready", publicationId: "" })).toBe(false);
  });
});

describe("Dynamic App URL & Redaction Utilities", () => {
  const origEnv = process.env.NEXT_PUBLIC_APP_URL;

  afterAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = origEnv;
  });

  it("resolves dynamic base URL from env or headers", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;

    const mockReq = new Request("http://internal-cluster:3000/api/v1/surveys", {
      headers: {
        "x-forwarded-proto": "https",
        "x-forwarded-host": "feedback.myorg.co.th",
      },
    });

    expect(getAppBaseUrl(mockReq)).toBe("https://feedback.myorg.co.th");
  });

  it("redacts sensitive keys and secrets for secure logging", () => {
    expect(redactSecret("pdh_live_9a8b7c6d5e4f3a2b1c0d9e8f")).toBe("pdh_live...9e8f");
    expect(redactSecret("short")).toBe("***");
    expect(redactSecret("")).toBe("");
  });
});

describe("API Key Cryptography & Scoped Authentication", () => {
  let testOrgId: string;
  let testApiKey: { rawKey: string; hash: string; prefix: string };
  let restrictedApiKey: { rawKey: string; hash: string; prefix: string };
  let testServicePointId: string;

  beforeAll(async () => {
    // Create isolated test org
    const org = await prisma.organization.create({
      data: {
        name: "Test Embed Org",
        slug: `test-embed-${Date.now()}`,
        status: "ACTIVE",
      },
    });
    testOrgId = org.id;

    // Grant administrative access for integration entitlements
    await grantAdministrativeAccess({
      organizationId: testOrgId,
      planCode: "ENTERPRISE",
      reason: "Testing integration entitlements",
      adminEmail: "admin@test.local",
    });

    // Create service point
    const sp = await prisma.servicePoint.create({
      data: {
        organizationId: testOrgId,
        name: "OPD Test Clinic",
        code: `OPD-${Date.now().toString().slice(-4)}`,
        publicCode: `sp_pub_${Date.now().toString().slice(-6)}`,
      },
    });
    testServicePointId = sp.id;

    // Create Full Scope API Key
    testApiKey = generateApiKeySecret("live");
    await prisma.apiKey.create({
      data: {
        organizationId: testOrgId,
        name: "Full API Key",
        keyHash: testApiKey.hash,
        keyPrefix: testApiKey.prefix,
        scopes: "service_points:read,surveys:read,invitations:write,reports:read,usage:read",
      },
    });

    // Create Restricted Scope API Key (only surveys:read)
    restrictedApiKey = generateApiKeySecret("live");
    await prisma.apiKey.create({
      data: {
        organizationId: testOrgId,
        name: "Restricted Key",
        keyHash: restrictedApiKey.hash,
        keyPrefix: restrictedApiKey.prefix,
        scopes: "surveys:read",
      },
    });
  });

  afterAll(async () => {
    // Cleanup test artifacts
    if (testOrgId) {
      await prisma.apiKey.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.responseAnswer.deleteMany({
        where: { response: { organizationId: testOrgId } },
      });
      await prisma.feedbackCase.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.response.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.surveyInvitation.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.surveyPublication.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.servicePoint.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.subscription.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.organization.delete({ where: { id: testOrgId } });
    }
  });

  it("generates correct key structure with matching hash", () => {
    const liveKey = generateApiKeySecret("live");
    expect(liveKey.rawKey.startsWith("pdh_live_")).toBe(true);
    const expectedHash = crypto.createHash("sha256").update(liveKey.rawKey).digest("hex");
    expect(liveKey.hash).toBe(expectedHash);

    const testKey = generateApiKeySecret("test");
    expect(testKey.rawKey.startsWith("pdh_test_")).toBe(true);
  });

  it("authenticates valid Bearer key with correct scope", async () => {
    const req = new Request("http://localhost:3000/api/v1/service-points", {
      headers: {
        Authorization: `Bearer ${testApiKey.rawKey}`,
      },
    });

    const auth = await authenticateApiKey(req, "service_points:read");
    expect(auth.success).toBe(true);
    if (auth.success) {
      expect(auth.organizationId).toBe(testOrgId);
      expect(auth.scopes).toContain("service_points:read");
    }
  });

  it("rejects missing or malformed Authorization header with 401", async () => {
    const req = new Request("http://localhost:3000/api/v1/service-points");
    const auth = await authenticateApiKey(req, "service_points:read");
    expect(auth.success).toBe(false);
    if (!auth.success) {
      expect(auth.response.status).toBe(401);
    }
  });

  it("rejects unauthorized scope with 403 Forbidden", async () => {
    const req = new Request("http://localhost:3000/api/v1/invitations", {
      headers: {
        Authorization: `Bearer ${restrictedApiKey.rawKey}`,
      },
    });

    const auth = await authenticateApiKey(req, "invitations:write");
    expect(auth.success).toBe(false);
    if (!auth.success) {
      expect(auth.response.status).toBe(403);
    }
  });

  it("rejects revoked API key with 403 Forbidden", async () => {
    // Revoke restricted key
    const targetKey = await prisma.apiKey.findFirst({
      where: { keyHash: restrictedApiKey.hash },
    });
    await prisma.apiKey.update({
      where: { id: targetKey!.id },
      data: { isRevoked: true },
    });

    const req = new Request("http://localhost:3000/api/v1/surveys", {
      headers: {
        Authorization: `Bearer ${restrictedApiKey.rawKey}`,
      },
    });

    const auth = await authenticateApiKey(req, "surveys:read");
    expect(auth.success).toBe(false);
    if (!auth.success) {
      expect(auth.response.status).toBe(403);
    }
  });
});

describe("REST API Endpoints & Public Embed Response Submissions", () => {
  let testOrgId: string;
  let testApiKey: { rawKey: string; hash: string; prefix: string };
  let testServicePointId: string;
  let testSurveyId: string;
  let testSurveyVersionId: string;
  let testPublication: { id: string; publicCode: string };

  beforeAll(async () => {
    // Create org
    const org = await prisma.organization.create({
      data: {
        name: "Integration Test Hospital",
        slug: `inthosp-${Date.now()}`,
        status: "ACTIVE",
      },
    });
    testOrgId = org.id;

    // Grant Admin Access
    await grantAdministrativeAccess({
      organizationId: testOrgId,
      planCode: "ENTERPRISE",
      reason: "REST & Embed Testing",
      adminEmail: "admin@test.local",
    });

    // Create Service Point
    const sp = await prisma.servicePoint.create({
      data: {
        organizationId: testOrgId,
        name: "Pharmacy Dispensary",
        code: `PHARM-${Date.now().toString().slice(-4)}`,
        publicCode: `sp_pharm_${Date.now().toString().slice(-6)}`,
      },
    });
    testServicePointId = sp.id;

    // Create Survey & Published Version
    const survey = await prisma.survey.create({
      data: {
        organizationId: testOrgId,
        title: "Hospital Embed CSAT",
        slug: `csat-${Date.now()}`,
        category: "HOSPITAL",
      },
    });
    testSurveyId = survey.id;

    const version = await prisma.surveyVersion.create({
      data: {
        surveyId: survey.id,
        versionNumber: 1,
        title: "ประเมินความพึงพอใจการรับบริการ",
        status: "PUBLISHED",
      },
    });
    testSurveyVersionId = version.id;

    // Create Survey Publication
    const pub = await prisma.surveyPublication.create({
      data: {
        organizationId: testOrgId,
        surveyVersionId: version.id,
        servicePointId: testServicePointId,
        name: "Pharmacy Widget Embed",
        publicCode: `pub_test_${Date.now()}`,
        displayMode: "inline",
        allowedOrigins: JSON.stringify(["https://hospital.org", "http://localhost:3000"]),
        isActive: true,
      },
    });
    testPublication = { id: pub.id, publicCode: pub.publicCode };

    // Create API Key
    testApiKey = generateApiKeySecret("live");
    await prisma.apiKey.create({
      data: {
        organizationId: testOrgId,
        name: "Test API Key",
        keyHash: testApiKey.hash,
        keyPrefix: testApiKey.prefix,
        scopes: "service_points:read,surveys:read,invitations:write,reports:read,usage:read",
      },
    });
  });

  afterAll(async () => {
    if (testOrgId) {
      await prisma.apiKey.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.responseAnswer.deleteMany({
        where: { response: { organizationId: testOrgId } },
      });
      await prisma.feedbackCase.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.response.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.surveyInvitation.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.surveyPublication.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.surveyQuestion.deleteMany({
        where: { surveyVersionId: testSurveyVersionId },
      });
      await prisma.surveyVersion.deleteMany({ where: { id: testSurveyVersionId } });
      await prisma.survey.deleteMany({ where: { id: testSurveyId } });
      await prisma.servicePoint.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.subscription.deleteMany({ where: { organizationId: testOrgId } });
      await prisma.organization.delete({ where: { id: testOrgId } });
    }
  });

  it("creates one-time invitation with S2S API and supports idempotent replay", async () => {
    const { POST: createInvitation } = await import(
      "../app/api/v1/invitations/route"
    );

    const idempotencyKey = `idem_${Date.now()}`;
    const reqBody = {
      publicationId: testPublication.publicCode,
      servicePointId: testServicePointId,
      expiresInDays: 3,
      externalReference: "QUEUE-A092",
      idempotencyKey,
    };

    // First Call
    const req1 = new Request("http://localhost:3000/api/v1/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testApiKey.rawKey}`,
      },
      body: JSON.stringify(reqBody),
    });

    const res1 = await createInvitation(req1);
    expect(res1.status).toBe(201);
    const json1 = await res1.json();
    expect(json1.success).toBe(true);
    expect(json1.invitationId).toBeDefined();
    expect(json1.invitationUrl).toBeDefined();

    // Replay Call with same Idempotency-Key
    const req2 = new Request("http://localhost:3000/api/v1/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testApiKey.rawKey}`,
      },
      body: JSON.stringify(reqBody),
    });

    const res2 = await createInvitation(req2);
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.success).toBe(true);
    expect(json2.idempotentReplay).toBe(true);
    expect(json2.invitationId).toBe(json1.invitationId);
  });

  it("submits public survey response, verifies 1-5 star constraint, and auto-creates FeedbackCase for low ratings", async () => {
    const { POST: submitResponse } = await import(
      "../app/api/v1/public/surveys/[publicationId]/responses/route"
    );

    // 1. Rejects rating outside 1..5 range
    const invalidReq = new Request(
      `http://localhost:3000/api/v1/public/surveys/${testPublication.publicCode}/responses`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overallRating: 6 }),
      }
    );
    const invalidRes = await submitResponse(invalidReq, {
      params: { publicationId: testPublication.publicCode },
    });
    expect(invalidRes.status).toBe(400);

    // 2. Submits valid low rating (2 stars) -> Should auto-generate FeedbackCase
    const idemKey = `idem_resp_${Date.now()}`;
    const validReq = new Request(
      `http://localhost:3000/api/v1/public/surveys/${testPublication.publicCode}/responses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": idemKey,
        },
        body: JSON.stringify({
          overallRating: 2,
          commentText: "รอนานมาก เจ้าหน้าที่พูดจาไม่สุภาพ",
        }),
      }
    );
    const validRes = await submitResponse(validReq, {
      params: { publicationId: testPublication.publicCode },
    });
    expect(validRes.status).toBe(201);
    const validJson = await validRes.json();
    expect(validJson.success).toBe(true);
    expect(validJson.responseId).toBeDefined();

    // Verify FeedbackCase was created in DB
    const feedbackCase = await prisma.feedbackCase.findFirst({
      where: { responseId: validJson.responseId },
    });
    expect(feedbackCase).toBeDefined();
    expect(feedbackCase?.urgency).toBe("MEDIUM");

    // 3. Submits duplicate with same idempotency key -> Idempotent replay, does not create extra response
    const dupReq = new Request(
      `http://localhost:3000/api/v1/public/surveys/${testPublication.publicCode}/responses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": idemKey,
        },
        body: JSON.stringify({
          overallRating: 2,
          commentText: "รอนานมาก เจ้าหน้าที่พูดจาไม่สุภาพ",
        }),
      }
    );
    const dupRes = await submitResponse(dupReq, {
      params: { publicationId: testPublication.publicCode },
    });
    expect(dupRes.status).toBe(200);
    const dupJson = await dupRes.json();
    expect(dupJson.idempotentReplay).toBe(true);
    expect(dupJson.responseId).toBe(validJson.responseId);
  });

  it("fetches aggregate summary reports via REST API", async () => {
    const { GET: getSummary } = await import(
      "../app/api/v1/reports/summary/route"
    );

    const req = new Request("http://localhost:3000/api/v1/reports/summary", {
      headers: {
        Authorization: `Bearer ${testApiKey.rawKey}`,
      },
    });

    const res = await getSummary(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.metrics.totalResponses).toBeGreaterThanOrEqual(1);
    expect(data.metrics.averageScore).toBeDefined();
  });

  it("fetches ratings 1-5 breakdown via REST API", async () => {
    const { GET: getRatings } = await import(
      "../app/api/v1/reports/ratings/route"
    );

    const req = new Request("http://localhost:3000/api/v1/reports/ratings", {
      headers: {
        Authorization: `Bearer ${testApiKey.rawKey}`,
      },
    });

    const res = await getRatings(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.ratingBreakdown).toBeDefined();
    const star2 = data.ratingBreakdown.find((b: any) => b.stars === 2);
    expect(star2?.count).toBeGreaterThanOrEqual(1);
  });
});
