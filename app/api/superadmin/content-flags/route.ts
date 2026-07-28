import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapContentFlag } from "@/app/api/_lib/mappers";
import { buildContentPreview } from "@/app/api/_lib/mappers";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
    requireSuperAdmin(user);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { status, contentType, limit, offset } = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const prisma = getPrisma();
    const where: any = {};
    if (status && typeof status === "string") where.status = status;
    if (contentType && typeof contentType === "string") where.contentType = contentType.toLowerCase();

    const parsedLimit = Math.min(Number(limit) || 50, 200);
    const parsedOffset = Number(offset) || 0;

    const [flags, total] = await Promise.all([
      prisma.contentFlag.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { user: true },
        take: parsedLimit,
        skip: parsedOffset,
      }),
      prisma.contentFlag.count({ where }),
    ]);

    const flagsWithPreview = await Promise.all(
      flags.map(async (flag) => {
        const preview = await buildContentPreview(prisma, flag.contentType, flag.contentId);
        return { ...mapContentFlag(flag), preview };
      })
    );

    return NextResponse.json({ flags: flagsWithPreview, total, limit: parsedLimit, offset: parsedOffset });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
