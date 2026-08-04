import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { logger } from "@/src/lib/logger";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
    requireSuperAdmin(user);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const prisma = getPrisma();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const summary = await prisma.auditLog.groupBy({
      by: ["userId"],
      where: { timestamp: { gte: oneWeekAgo } },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    });

    const userIds = summary.map((s) => s.userId);
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    }) : [];

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const result = summary.map((s) => ({
      actorId: s.userId,
      actorName: userMap.get(s.userId) || undefined,
      count: s._count.userId,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error({ err: error, route: "api/superadmin/audit-logs/summary", user: user?.id }, "Failed to build audit summary");
    return NextResponse.json({ error: "Internal Server Error", code: "internal_error" }, { status: 500 });
  }
}
