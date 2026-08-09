import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { Role } from "@prisma/client";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";
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

  try {
    const prisma = getPrisma();

    const internsClause: any = scopeToOrganization({ role: Role.INTERN }, user);
    const targetInterns = await prisma.user.findMany({
      where: internsClause,
      select: { id: true, name: true, avatarUrl: true },
    });
    const internIds = targetInterns.map((i: any) => i.id);

    if (internIds.length === 0) {
      return NextResponse.json({ ranking: [], topPerformerThisWeek: null });
    }

    const todayStr = getRelativeDateStr(0);
    const today = new Date(todayStr + 'T12:00:00Z');
    const dayOfWeek = today.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const sundayOffset = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const mondayStr = getRelativeDateStr(mondayOffset);
    const sundayStr = getRelativeDateStr(sundayOffset);

    const allMarks = await prisma.mark.findMany({
      where: {
        ...scopeToOrganization({}, user),
        internId: { in: internIds },
      },
      select: { internId: true, score: true, date: true },
    });

    const thisWeekMarks = allMarks.filter((m: any) => m.date >= mondayStr && m.date <= sundayStr);

    const marksByIntern = new Map<string, any[]>();
    for (const mark of allMarks) {
      if (!marksByIntern.has(mark.internId)) {
        marksByIntern.set(mark.internId, []);
      }
      marksByIntern.get(mark.internId)!.push(mark);
    }

    const thisWeekMarksByIntern = new Map<string, any[]>();
    for (const mark of thisWeekMarks) {
      if (!thisWeekMarksByIntern.has(mark.internId)) {
        thisWeekMarksByIntern.set(mark.internId, []);
      }
      thisWeekMarksByIntern.get(mark.internId)!.push(mark);
    }

    const ranking = targetInterns.map((intern: any) => {
      const marks = marksByIntern.get(intern.id) || [];
      const thisWeekMarksList = thisWeekMarksByIntern.get(intern.id) || [];

      const overallAvg = marks.length > 0
        ? parseFloat((marks.reduce((acc: number, m: any) => acc + m.score, 0) / marks.length).toFixed(1))
        : 0;

      const thisWeekAvg = thisWeekMarksList.length > 0
        ? parseFloat((thisWeekMarksList.reduce((acc: number, m: any) => acc + m.score, 0) / thisWeekMarksList.length).toFixed(1))
        : null;

      const totalMarks = marks.length;

      return {
        internId: intern.id,
        name: intern.name,
        avatar: intern.avatarUrl,
        overallAvg,
        thisWeekAvg,
        totalMarks,
      };
    });

    ranking.sort((a, b) => {
      if (a.thisWeekAvg !== null && b.thisWeekAvg !== null) {
        if (b.thisWeekAvg !== a.thisWeekAvg) return b.thisWeekAvg - a.thisWeekAvg;
      } else if (a.thisWeekAvg === null && b.thisWeekAvg !== null) {
        return 1;
      } else if (a.thisWeekAvg !== null && b.thisWeekAvg === null) {
        return -1;
      }

      if (b.overallAvg !== a.overallAvg) return b.overallAvg - a.overallAvg;
      return a.name.localeCompare(b.name);
    });

    const topPerformerThisWeek = ranking.length > 0 && ranking[0].thisWeekAvg !== null
      ? {
          internId: ranking[0].internId,
          name: ranking[0].name,
          avatar: ranking[0].avatar,
          thisWeekAvg: ranking[0].thisWeekAvg,
        }
      : null;

    return NextResponse.json({ ranking, topPerformerThisWeek });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
