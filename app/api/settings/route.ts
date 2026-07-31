import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {

  try {
    const prisma = getPrisma();
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });
    const result: Record<string, any> = {};
    for (const s of settings) {
      let parsed: any = s.value;
      if (s.value === "true") parsed = true;
      else if (s.value === "false") parsed = false;
      else if (!isNaN(Number(s.value)) && s.value.trim() !== "") parsed = Number(s.value);
      result[s.key] = parsed;
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
