import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapAuditLog } from "@/app/api/_lib/mappers";
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

  const { action, targetType, userId, actorId, startDate, endDate, limit, offset } = Object.fromEntries(request.nextUrl.searchParams);

  let where: any = {};

  try {
    const prisma = getPrisma();
    if (action && typeof action === "string") where.action = action;
    if (targetType && typeof targetType === "string") where.targetType = targetType;
    if (userId && typeof userId === "string") where.userId = userId;
    if (actorId && typeof actorId === "string") where.userId = actorId;
    if (startDate && typeof startDate === "string") where.timestamp = { ...(where.timestamp || {}), gte: new Date(startDate as string) };
    if (endDate && typeof endDate === "string") where.timestamp = { ...(where.timestamp || {}), lte: new Date(endDate as string) };

    const parsedLimit = Math.min(Number(limit) || 50, 200);
    const parsedOffset = Number(offset) || 0;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        include: { user: true },
        take: parsedLimit,
        skip: parsedOffset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs: logs.map(mapAuditLog), total, limit: parsedLimit, offset: parsedOffset });
  } catch (error: any) {
    logger.error({ err: error, route: "api/superadmin/audit-logs", user: user?.id, where }, "Failed to load audit logs");
    return NextResponse.json({ error: "Internal Server Error", code: "internal_error" }, { status: 500 });
  }
}
