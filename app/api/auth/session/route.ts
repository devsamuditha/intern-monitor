import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/src/db/prisma";
import { mapUser, SAFE_USER_SELECT } from "@/app/api/_lib/mappers";
import { verifySession, SESSION_COOKIE_NAME, getSessionCookieClearOptions } from "@/src/lib/jwt";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const payload = verifySession(token);
  if (!payload) {
    const res = NextResponse.json({ user: null }, { status: 200 });
    res.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
    return res;
  }

  try {
    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: SAFE_USER_SELECT,
    });

    if (!dbUser || !dbUser.isActive) {
      const res = NextResponse.json({ user: null }, { status: 200 });
      res.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
      return res;
    }

    return NextResponse.json({ user: { ...mapUser(dbUser), mustChangePassword: dbUser.mustChangePassword } });
  } catch (error: any) {
    console.error("Session endpoint error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
