import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapMistake } from "@/app/api/_lib/mappers";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { intern_id, resolved } = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const prisma = getPrisma();
    const whereClause: any = scopeToOrganization({}, user);
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }
    if (resolved !== undefined) {
      whereClause.resolved = resolved === "true";
    }

    const dbMistakes = await prisma.mistake.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(dbMistakes.map(mapMistake));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
