import { NextRequest, NextResponse } from "next/server";
import { withAuth, requireSuperAdmin } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { z } from "zod";
import { validateBody } from "@/app/api/_lib/validation";

const CreateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireSuperAdmin(user);

    const prisma = getPrisma();
    
    // Get all organizations along with user counts
    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(orgs);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireSuperAdmin(user);

    const body = await validateBody(CreateOrganizationSchema)(request);
    const prisma = getPrisma();

    // Check if slug exists
    const existing = await prisma.organization.findUnique({
      where: { slug: body.slug }
    });

    if (existing) {
      return NextResponse.json({ error: "An organization with this slug already exists." }, { status: 400 });
    }

    const org = await prisma.organization.create({
      data: {
        name: body.name,
        slug: body.slug,
      }
    });

    return NextResponse.json(org, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: err.status || 500 }
    );
  }
}
