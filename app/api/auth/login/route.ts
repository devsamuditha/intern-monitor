import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/src/db/prisma";
import { mapUser } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { LoginSchema } from "@/app/api/_lib/validation";
import { comparePassword } from "@/src/lib/auth";
import { signSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/src/lib/jwt";
import { rateLimit, getClientIdentity } from "@/src/lib/rateLimit";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await validateBody(LoginSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { username, password } = body;

  const identity = `${getClientIdentity(request)}:${username.toLowerCase()}`;
  const { allowed, resetIn } = rateLimit(identity);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${Math.ceil(resetIn / 1000 / 60)} minute(s).` },
      { status: 429 }
    );
  }

  try {
    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const passwordValid = await comparePassword(password, dbUser.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    if (!dbUser.isActive) {
      return NextResponse.json({ error: "This account is inactive. Please contact your manager." }, { status: 403 });
    }

    const token = signSession({
      userId: dbUser.id,
      role: dbUser.role,
      mustChangePassword: dbUser.mustChangePassword,
    });

    const response = NextResponse.json({ user: { ...mapUser(dbUser), mustChangePassword: dbUser.mustChangePassword } });
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error: any) {
    console.error("Login endpoint error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
