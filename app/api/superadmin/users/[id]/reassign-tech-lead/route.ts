import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapUser } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { ReassignTechLeadSchema } from "@/app/api/_lib/validation";
import { Role } from "@prisma/client";
import { logAudit } from "@/app/api/_lib/mappers";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    body = await validateBody(ReassignTechLeadSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { techLeadId } = body;

  try {
    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (targetUser.role !== Role.INTERN) {
      return NextResponse.json({ error: "Target user must be an Intern" }, { status: 400 });
    }
    if (techLeadId) {
      const lead = await prisma.user.findUnique({ where: { id: techLeadId } });
      if (!lead || lead.role !== Role.TECH_LEAD || !lead.isActive) {
        return NextResponse.json({ error: "Invalid or inactive Tech Lead" }, { status: 400 });
      }
    }
    const oldTechLeadId = targetUser.techLeadId;
    const updated = await prisma.user.update({
      where: { id },
      data: { techLeadId: techLeadId || null },
    });
    await logAudit(prisma, user.id, "USER_REASSIGNED", "USER", updated.id, { techLeadId: oldTechLeadId }, { techLeadId: updated.techLeadId });
    return NextResponse.json(mapUser(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}