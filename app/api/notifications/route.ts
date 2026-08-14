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

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread_only") === "true";

  try {
    const prisma = getPrisma();
    const where: any = scopeToOrganization({}, user);
    where.userId = user.id;
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: scopeToOrganization({ userId: user.id, isRead: false }, user),
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, type, title, message, isRed, relatedId } = body;

  if (!userId || !type || !title || !message) {
    return NextResponse.json({ error: "userId, type, title, and message are required" }, { status: 400 });
  }

  try {
    const prisma = getPrisma();

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (!user.organizationId && (user.role as string) !== "super_admin" && (user.role as string) !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Organization context required" }, { status: 403 });
    }

    if ((user.role as string) !== "super_admin" && (user.role as string) !== "SUPER_ADMIN") {
      if (targetUser.organizationId !== user.organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        organizationId: targetUser.organizationId || user.organizationId || "",
        type,
        title,
        message,
        isRed: Boolean(isRed),
        relatedId: relatedId || null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
