import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

export const SESSION_COOKIE_NAME = "session";

export interface SessionPayload {
  userId: string;
  role: Role;
  mustChangePassword: boolean;
}

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE || "28800");

export function getSessionSecret(): string {
  return SESSION_SECRET;
}

export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getSessionSecret(), { expiresIn: SESSION_MAX_AGE });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getSessionSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
  };
}

export function getSessionCookieClearOptions() {
  return {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
  };
}
