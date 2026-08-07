import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireRole } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { Role } from "@prisma/client";
import { mapProject } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { ProjectSchema } from "@/app/api/_lib/validation";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assignedTechLeadId = searchParams.get("assigned_tech_lead_id");

    const where: any = scopeToOrganization({}, user);
    if (status) where.status = status.toUpperCase();
    if (assignedTechLeadId) {
      const ids = assignedTechLeadId.split(',').map(s => s.trim()).filter(Boolean);
      if (ids.length === 1) {
        where.assignedTechLeadIds = { has: ids[0] };
      } else if (ids.length > 1) {
        where.assignedTechLeadIds = { hasSome: ids };
      }
    }

 const dbProjects = await prisma.project.findMany({
        where,
        include: { owner: { select: { name: true } } },
        orderBy: [
          { createdAt: "desc" },
          { name: "asc" },
        ],
      });
    return NextResponse.json(dbProjects.map(mapProject));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
    requireRole(user, [Role.MANAGER, Role.TECH_LEAD, Role.SUPER_ADMIN, Role.INTERN]);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(ProjectSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const {
    id,
    name,
    description,
    github_url,
    tech_stack,
    owner_id,
    screenshots,
    status,
    start_date,
    end_date,
    assigned_tech_lead_ids,
  } = body;

  try {
    const prisma = getPrisma();
    if (id) {
      const existing = await prisma.project.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      const updated = await prisma.project.update({
        where: { id },
        data: {
          name,
          description,
          githubUrl: github_url,
          techStack: tech_stack || [],
          screenshots: screenshots || [],
          status: status ? (status.toUpperCase() as any) : undefined,
          startDate: start_date || undefined,
          endDate: end_date || undefined,
          assignedTechLeadIds: assigned_tech_lead_ids || undefined,
        },
      });
      return NextResponse.json(mapProject(updated));
    }

    const created = await prisma.project.create({
      data: {
        name,
        description,
        githubUrl: github_url,
        techStack: tech_stack || [],
        ownerId: owner_id as any,
        screenshots: screenshots || ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"],
        status: status ? (status.toUpperCase() as any) : 'ACTIVE',
        startDate: start_date || undefined,
        endDate: end_date || undefined,
        assignedTechLeadIds: assigned_tech_lead_ids || undefined,
        organizationId: user.organizationId as string,
      } as any,
    });
    return NextResponse.json(mapProject(created));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
