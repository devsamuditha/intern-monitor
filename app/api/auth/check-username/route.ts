import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/src/db/prisma";
import { validateBody } from "@/app/api/_lib/validation";
import { CheckUsernameSchema } from "@/app/api/_lib/validation";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await validateBody(CheckUsernameSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { username } = body;

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    return NextResponse.json({ exists: !!user });
  } catch (error: any) {
    console.error("Check username endpoint error:", error);
    return NextResponse.json({ exists: false });
  }
}
