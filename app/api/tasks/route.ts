import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapTask } from "@/app/api/_lib/mappers";
import { TaskStatus, TaskPriority } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { assigned_to, assigned_by } = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (assigned_to) {
      whereClause.assignedToId = String(assigned_to);
    }
    if (assigned_by) {
      whereClause.assignedById = String(assigned_by);
    }

    const dbTasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(dbTasks.map(mapTask));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
