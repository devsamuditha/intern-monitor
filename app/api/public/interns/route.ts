import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/src/db/prisma";
import { mapUser, SAFE_USER_SELECT } from "@/app/api/_lib/mappers";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrisma();
    const interns = await prisma.user.findMany({
      where: { role: Role.INTERN, isActive: true },
      select: SAFE_USER_SELECT,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(interns.map(mapUser));
  } catch (error) {
    console.error("Public interns endpoint error:", error);
    return NextResponse.json([]);
  }
}
