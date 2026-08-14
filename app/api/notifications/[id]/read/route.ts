import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { id } = await params;

  try {
    const prisma = getPrisma();
    const existing = await prisma.notification.findFirst({
      where: { id, ...scopeToOrganization({}, user) },
    });

    if (!existing) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (existing.userId !== user.id && (user.role as string) !== "super_admin" && (user.role as string) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
