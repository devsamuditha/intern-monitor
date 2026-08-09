import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireRole } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { Role } from "@prisma/client";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await withAuth(request);
    requireRole(user, [Role.MANAGER, Role.SUPER_ADMIN]);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const { id } = await params;
    const prisma = getPrisma();
    const project = await prisma.project.findFirst({
      where: { id, ...scopeToOrganization({}, user) },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: { id, ...scopeToOrganization({}, user) },
      data: { status: "ARCHIVED" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
