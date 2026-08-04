import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapUser } from "@/app/api/_lib/mappers";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";
import { Role, TaskStatus } from "@prisma/client";
import { logAudit, mapAuditLog } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { CreateUserBySuperAdminSchema, ReassignTechLeadSchema } from "@/app/api/_lib/validation";
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

    const usersByRole = await prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
      orderBy: { role: "asc" },
    });

    const activeInterns = await prisma.user.count({
      where: { role: Role.INTERN, isActive: true },
    });
    const inactiveInterns = await prisma.user.count({
      where: { role: Role.INTERN, isActive: false },
    });
    const totalInterns = activeInterns + inactiveInterns;

    const todayStr = getRelativeDateStr(0);
    const activeInternIds = (await prisma.user.findMany({
      where: { role: Role.INTERN, isActive: true },
      select: { id: true },
    })).map((u: any) => u.id);

    const logsToday = await prisma.dailyLog.count({
      where: { internId: { in: activeInternIds }, date: todayStr, isHidden: false },
    });
    const thisWeekStr = getRelativeDateStr(-7);
    const logsThisWeek = await prisma.dailyLog.count({
      where: { internId: { in: activeInternIds }, date: { gte: thisWeekStr }, isHidden: false },
    });
    const submissionComplianceToday = activeInterns > 0 ? Math.round((logsToday / activeInterns) * 100) : 0;
    const submissionComplianceWeek = activeInterns > 0 ? Math.round((logsThisWeek / (activeInterns * 7)) * 100) : 0;

    const allMarks = activeInternIds.length > 0
      ? await prisma.mark.findMany({
          where: { internId: { in: activeInternIds } },
          select: { score: true },
        })
      : [];
    const avgMark = allMarks.length > 0
      ? parseFloat((allMarks.reduce((a: number, m: any) => a + (m.score || 0), 0) / allMarks.length).toFixed(1))
      : 0;
    const marksHistogram = [
      { range: "1-2", count: allMarks.filter((m: any) => (m.score || 0) <= 2).length },
      { range: "3", count: allMarks.filter((m: any) => m.score === 3).length },
      { range: "4-5", count: allMarks.filter((m: any) => (m.score || 0) >= 4).length },
    ];

    const allLogs = activeInternIds.length > 0
      ? await prisma.dailyLog.findMany({
          where: { internId: { in: activeInternIds }, isHidden: false },
          select: { technologies: true },
        })
      : [];

    const techCounts: Record<string, number> = {};
    (allLogs as any[]).forEach((l: any) => {
      (l.technologies || []).forEach((tech: string) => {
        techCounts[tech] = (techCounts[tech] || 0) + 1;
      });
    });
    const mostUsedTechs = Object.entries(techCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const pendingFlags = await prisma.contentFlag.count({
      where: { status: "pending" },
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: "desc" },
      include: { user: true },
    });

    return NextResponse.json({
      usersByRole,
      activeInterns,
      inactiveInterns,
      totalInterns,
      submissionComplianceToday,
      submissionComplianceWeek,
      avgMark,
      marksHistogram,
      mostUsedTechs,
      pendingFlags,
      recentAuditLogs: recentAuditLogs.map((l: any) => mapAuditLog(l)),
    });
  } catch (error: any) {
    // Log full error with stack for debugging, include user context if available
    logger.error({ err: error, route: "api/superadmin/overview", user: user?.id }, "Failed to build superadmin overview");
    const message = error?.message || "Internal Server Error";
    return NextResponse.json({ error: message, code: "internal_error" }, { status: 500 });
  }
}
