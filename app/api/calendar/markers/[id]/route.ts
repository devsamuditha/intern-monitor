import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const existing = await prisma.userCalendarMarker.findFirst({
      where: { id, userId: user.id, ...scopeToOrganization({}, user) },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Calendar marker not found" }, { status: 404 });
    }

    await prisma.userCalendarMarker.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
