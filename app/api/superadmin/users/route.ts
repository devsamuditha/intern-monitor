import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapUser } from "@/app/api/_lib/mappers";
import { Role } from "@prisma/client";
import { validateBody } from "@/app/api/_lib/validation";
import { CreateUserBySuperAdminSchema } from "@/app/api/_lib/validation";
import { logAudit } from "@/app/api/_lib/mappers";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
    requireSuperAdmin(user);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(CreateUserBySuperAdminSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { name, email, role, techLeadId } = body;

  try {
    const prisma = getPrisma();
    const prismaRole = role.toUpperCase() as Role;
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered in database" }, { status: 400 });
    }
    const avatarUrl = `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role: prismaRole,
        avatarUrl,
        techLeadId: null,
        isActive: true,
      },
    });
    await logAudit(prisma, user.id, "USER_CREATED", "USER", newUser.id, undefined, { name, email, role: prismaRole });
    return NextResponse.json({ user: mapUser(newUser) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
