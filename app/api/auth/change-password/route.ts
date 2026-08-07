import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { validateBody } from "@/app/api/_lib/validation";
import { ChangePasswordSchema, ResetFirstPasswordSchema } from "@/app/api/_lib/validation";
import { hashPassword, comparePassword } from "@/src/lib/auth";
import { signSession, SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/src/lib/jwt";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const prisma = getPrisma();
    const isFirstLogin = user.mustChangePassword;

    let newPassword: string;

    if (isFirstLogin) {
      const body = await validateBody(ResetFirstPasswordSchema)(request);
      newPassword = body.password;
    } else {
      const body = await validateBody(ChangePasswordSchema)(request);
      const passwordValid = await comparePassword(body.currentPassword, user.passwordHash);
      if (!passwordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
      newPassword = body.newPassword;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(newPassword),
        mustChangePassword: false,
      },
    });

    const token = signSession({
      userId: user.id,
      role: user.role,
      mustChangePassword: false,
      organizationId: user.organizationId as string,
    });

    const response = NextResponse.json({ success: true, mustChangePassword: false });
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (err: any) {
    console.error("Change password endpoint error:", err);
    const status = err.message.includes("Validation") ? 400 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
