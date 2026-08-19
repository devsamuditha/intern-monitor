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

  // Authorize based on role
  if (user.role === Role.TECH_LEAD) {
    if (body.role.toUpperCase() !== "INTERN") {
      return NextResponse.json({ error: "Tech leads are only authorized to register interns." }, { status: 403 });
    }
    // Force the techLeadId to be the registering Tech Lead
    body.techLeadId = user.id;
  } else if (user.role !== Role.MANAGER && user.role !== Role.SUPER_ADMIN) {
    return NextResponse.json({ error: "Forbidden: Unauthorized to register users." }, { status: 403 });
  }

  try {
    const result = await createUserWithCredentials({
      name: body.name,
      email: body.email,
      role: body.role,
      techLeadId: body.techLeadId,
      actorId: user.id,
      organizationId: user.organizationId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Registration endpoint error:", error);
    const status = error.message.includes("already registered") ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
