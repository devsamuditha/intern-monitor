// Simple in-memory rate limiter for brute-force protection on auth endpoints.
// For multi-instance deployments, back this with Redis or a shared store.

const WINDOW_MS = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const MAX_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || 5);

interface ClientRecord {
  count: number;
  firstAttempt: number;
}

const store = new Map<string, ClientRecord>();

function cleanup() {
  const now = Date.now();
  for (const [key, record] of store) {
    if (now - record.firstAttempt > WINDOW_MS) {
      store.delete(key);
    }
  }
}

export function rateLimit(identifier: string): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const record = store.get(identifier);
  if (!record || now - record.firstAttempt > WINDOW_MS) {
    store.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true, resetIn: WINDOW_MS };
  }
  record.count++;
  const resetIn = Math.max(0, WINDOW_MS - (now - record.firstAttempt));
  if (record.count > MAX_ATTEMPTS) {
    return { allowed: false, resetIn };
  }
  return { allowed: true, resetIn };
}

export function getClientIdentity(request: Request): string {
  const forwarded = (request as any).headers?.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : (request as any).ip || "unknown";
  return ip;
}

export function cleanupRateLimitStore() {
  cleanup();
}
