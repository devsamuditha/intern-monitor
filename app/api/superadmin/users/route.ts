import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { validateBody } from "@/app/api/_lib/validation";
import { CreateUserBySuperAdminSchema } from "@/app/api/_lib/validation";
import { createUserWithCredentials } from "@/app/api/_lib/userService";
import { authStatusFromError } from "@/app/api/_lib/withAuth";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
    requireSuperAdmin(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: authStatusFromError(err) });
  }

  let body;
  try {
    body = await validateBody(CreateUserBySuperAdminSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    const result = await createUserWithCredentials({
      name: body.name,
      email: body.email,
      username: body.username,
      password: body.password,
      role: body.role,
      techLeadId: body.techLeadId,
      organizationId: body.organizationId,
      actorId: user.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("SuperAdmin user creation error:", error);
    const status = error.message.includes("already registered") || error.message.includes("already exists") ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
