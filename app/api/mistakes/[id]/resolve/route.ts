import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapMistake } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { ResolveMistakeSchema } from "@/app/api/_lib/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(ResolveMistakeSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { resolved } = body;

  try {
    const prisma = getPrisma();
    const updated = await prisma.mistake.update({
      where: { id },
      data: { resolved: !!resolved },
    });
    return NextResponse.json(mapMistake(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}