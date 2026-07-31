import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapUser } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { ToggleUserStatusSchema } from "@/app/api/_lib/validation";
import { logAudit } from "@/app/api/_lib/mappers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    body = await validateBody(ToggleUserStatusSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { active } = body;

  try {
    const prisma = getPrisma();
    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !!active },
    });
    const action = updated.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED";
    await logAudit(prisma, user.id, action, "USER", updated.id, { active: oldUser.isActive }, { active: updated.isActive });
    return NextResponse.json(mapUser(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}