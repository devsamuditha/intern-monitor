import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapProject } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { ProjectSchema } from "@/app/api/_lib/validation";

export async function GET(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const prisma = getPrisma();
    const dbProjects = await prisma.project.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(dbProjects.map(mapProject));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(ProjectSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id, name, description, github_url, tech_stack, owner_id, screenshots } = body;

  try {
    const prisma = getPrisma();
    if (id) {
      const updated = await prisma.project.update({
        where: { id },
        data: {
          name,
          description,
          githubUrl: github_url,
          techStack: tech_stack || [],
          screenshots: screenshots || [],
        },
      });
      return NextResponse.json(mapProject(updated));
    }

    const created = await prisma.project.create({
      data: {
        name,
        description,
        githubUrl: github_url,
        techStack: tech_stack || [],
        ownerId: owner_id as any,
        screenshots: screenshots || ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"],
      } as any,
    });
    return NextResponse.json(mapProject(created));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
