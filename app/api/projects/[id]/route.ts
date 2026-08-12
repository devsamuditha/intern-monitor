import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireRole } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { Role } from "@prisma/client";
import { mapProject } from "@/app/api/_lib/mappers";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const { id } = await params;
    const prisma = getPrisma();
    const project = await prisma.project.findFirst({
      where: { id, ...scopeToOrganization({}, user) },
      include: { owner: { select: { name: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (user.role === Role.INTERN) {
      const isOwner = project.ownerId === user.id;
      const isAssigned = project.assignedInternIds.includes(user.id);
      if (!isOwner && !isAssigned) {
        return NextResponse.json({ error: "Forbidden: You do not have access to this project." }, { status: 403 });
      }
    }

    return NextResponse.json(mapProject(project));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await withAuth(request);
    requireRole(user, [Role.TECH_LEAD, Role.MANAGER, Role.SUPER_ADMIN]);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const { id } = await params;
    const prisma = getPrisma();
    const project = await prisma.project.findFirst({
      where: { id, ...scopeToOrganization({}, user) },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.dailyLog.deleteMany({
      where: { projectId: id, ...scopeToOrganization({}, user) },
    });

    await prisma.daySession.updateMany({
      where: { todayProject: project.name, ...scopeToOrganization({}, user) },
      data: { todayProject: null },
    });

    await prisma.project.delete({
      where: { id, ...scopeToOrganization({}, user) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
