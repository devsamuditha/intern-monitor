import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapTask } from "@/app/api/_lib/mappers";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { scopeToOrganization } from "@/app/api/_lib/tenant";
import { CreateTaskSchema } from "@/app/api/_lib/validation";

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
        blockers: true, prLink: true, createdAt: true, assignedTechLeadIds: true,
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
    const validated = CreateTaskSchema.parse(body);
    const prisma: any = getPrisma();
    const techLeadIds = validated.assigned_tech_lead_ids || [];
    const isTechLeadAssignment = techLeadIds.length > 0;
    const dueDate = validated.start_date || validated.due_date;

    const created = await prisma.task.create({
      data: {
        assignedToId: validated.assigned_to || techLeadIds[0] || undefined,
        assignedById: validated.assigned_by || user.id,
        title: validated.title,
        description: validated.description,
        dueDate: dueDate,
        priority: (validated.priority || "MEDIUM").toUpperCase(),
        status: "TODO",
        organizationId: user.organizationId as string,
        assignedTechLeadIds: techLeadIds,
        pendingAcceptance: isTechLeadAssignment,
      },
    });

    if (created.assignedToId) {
      try {
        const assigner = await prisma.user.findUnique({
          where: { id: created.assignedById },
          select: { name: true },
        });
        await prisma.notification.create({
          data: {
            userId: created.assignedToId,
            organizationId: user.organizationId as string,
            type: "task_assigned",
            title: "New Task Assigned",
            message: `${assigner?.name || 'Tech Lead'} assigned you: ${created.title}`,
            isRed: false,
            relatedId: created.id,
          },
        });
      } catch (e) {
        console.error("Failed to create task_assigned notification:", e);
      }
    }

    return NextResponse.json(mapTask(created));
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
