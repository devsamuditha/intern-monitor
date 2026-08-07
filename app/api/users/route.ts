import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapUser } from "@/app/api/_lib/mappers";
import { logger } from "@/src/lib/logger";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { role, assigned_tech_lead_id } = Object.fromEntries(request.nextUrl.searchParams);
  const whereClause: any = scopeToOrganization({}, user);
  try {
    const prisma = getPrisma();
    if (role) {
      whereClause.role = String(role).toUpperCase();
    }
    if (assigned_tech_lead_id) {
      whereClause.techLeadId = String(assigned_tech_lead_id);
    }

    const dbUsers = await prisma.user.findMany({
      where: whereClause,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(dbUsers.map(mapUser));
  } catch (error: any) {
    logger.error({ err: error, route: "api/users", user: user?.id, whereClause }, "Failed to fetch users");
    return NextResponse.json({ error: "Internal Server Error", code: "internal_error" }, { status: 500 });
  }
}
