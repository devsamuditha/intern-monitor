import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { z } from "zod";
import { validateBody } from "@/app/api/_lib/validation";

const UpdateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    requireSuperAdmin(user);

    const { id } = await params;
    const body = await validateBody(UpdateOrganizationSchema)(request);
    const prisma = getPrisma();

    if (body.slug) {
      const existing = await prisma.organization.findUnique({
        where: { slug: body.slug }
      });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "An organization with this slug already exists." }, { status: 400 });
      }
    }

    const org = await prisma.organization.update({
      where: { id: id },
      data: body,
    });

    return NextResponse.json(org);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    requireSuperAdmin(user);

    const { id } = await params;
    const prisma = getPrisma();

    // Check if it's the legacy organization (default ID usually created via seed)
    // We shouldn't hardcode IDs, but we should prevent deleting orgs with active users
    const orgUsersCount = await prisma.user.count({
      where: { organizationId: id }
    });

    if (orgUsersCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete an organization that has users. Please remove or migrate users first." },
        { status: 400 }
      );
    }

    await prisma.organization.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}
