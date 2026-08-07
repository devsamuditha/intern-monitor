import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapQuestion } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { ReplyQuestionSchema } from "@/app/api/_lib/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user: any;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(ReplyQuestionSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { user_id, content } = body;

  try {
    const prisma = getPrisma();
    await prisma.reply.create({
      data: {
        questionId: id,
        authorId: user.id,
        content: body.content,
        organizationId: user.organizationId as string,
      },
    });

    const updatedQ = await prisma.question.findUnique({
      where: { id },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return NextResponse.json(mapQuestion(updatedQ));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}