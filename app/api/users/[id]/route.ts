import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapUser } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { UpdateUserSchema } from "@/app/api/_lib/validation";
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
    body = await validateBody(UpdateUserSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { name, role, assigned_tech_lead_id, active } = body;

  try {
    const prisma = getPrisma();
    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role.toUpperCase() as Role;
    if (assigned_tech_lead_id !== undefined) updateData.techLeadId = assigned_tech_lead_id || null;
    if (active !== undefined) updateData.isActive = !!active;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    const detailUpdates: any = {};
    if (name !== undefined) detailUpdates.name = { old: oldUser.name, new: updated.name };
    if (role !== undefined) detailUpdates.role = { old: oldUser.role, new: updated.role };
    if (assigned_tech_lead_id !== undefined) detailUpdates.techLeadId = { old: oldUser.techLeadId, new: updated.techLeadId };
    if (active !== undefined) detailUpdates.isActive = { old: oldUser.isActive, new: updated.isActive };
    const action = role !== undefined && oldUser.role !== updated.role ? "USER_ROLE_CHANGED" : (active !== undefined && oldUser.isActive !== updated.isActive ? (updated.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED") : "USER_UPDATED");
    await logAudit(prisma, user.id, action, "USER", updated.id, detailUpdates);
    return NextResponse.json(mapUser(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await withAuth(request);
    requireSuperAdmin(user);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { id } = await params;

  // Prevent deleting yourself
  if (id === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.delete({ where: { id } });
    await logAudit(prisma, user.id, "USER_DELETED", "USER", id, { name: userToDelete.name, email: userToDelete.email, role: userToDelete.role });
    
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}