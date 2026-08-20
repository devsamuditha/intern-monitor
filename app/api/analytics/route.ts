import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { Role, TaskStatus } from "@prisma/client";
import { getRelativeDateStr, mapDaySession } from "@/app/api/_lib/mappers";
import { getISTDate } from "@/src/utils/time";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { tech_lead_id } = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const prisma = getPrisma();

    const internsClause: any = scopeToOrganization({ role: Role.INTERN }, user);
    if (tech_lead_id) {
      internsClause.techLeadId = String(tech_lead_id);
    }
    const targetInterns = await prisma.user.findMany({
      where: internsClause,
      select: { id: true, name: true, avatarUrl: true, isActive: true, techLeadId: true },
    });
    const internIds = targetInterns.map((i: any) => i.id);

    const todayStr = getRelativeDateStr(0);
    const allLogs = await prisma.dailyLog.findMany({
      where: scopeToOrganization({ internId: { in: internIds }, isHidden: false }, user),
      select: {
        id: true, internId: true, projectId: true, summary: true,
        technologies: true, changes: true, githubUrl: true, date: true,
        status: true, organizationId: true,
      },
    });
    const allMarks = await prisma.mark.findMany({
      where: scopeToOrganization({ internId: { in: internIds } }, user),
      select: { id: true, internId: true, score: true, date: true, organizationId: true },
    });
    const allTasks = await prisma.task.findMany({
      where: scopeToOrganization({ assignedToId: { in: internIds } }, user),
      select: { id: true, assignedToId: true, status: true, score: true, organizationId: true },
    });
    const allMistakes = await prisma.mistake.findMany({
      where: scopeToOrganization({ internId: { in: internIds } }, user),
      select: { id: true, internId: true, resolved: true, organizationId: true },
    });
    const allProjects = await prisma.project.findMany({
      where: scopeToOrganization({}, user),
      select: { id: true, name: true, assignedInternIds: true, organizationId: true },
    });
    const todaySessions = await (prisma as any).daySession.findMany({
      where: scopeToOrganization({ date: todayStr }, user),
      select: { id: true, internId: true, status: true, startedAt: true, endedAt: true, earlyExitRequested: true, earlyExitReason: true, earlyExitApproved: true, missedFinalJournal: true, organizationId: true },
    });
    const last7Days = Array.from({ length: 7 }, (_, idx) => getRelativeDateStr(-idx)).reverse();
    const allWeekSessions = await (prisma as any).daySession.findMany({
      where: scopeToOrganization({ date: { in: last7Days } }, user),
      select: { id: true, internId: true, startedAt: true, endedAt: true, organizationId: true },
    });

    const submittedTodayCount = allLogs.filter((l: any) => l.date === todayStr).length;
    const complianceRate = targetInterns.length > 0 ? Math.round((submittedTodayCount / targetInterns.length) * 100) : 0;
    const avgMarks = allMarks.length > 0 ? parseFloat((allMarks.reduce((acc: number, curr: any) => acc + curr.score, 0) / allMarks.length).toFixed(1)) : 0;
    const totalLogs = allLogs.length;
    const activeCount = targetInterns.filter((u: any) => {
      const s = todaySessions.find((s: any) => s.internId === u.id);
      return s && s.status === 'active';
    }).length;
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t: any) => t.status === TaskStatus.DONE).length;

    const istNow = getISTDate();
    const istMinutes = istNow.getHours() * 60 + istNow.getMinutes();
    const deadline130Passed = istMinutes >= 14 * 60 + 30;
    const deadline500Passed = istMinutes >= 17 * 60;
    const deadline530Passed = istMinutes >= 17 * 60 + 30;

    const rosterData = targetInterns.map((intern: any) => {
      const iLogs = allLogs.filter((l: any) => l.internId === intern.id);
      const iMarks = allMarks.filter((m: any) => m.internId === intern.id);
      const iTasks = allTasks.filter((t: any) => t.assignedToId === intern.id);
      const iMistakes = allMistakes.filter((m: any) => m.internId === intern.id);
      const iTodaySession = todaySessions.find((s: any) => s.internId === intern.id);

      const lastSub = iLogs.length > 0 ? iLogs.sort((a: any, b: any) => b.date.localeCompare(a.date))[0].date : "Never";
      const todayStr = getRelativeDateStr(0);
      const submittedLogToday = iLogs.some((l: any) => l.date === todayStr);
      const iAvgMark = iMarks.length > 0 ? parseFloat((iMarks.reduce((acc: number, curr: any) => acc + curr.score, 0) / iMarks.length).toFixed(1)) : 0;
      const iWeekSessions = allWeekSessions.filter((s: any) => s.internId === intern.id && s.endedAt);
      const totalWeekMinutes = iWeekSessions.reduce((acc: number, s: any) => {
        const start = new Date(`2000-01-01T${s.startedAt}`);
        const end = new Date(`2000-01-01T${s.endedAt}`);
        return acc + Math.max((end.getTime() - start.getTime()) / 60000, 0);
      }, 0);
      const avgWorkingHours = iWeekSessions.length > 0
        ? parseFloat((totalWeekMinutes / 60 / iWeekSessions.length).toFixed(1))
        : 0;
      const logDates = Array.from(new Set(iLogs.map((l: any) => l.date))).sort().reverse();
      const yesterdayObj = new Date(); yesterdayObj.setDate(yesterdayObj.getDate() - 1);
      const yesterdayStr = yesterdayObj.toISOString().split('T')[0];
      let realStreak = 0;
      if (logDates.includes(todayStr) || logDates.includes(yesterdayStr)) {
        let checkDate = new Date(logDates.includes(todayStr) ? todayStr : yesterdayStr);
        while (true) {
          const ds = checkDate.toISOString().split('T')[0];
          if (logDates.includes(ds)) { realStreak++; checkDate.setDate(checkDate.getDate() - 1); }
          else break;
        }
      }

      const assignedProject = allProjects.find((p: any) => (p.assignedInternIds || []).includes(intern.id));
      const assignedProjectName = assignedProject ? assignedProject.name : "Unassigned";

      return {
        intern: {
          id: intern.id,
          name: intern.name,
          email: intern.email,
          avatar: intern.avatarUrl,
          active: intern.isActive,
          assigned_tech_lead_id: intern.techLeadId || undefined,
        },
        lastSubmission: lastSub,
        missingLog130: deadline130Passed && !submittedLogToday,
        missingLog500: deadline500Passed && !submittedLogToday,
        missingLog530: deadline530Passed && !submittedLogToday,
        submittedLogToday,
        assignedProjectName,
        streak: realStreak,
        avgMark: iAvgMark,
        avgWorkingHours,
        totalTasks: iTasks.length,
        completedTasks: iTasks.filter((t: any) => t.status === TaskStatus.DONE).length,
        unresolvedMistakesCount: iMistakes.filter((m: any) => !m.resolved).length,
        todaySession: mapDaySession(iTodaySession),
      };
    });

    const submissionTrend = last7Days.map((dateStr: string) => {
      const subsCount = allLogs.filter((l: any) => l.date === dateStr).length;
      return { date: dateStr, count: subsCount };
    });

    const techCounts: Record<string, number> = {};
    allLogs.forEach((l: any) => {
      (l.technologies || []).forEach((tech: string) => {
        techCounts[tech] = (techCounts[tech] || 0) + 1;
      });
    });
    const mostUsedTechs = Object.entries(techCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return NextResponse.json({
      complianceRate,
      avgMarks,
      totalLogs,
      activeCount,
      totalTasks,
      completedTasks,
      rosterData,
      submissionTrend,
      mostUsedTechs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
