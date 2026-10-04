/**
 * Embed & Origin Security Utilities
 * 
 * Provides strict validation of website origins for iframe embedding and CSP headers.
 * Rule: Origins must be exact: scheme + hostname + optional port (e.g. "https://hospital.th", "https://portal.hospital.th:8443").
 * Wildcards, regex patterns, suffix matches, and path components are strictly prohibited.
 * In production, only HTTPS is accepted. Localhost/127.0.0.1 is allowed in development.
 */

export interface NormalizedOriginResult {
  isValid: boolean;
  normalized?: string;
  error?: string;
}

/**
 * Normalizes and strictly validates a website origin for embedding allowlist.
 */
export function normalizeWebsiteOrigin(rawInput: string): NormalizedOriginResult {
  if (!rawInput || typeof rawInput !== "string") {
    return { isValid: false, error: "กรุณาระบุ URL Origin ของเว็บไซต์" };
  }

  const trimmed = rawInput.trim();

  // Prohibit wildcard patterns
  if (trimmed.includes("*") || trimmed.includes("%") || trimmed.includes("?") || trimmed.includes("#")) {
    return { isValid: false, error: "ไม่อนุญาตให้ใช้ Wildcard (*) หรือ Pattern พิเศษ ต้องระบุเป็น Exact Origin เท่านั้น" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: "รูปแบบ URL ไม่ถูกต้อง ต้องระบุ Protocol เช่น https://yourdomain.com" };
  }

  // Must only contain scheme, hostname, and optional port (no path, query, hash)
  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    return { isValid: false, error: "Origin ต้องไม่มี Path (เช่น /path หรือ /page) ให้ระบุเฉพาะ Domain และ Protocol" };
  }

  const isLocalhost =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname.endsWith(".localhost");

  const isDev = process.env.NODE_ENV !== "production";

  if (parsed.protocol === "http:") {
    if (!isLocalhost && !isDev) {
      return { isValid: false, error: "ในระบบจริง (Production) อนุญาตเฉพาะ HTTPS เท่านั้น เพื่อความปลอดภัยของข้อมูล" };
    }
  } else if (parsed.protocol !== "https:") {
    return { isValid: false, error: "รองรับเฉพาะ HTTPS (หรือ HTTP สำหรับ Localhost)" };
  }

  // Build exact normalized origin (scheme://hostname[:port])
  const portPart = parsed.port ? `:${parsed.port}` : "";
  const normalized = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${portPart}`;

  return { isValid: true, normalized };
}

/**
 * Checks if a given request origin matches any allowed origin in the publication.
 */
export function isOriginAllowed(requestOrigin: string | null | undefined, allowedOriginsList: string[]): boolean {
  if (!requestOrigin) return false;

  const normalizedReq = normalizeWebsiteOrigin(requestOrigin);
  if (!normalizedReq.isValid || !normalizedReq.normalized) {
    return false;
  }

  const target = normalizedReq.normalized.toLowerCase();

  return allowedOriginsList.some((allowed) => {
    const normAllowed = normalizeWebsiteOrigin(allowed);
    return normAllowed.isValid && normAllowed.normalized?.toLowerCase() === target;
  });
}

/**
 * Builds standard Content-Security-Policy (CSP) `frame-ancestors` directive.
 * 
 * If allowed origins exist: "frame-ancestors 'self' https://domain1.com https://domain2.com"
 * If no external origins configured: "frame-ancestors 'self'"
 */
export function buildFrameAncestorsCsp(allowedOrigins: string[] = []): string {
  const validOrigins: string[] = [];

  for (const raw of allowedOrigins) {
    const res = normalizeWebsiteOrigin(raw);
    if (res.isValid && res.normalized) {
      validOrigins.push(res.normalized);
    }
  }

  if (validOrigins.length === 0) {
    return "frame-ancestors 'self'";
  }

  return `frame-ancestors 'self' ${validOrigins.join(" ")}`;
}

/**
 * Validates postMessage event schema.
 */
export interface WidgetPostMessage {
  type:
    | "tomvisfeedback:ready"
    | "tomvisfeedback:resize"
    | "tomvisfeedback:submitted"
    | "tomvisfeedback:close"
    | "tomvisfeedback:error"
    | "pdhfeedback:ready"
    | "pdhfeedback:resize"
    | "pdhfeedback:submitted"
    | "pdhfeedback:close"
    | "pdhfeedback:error";
  publicationId: string;
  height?: number;
  timestamp?: number;
  code?: string;
}

export function isValidWidgetMessage(data: any): data is WidgetPostMessage {
  if (!data || typeof data !== "object") return false;
  const validTypes = [
    "tomvisfeedback:ready",
    "tomvisfeedback:resize",
    "tomvisfeedback:submitted",
    "tomvisfeedback:close",
    "tomvisfeedback:error",
    "pdhfeedback:ready",
    "pdhfeedback:resize",
    "pdhfeedback:submitted",
    "pdhfeedback:close",
    "pdhfeedback:error",
  ];
  return (
    validTypes.includes(data.type) &&
    typeof data.publicationId === "string" &&
    data.publicationId.length > 0
  );
}
