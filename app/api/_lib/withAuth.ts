import { NextRequest } from "next/server";
import { getPrisma } from "@/src/db/prisma";
import { verifySession, SESSION_COOKIE_NAME } from "@/src/lib/jwt";
import { logger } from "@/src/lib/logger";

export class AuthError extends Error {
  public status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function authStatusFromError(err: any): number {
  if (err instanceof AuthError) return err.status;
  const msg = err?.message || "";
  if (msg.includes("Unauthorized")) return 401;
  if (msg.includes("Forbidden")) return 403;
  return 500;
}

export async function withAuth(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    throw new AuthError("Unauthorized: Missing or invalid authorization header.", 401);
  }

  const payload = verifySession(token);
  if (!payload) {
    throw new AuthError("Unauthorized: Invalid or expired session.", 401);
  }

  try {
    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!dbUser) {
      throw new AuthError("Unauthorized: User not found in the database.", 401);
    }

    if (!dbUser.isActive) {
      throw new AuthError("Forbidden: This account is inactive.", 403);
    }

    return dbUser;
  } catch (error: any) {
    // Preserve auth errors, but log and surface a generic error for DB failures
    if (error instanceof AuthError) throw error;
    logger.error({ err: error, userId: payload?.userId }, "withAuth: database error");
    throw new Error("Internal Server Error");
  }
}

export function requireRole(user: { role: string }, allowed: string[]) {
  if (!allowed.includes(user.role)) {
    throw new AuthError("Forbidden: You do not have permission to perform this action.", 403);
  }
}

export function requireSuperAdmin(user: any) {
  if (user.role !== "super_admin" && user.role !== "SUPER_ADMIN") {
    throw new AuthError("Forbidden: Super Admin access required", 403);
  }
}
