import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapQuestion } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { AskQuestionSchema, ReplyQuestionSchema } from "@/app/api/_lib/validation";

export async function GET(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const prisma = getPrisma();
    const dbQs = await prisma.question.findMany({
      where: { isHidden: false },
      include: {
        replies: {
          where: { isHidden: false },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(dbQs.map(mapQuestion));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(AskQuestionSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { intern_id, title, content } = body;

  try {
    const prisma = getPrisma();
    const created = await prisma.question.create({
      data: {
        internId: intern_id,
        title,
        content,
      },
      include: { replies: true },
    });
    return NextResponse.json(mapQuestion(created));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
