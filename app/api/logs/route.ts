import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapDailyLog } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { SubmitDailyLogSchema } from "@/app/api/_lib/validation";
import { uploadBase64Image } from "@/src/lib/supabase";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";

export async function GET(request: NextRequest) {
  let user: any;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { intern_id, project_id } = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }
    if (project_id) {
      whereClause.projectId = String(project_id);
    }

    const dbLogs = await prisma.dailyLog.findMany({
      where: { ...whereClause, isHidden: false },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(dbLogs.map(mapDailyLog));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user: any;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(SubmitDailyLogSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { intern_id, project_id, summary, technologies, changes, screenshot_url, github_url } = body;

  try {
    const prisma = getPrisma();
    const todayStr = getRelativeDateStr(0);

    let resolvedScreenshotUrl = screenshot_url || null;
    if (screenshot_url && screenshot_url.startsWith("data:image/")) {
      try {
        resolvedScreenshotUrl = await uploadBase64Image(screenshot_url);
      } catch (err) {
        console.warn("Storage upload failed, keeping original base64/placeholder:", err);
      }
    }

    const created = await prisma.dailyLog.create({
      data: {
        internId: intern_id,
        projectId: project_id,
        summary,
        technologies: technologies || [],
        changes,
        screenshotUrl: resolvedScreenshotUrl,
        githubUrl: github_url,
        date: todayStr,
        status: 'DRAFT',
        organizationId: user.organizationId as string,
      },
    });

    return NextResponse.json(mapDailyLog(created));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
