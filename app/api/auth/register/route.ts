import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/src/db/prisma";
import { mapUser } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { RegisterUserSchema } from "@/app/api/_lib/validation";
import { Role } from "@prisma/client";
import { logger } from "@/src/lib/logger";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await validateBody(RegisterUserSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id, email, name, role, techLeadId } = body;

  try {
    const prisma = getPrisma();
    const prismaRole = role.toUpperCase() as Role;
    if (prismaRole !== Role.INTERN && prismaRole !== Role.TECH_LEAD && prismaRole !== Role.MANAGER && prismaRole !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered in database" }, { status: 400 });
    }

    const avatarUrl = prismaRole === Role.INTERN
      ? `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`
      : `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;

    const user = await prisma.user.create({
      data: {
        id: id || undefined,
        name,
        email: email.toLowerCase(),
        role: prismaRole,
        avatarUrl,
        techLeadId: prismaRole === Role.INTERN ? (techLeadId || null) : null,
        isActive: true,
      },
    });

    return NextResponse.json({ user: mapUser(user) }, { status: 201 });
  } catch (error: any) {
    logger.error({ err: error }, "Registration endpoint error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
