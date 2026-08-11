import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthError } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapUser, logAudit } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { ToggleUserStatusSchema } from "@/app/api/_lib/validation";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(ToggleUserStatusSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { active } = body;
  const newIsActive = !!active;

  try {
    const prisma = getPrisma();

    const intern = await prisma.user.findUnique({
      where: { id, ...scopeToOrganization({}, user) },
      select: { id: true, name: true, role: true, isActive: true, techLeadId: true, organizationId: true, email: true },
    });

    if (!intern) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    if (intern.role !== "INTERN") {
      return NextResponse.json({ error: "Target user is not an intern" }, { status: 400 });
    }

    const isSelf = user.id === intern.id;
    const isTechLead = user.role === "TECH_LEAD" && intern.techLeadId === user.id;
    const isManager = user.role === "MANAGER";
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    if (!isSelf && !isTechLead && !isManager && !isSuperAdmin) {
      throw new AuthError("Forbidden: You do not have permission to update this intern's status.", 403);
    }

    if (isSelf && newIsActive) {
      return NextResponse.json({ error: "Interns cannot self-activate. Please contact your tech lead." }, { status: 403 });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: newIsActive },
    });

    const action = newIsActive ? "INTERN_ACTIVATED" : "INTERN_DEACTIVATED";
    await logAudit(prisma, user.id, action, "USER", intern.id, { isActive: intern.isActive }, { isActive: newIsActive }, intern.organizationId || undefined);

    const updated = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, isActive: true } });
    return NextResponse.json(mapUser(updated));
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
