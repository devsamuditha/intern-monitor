import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapDaySession } from "@/app/api/_lib/mappers";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  // Only Tech Leads or above can approve
  if (!["tech_lead", "TECH_LEAD", "manager", "MANAGER", "super_admin", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session_id } = body;

  if (!session_id) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  try {
    const prisma: any = getPrisma();

    const existing = await prisma.daySession.findFirst({
      where: scopeToOrganization({ id: session_id }, user),
    });

    if (!existing) {
      return NextResponse.json({ error: "Day session not found" }, { status: 404 });
    }

    const updated = await prisma.daySession.update({
      where: { id: existing.id },
      data: {
        earlyExitApproved: true,
      },
    });

    return NextResponse.json(mapDaySession(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
