import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapMessage } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { SendMessageSchema, ReadMessagesSchema } from "@/app/api/_lib/validation";

export async function GET(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { user_a, user_b } = Object.fromEntries(request.nextUrl.searchParams);
  if (!user_a || !user_b) {
    return NextResponse.json({ error: "Missing parameters user_a or user_b" }, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const dbMsgs = await prisma.message.findMany({
      where: {
        OR: [
          { fromId: String(user_a), toId: String(user_b) },
          { fromId: String(user_b), toId: String(user_a) },
        ],
        isHidden: false,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(dbMsgs.map(mapMessage));
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
    body = await validateBody(SendMessageSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { from_id, to_id, content } = body;

  try {
    const prisma = getPrisma();
    const created = await prisma.message.create({
      data: {
        fromId: from_id,
        toId: to_id,
        content,
      },
    });
    return NextResponse.json(mapMessage(created));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(ReadMessagesSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { user_id, sender_id } = body;

  try {
    const prisma = getPrisma();
    await prisma.message.updateMany({
      where: {
        toId: String(user_id),
        fromId: String(sender_id),
        read: false,
      },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
