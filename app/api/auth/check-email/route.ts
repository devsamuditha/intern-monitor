import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/src/db/prisma";
import { validateBody } from "@/app/api/_lib/validation";
import { CheckEmailSchema } from "@/app/api/_lib/validation";
import { logger } from "@/src/lib/logger";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await validateBody(CheckEmailSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { email } = body;

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return NextResponse.json({ exists: !!user });
  } catch (error: any) {
    logger.error({ err: error }, "Check email endpoint error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
