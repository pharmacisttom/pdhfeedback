/**
 * Resolves current application base URL dynamically.
 * Prioritizes:
 * 1. NEXT_PUBLIC_APP_URL environment variable
 * 2. Incoming request headers (x-forwarded-proto, x-forwarded-host, or host)
 * 3. Fallback to http://localhost:3000
 */
export function getAppBaseUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }

  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) {
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}
