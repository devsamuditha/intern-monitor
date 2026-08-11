import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthError } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { getSupabaseAdmin } from "@/src/lib/supabase";
import { logAudit } from "@/app/api/_lib/mappers";

const BUCKET_NAME = "profile-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message.includes("Forbidden") ? 403 : 401 });
  }

  const { id } = await params;

  // Permission: user can upload their own avatar, or tech_lead/manager/super_admin can upload for others
  const isSelf = user.id === id;
  const isTechLead = user.role === "TECH_LEAD";
  const isManager = user.role === "MANAGER";
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  if (!isSelf && !isTechLead && !isManager && !isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: You do not have permission to upload this avatar." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type. Use PNG, JPG, WebP, or GIF." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 5 MB." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const prisma = getPrisma();

    // Ensure the bucket exists (lazy creation)
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some((b: any) => b.name === BUCKET_NAME);
      if (!exists) {
        await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ACCEPTED_TYPES,
          fileSizeLimit: MAX_FILE_SIZE,
        });
      }
    } catch {
      // Bucket might already exist from a race; proceed with upload
    }

    const arrayBuffer = await file.arrayBuffer();
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1] || "png";
    const fileName = `${id}/${Date.now()}.${extension}`;

    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message || "Upload failed" }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
    const avatarUrl = publicUrlData?.publicUrl;

    await prisma.user.update({
      where: { id },
      data: { avatarUrl },
    });

    await logAudit(prisma, user.id, "AVATAR_UPDATED", "USER", id, undefined, { avatarUrl });

    return NextResponse.json({ avatarUrl }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
