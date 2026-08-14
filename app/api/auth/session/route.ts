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

    const mappedUser = { ...mapUser(dbUser), mustChangePassword: dbUser.mustChangePassword };

    if (dbUser.role === "TECH_LEAD" && dbUser.organizationId) {
      try {
        const today = new Date();
        const istDate = new Date(today.getTime() + today.getTimezoneOffset() * 60000 + 5.5 * 3600000);
        const todayStr = istDate.toISOString().split('T')[0];
        const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);

        const interns = await prisma.user.findMany({
          where: {
            techLeadId: dbUser.id,
            isActive: true,
            organizationId: dbUser.organizationId,
          },
          select: { id: true },
        });

        for (const intern of interns) {
          const existing = await prisma.notification.findFirst({
            where: {
              userId: intern.id,
              type: "techlead_login",
              organizationId: dbUser.organizationId,
              createdAt: { gte: startOfDay },
            },
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                userId: intern.id,
                organizationId: dbUser.organizationId,
                type: "techlead_login",
                title: "Tech Lead Is Online",
                message: `${dbUser.name} has logged in today`,
                isRed: false,
              },
            });
          }
        }
      } catch (e) {
        console.error("Failed to create techlead_login notifications:", e);
      }
    }

    return NextResponse.json({ user: mappedUser });
  } catch (error: any) {
    console.error("Session endpoint error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
