import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { z } from "zod";

const UpdateNotificationSettingsSchema = z.object({
  mutedTypes: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notificationSettings: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const settings = dbUser.notificationSettings
      ? (typeof dbUser.notificationSettings === 'string'
          ? JSON.parse(dbUser.notificationSettings)
          : dbUser.notificationSettings)
      : { mutedTypes: [] };

    return NextResponse.json({ mutedTypes: settings.mutedTypes || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = UpdateNotificationSettingsSchema.safeParse(body);
  if (!result.success) {
    const formattedErrors = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      .join(', ');
    return NextResponse.json({ error: `Validation Error: ${formattedErrors}` }, { status: 400 });
  }

  const { mutedTypes } = result.data;

  try {
    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { notificationSettings: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = dbUser.notificationSettings
      ? (typeof dbUser.notificationSettings === 'string'
          ? JSON.parse(dbUser.notificationSettings)
          : dbUser.notificationSettings)
      : { mutedTypes: [] };

    const merged = {
      mutedTypes: mutedTypes ?? existing.mutedTypes ?? [],
    };

    await prisma.user.update({
      where: { id: user.id },
      data: { notificationSettings: merged },
    });

    return NextResponse.json({ mutedTypes: merged.mutedTypes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
