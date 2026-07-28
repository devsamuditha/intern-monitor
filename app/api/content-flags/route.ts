import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapContentFlag } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { CreateContentFlagSchema } from "@/app/api/_lib/validation";
import { logAudit } from "@/app/api/_lib/mappers";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(CreateContentFlagSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { contentType, contentId, reason } = body;

  try {
    const prisma = getPrisma();
    const userObj = user;

    let contentAuthorId: string | null = null;
    const contentTypeLower = contentType.toLowerCase();

    if (contentTypeLower === "message") {
      const msg = await prisma.message.findUnique({ where: { id: contentId } });
      if (msg) contentAuthorId = msg.fromId;
    } else if (contentTypeLower === "question") {
      const q = await prisma.question.findUnique({ where: { id: contentId } });
      if (q) contentAuthorId = q.internId;
    } else if (contentTypeLower === "reply") {
      const r = await prisma.reply.findUnique({ where: { id: contentId } });
      if (r) contentAuthorId = r.authorId;
    } else if (contentTypeLower === "daily_log") {
      const log = await prisma.dailyLog.findUnique({ where: { id: contentId } });
      if (log) contentAuthorId = log.internId;
    }

    if (!contentAuthorId) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    if (userObj.id === contentAuthorId) {
      return NextResponse.json({ error: "You cannot flag your own content" }, { status: 400 });
    }

    const existing = await prisma.contentFlag.findFirst({
      where: {
        userId: userObj.id,
        contentId,
        contentType: contentTypeLower,
        status: "pending",
      },
    });
    if (existing) {
      return NextResponse.json({ error: "You have already flagged this content" }, { status: 400 });
    }

    const flag = await prisma.contentFlag.create({
      data: {
        userId: userObj.id,
        contentId,
        contentType: contentTypeLower,
        reason,
        status: "pending",
      },
    });

    await logAudit(prisma, userObj.id, "CONTENT_FLAG_CREATED", contentType.toUpperCase(), contentId, undefined, { reason });

    return NextResponse.json(mapContentFlag(flag), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
