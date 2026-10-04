import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getOrganizationSubscription } from "./billing";

export type ApiScope =
  | "service_points:read"
  | "surveys:read"
  | "invitations:write"
  | "reports:read"
  | "usage:read";

export const ALL_API_SCOPES: { id: ApiScope; label: string; description: string }[] = [
  {
    id: "service_points:read",
    label: "อ่านข้อมูลจุดบริการ",
    description: "เรียกดูรายชื่อและรหัสจุดบริการทั้งหมดขององค์กร",
  },
  {
    id: "surveys:read",
    label: "อ่านแบบประเมิน",
    description: "เรียกดูโครงสร้างแบบประเมินและเวอร์ชันที่เปิดใช้งาน",
  },
  {
    id: "invitations:write",
    label: "สร้างและยกเลิกลิงก์คำเชิญ",
    description: "สร้าง One-time Survey Invitation เชื่อมกับคิวหรือรายการบริการของโรงพยาบาล/ร้านค้า",
  },
  {
    id: "reports:read",
    label: "อ่านรายงานสรุปสถิติ (Aggregate)",
    description: "ดึงคะแนนเฉลี่ย, CSAT, NPS และสถิติตามช่วงเวลา (ไม่แสดงข้อมูลระบุตัวบุคคล)",
  },
  {
    id: "usage:read",
    label: "อ่านข้อมูลการใช้งานและโควตา",
    description: "ตรวจสอบยอดคำตอบที่ใช้ไปและโควตาคงเหลือประจำเดือน",
  },
];

/**
 * Standard API error format with HTTP status code and request ID
 */
export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
) {
  const requestId = `req_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        requestId,
        ...(details ? { details } : {}),
      },
    },
    {
      status,
      headers: {
        "X-Request-Id": requestId,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

/**
 * Generates a high-entropy secret API Key with prefix and SHA-256 hash.
 */
export function generateApiKeySecret(environment: "live" | "test" = "live"): {
  rawKey: string;
  prefix: string;
  hash: string;
} {
  const prefixType = environment === "test" ? "pdh_test" : "pdh_live";
  const randomBytes = crypto.randomBytes(24).toString("base64url");
  const rawKey = `${prefixType}_${randomBytes}`;
  const prefix = rawKey.substring(0, 14) + "...";
  const hash = crypto.createHash("sha256").update(rawKey).digest("hex");

  return { rawKey, prefix, hash };
}

/**
 * Verifies Bearer API Key from incoming HTTP Request.
 * Returns organization and apiKey info, or a NextResponse error.
 */
export async function authenticateApiKey(
  req: Request,
  requiredScope?: ApiScope
): Promise<
  | {
      success: true;
      organizationId: string;
      organizationName: string;
      organizationSlug: string;
      apiKeyId: string;
      apiKeyName: string;
      scopes: ApiScope[];
      servicePointId?: string | null;
    }
  | {
      success: false;
      response: NextResponse;
    }
> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      response: apiError(
        "UNAUTHORIZED",
        "กรุณาระบุ API Key ผ่าน Header: Authorization: Bearer <API_KEY>",
        401
      ),
    };
  }

  const rawKey = authHeader.substring(7).trim();
  if (!rawKey) {
    return {
      success: false,
      response: apiError("UNAUTHORIZED", "API Key ไม่ถูกต้องหรือไม่ครบถ้วน", 401),
    };
  }

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  if (!apiKey) {
    return {
      success: false,
      response: apiError("INVALID_API_KEY", "API Key ไม่ถูกต้องหรือถูกลบออกจากระบบ", 401),
    };
  }

  if (apiKey.isRevoked) {
    return {
      success: false,
      response: apiError("API_KEY_REVOKED", "API Key นี้ถูกเพิกถอนการใช้งานแล้ว", 403),
    };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return {
      success: false,
      response: apiError("API_KEY_EXPIRED", "API Key นี้หมดอายุการใช้งานแล้ว", 403),
    };
  }

  if (apiKey.organization.status !== "ACTIVE") {
    return {
      success: false,
      response: apiError("ORGANIZATION_INACTIVE", "บัญชีองค์กรไม่ได้อยู่ในสถานะเปิดใช้งาน", 403),
    };
  }

  // Enforce server-side Entitlement: organization must have 'api_access'
  const subInfo = await getOrganizationSubscription(apiKey.organizationId);
  if (!subInfo?.allFeatures.includes("api_access")) {
    return {
      success: false,
      response: apiError(
        "ENTITLEMENT_REQUIRED",
        "ฟีเจอร์ REST API Access ต้องใช้แพ็กเกจ Business / Enterprise หรือได้รับสิทธิ์พิเศษจากผู้ดูแลระบบ (Admin Grant)",
        403,
        {
          requiredFeature: "api_access",
          currentPlan: subInfo?.planCode || "FREE",
          contactEmail: "support@pdhfeedback.local",
        }
      ),
    };
  }

  // Parse and verify scope
  const scopesList = apiKey.scopes
    .split(",")
    .map((s) => s.trim() as ApiScope)
    .filter(Boolean);

  if (requiredScope && !scopesList.includes(requiredScope)) {
    return {
      success: false,
      response: apiError(
        "INSUFFICIENT_SCOPE",
        `API Key นี้ไม่มีสิทธิ์เข้าถึง Endpoint นี้ (ต้องการ Scope: ${requiredScope})`,
        403,
        {
          requiredScope,
          grantedScopes: scopesList,
        }
      ),
    };
  }

  // Asynchronously record lastUsedAt without blocking request
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return {
    success: true,
    organizationId: apiKey.organization.id,
    organizationName: apiKey.organization.name,
    organizationSlug: apiKey.organization.slug,
    apiKeyId: apiKey.id,
    apiKeyName: apiKey.name,
    scopes: scopesList,
    servicePointId: apiKey.servicePointId,
  };
}

/**
 * Redacts secret API keys and tokens for safe logging.
 */
export function redactSecret(secret?: string | null): string {
  if (!secret) return "";
  if (secret.length <= 10) return "***";
  return `${secret.substring(0, 8)}...${secret.substring(secret.length - 4)}`;
}
