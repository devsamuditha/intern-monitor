import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapSystemSetting } from "@/app/api/_lib/mappers";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
    requireSuperAdmin(user);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const prisma = getPrisma();
    const settings = await prisma.systemSetting.findMany({
      include: { updater: true },
      orderBy: { key: "asc" },
    });
    return NextResponse.json(settings.map(mapSystemSetting));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  let user;
  try {
    user = await withAuth(request);
    requireSuperAdmin(user);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { key } = params;
  const { value } = await request.json();

  try {
    const prisma = getPrisma();
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    const oldValue = existing?.value;

    let coercedValue: string;
    if (key === "allow_new_registrations" || key === "ask_the_team_enabled") {
      if (typeof value !== "boolean" && value !== "true" && value !== "false") {
        return NextResponse.json({ error: `Setting "${key}" expects a boolean value` }, { status: 400 });
      }
      coercedValue = String(typeof value === "boolean" ? value : value === "true");
    } else if (key === "marking_scale") {
      if (value !== "1-5" && value !== "1-10") {
        return NextResponse.json({ error: 'marking_scale must be "1-5" or "1-10"' }, { status: 400 });
      }
      coercedValue = value;
    } else {
      if (typeof value !== "string") {
        return NextResponse.json({ error: "Setting value must be a string" }, { status: 400 });
      }
      coercedValue = value;
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: coercedValue,
        updatedBy: user.id,
      },
      create: {
        key,
        value: coercedValue,
        updatedBy: user.id,
      },
    });

    await logAudit(prisma, user.id, "SETTING_UPDATED", "SYSTEM_SETTING", key, { value: oldValue }, { value: coercedValue });

    return NextResponse.json(mapSystemSetting(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}