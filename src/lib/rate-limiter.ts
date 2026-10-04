import crypto from "crypto";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window cache for fast rate limiting
const memoryStore = new Map<string, RateLimitRecord>();

const SALT = process.env.AUTH_SALT || "pdhfeedback_ip_hasher_salt_2026";

/**
 * Creates a one-way pseudonymous SHA-256 hash of an IP address with a secret salt.
 * Used for rate-limiting and audit abuse prevention without storing raw IP.
 */
export function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(`${ip}:${SALT}`).digest("hex");
}

/**
 * Rate limit check: allows maximum `maxRequests` per `windowSeconds`.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (record.count >= maxRequests) {
    const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  record.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInSeconds,
  };
}
