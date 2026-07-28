import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/src/db/prisma";
import { mapUser } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { LoginSchema } from "@/app/api/_lib/validation";
import { logger } from "@/src/lib/logger";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await validateBody(LoginSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { email } = body;

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with this email in the database" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "This account is inactive. Please contact your manager." }, { status: 403 });
    }

    return NextResponse.json({ user: mapUser(user) });
  } catch (error: any) {
    logger.error({ err: error }, "Login endpoint error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
