import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapTask } from "@/app/api/_lib/mappers";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { assigned_to, assigned_by } = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const prisma = getPrisma();
    const whereClause: any = scopeToOrganization({}, user);
    if (assigned_to) {
      whereClause.assignedToId = String(assigned_to);
    }
    if (assigned_by) {
      whereClause.assignedById = String(assigned_by);
    }

    const dbTasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true, organizationId: true, assignedToId: true, assignedById: true,
        title: true, description: true, dueDate: true, priority: true,
        status: true, completedAt: true, score: true, comment: true,
        blockers: true, prLink: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(dbTasks.map(mapTask));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const prisma: any = getPrisma();
    const created = await prisma.task.create({
      data: {
        assignedToId: body.assigned_to,
        assignedById: body.assigned_by || user.id,
        title: body.title,
        description: body.description,
        dueDate: body.due_date,
        priority: (body.priority || "MEDIUM").toUpperCase(),
        status: "TODO",
        organizationId: user.organizationId as string,
        score: body.score !== undefined ? body.score : undefined,
      },
    });

    return NextResponse.json(mapTask(created));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
