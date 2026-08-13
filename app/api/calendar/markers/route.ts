import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  try {
    const prisma = getPrisma();
    const whereClause: any = scopeToOrganization({ userId: user.id }, user);

    if (month && year) {
      const monthStr = String(month).padStart(2, "0");
      const yearStr = String(year);
      const prefix = `${yearStr}-${monthStr}`;
      whereClause.date = { startsWith: prefix };
    }

    const markers = await prisma.userCalendarMarker.findMany({
      where: whereClause,
      select: { id: true, userId: true, date: true, isAvailable: true, organizationId: true },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(markers.map(m => ({
      id: m.id,
      user_id: m.userId,
      date: m.date,
      is_available: m.isAvailable,
    })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const body = await request.json();
    const { date, isAvailable } = body;

    if (!date || typeof isAvailable !== "boolean") {
      return NextResponse.json({ error: "Missing required fields: date, isAvailable" }, { status: 400 });
    }

    const prisma = getPrisma();
    const marker = await prisma.userCalendarMarker.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: String(date),
        },
      },
      update: {
        isAvailable: Boolean(isAvailable),
      },
      create: {
        userId: user.id,
        date: String(date),
        isAvailable: Boolean(isAvailable),
        organizationId: user.organizationId ?? "",
      },
      select: { id: true, userId: true, date: true, isAvailable: true, organizationId: true },
    });

    return NextResponse.json({
      id: marker.id,
      user_id: marker.userId,
      date: marker.date,
      is_available: marker.isAvailable,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
