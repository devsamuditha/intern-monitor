import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapContentFlag } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { UpdateContentFlagStatusSchema } from "@/app/api/_lib/validation";
import { hideContent } from "@/app/api/_lib/mappers";
import { logAudit } from "@/app/api/_lib/mappers";
import { buildContentPreview } from "@/app/api/_lib/mappers";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await withAuth(request);
    requireSuperAdmin(user);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(UpdateContentFlagStatusSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { action } = body;

  try {
    const prisma = getPrisma();
    const userObj = user;

    const flag = await prisma.contentFlag.update({
      where: { id },
      data: {
        status: action === "resolve" ? "resolved" : "dismissed",
        ...(action === "resolve" ? { resolvedAt: new Date() } : { dismissedAt: new Date() }),
      },
    });

    if (action === "resolve") {
      await hideContent(prisma, flag.contentType, flag.contentId, userObj.organizationId as string);
      await logAudit(prisma, userObj.id, "CONTENT_FLAG_RESOLVED", flag.contentType.toUpperCase(), flag.contentId, { isHidden: false }, { isHidden: true }, userObj.organizationId as string);
    } else {
      await logAudit(prisma, userObj.id, "CONTENT_FLAG_DISMISSED", flag.contentType.toUpperCase(), flag.contentId, undefined, undefined, userObj.organizationId as string);
    }

    const preview = await buildContentPreview(prisma, flag.contentType, flag.contentId, userObj.organizationId as string);
    return NextResponse.json({ ...mapContentFlag(flag), preview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}