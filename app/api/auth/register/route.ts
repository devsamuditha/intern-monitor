import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireRole } from "@/app/api/_lib/withAuth";
import { validateBody } from "@/app/api/_lib/validation";
import { RegisterUserSchema } from "@/app/api/_lib/validation";
import { createUserWithCredentials } from "@/app/api/_lib/userService";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
    requireRole(user, [Role.MANAGER, Role.SUPER_ADMIN]);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(RegisterUserSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    const result = await createUserWithCredentials({
      name: body.name,
      email: body.email,
      role: body.role,
      techLeadId: body.techLeadId,
      actorId: user.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Registration endpoint error:", error);
    const status = error.message.includes("already registered") ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
