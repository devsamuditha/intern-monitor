import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/src/db/prisma";
import { mapUser } from "@/app/api/_lib/mappers";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const leads = await prisma.user.findMany({
      where: { role: Role.TECH_LEAD, isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(leads.map(mapUser));
  } catch (error) {
    console.error("Public tech-leads endpoint error:", error);
    return NextResponse.json([]);
  }
}
