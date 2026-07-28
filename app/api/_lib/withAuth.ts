import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/src/lib/supabase";
import { getPrisma } from "@/src/db/prisma";
import { Role } from "@prisma/client";

export async function withAuth(request: NextRequest) {
  let userId: string | null = null;

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    } catch (e) {
      console.warn("Supabase JWT verification failed:", e);
    }
  }

  if (!userId) {
    userId = request.headers.get("x-user-id") || request.nextUrl.searchParams.get("userId");
  }

  if (!userId) {
    throw new Error("Unauthorized: No user session found. Please log in.");
  }

  try {
    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({
      where: { id: String(userId) },
    });

    if (!dbUser) {
      throw new Error("Unauthorized: Active user not found in the database.");
    }

    if (!dbUser.isActive) {
      throw new Error("This account is inactive.");
    }

    return dbUser;
  } catch (error: any) {
    if (error.message.includes("is not defined")) {
      throw new Error(error.message);
    }
    if (error.message.includes("Unauthorized") || error.message.includes("inactive")) {
      throw error;
    }
    throw new Error("Database error: Please run migrations and seed the database.");
  }
}

export function requireSuperAdmin(user: any) {
  if (user.role !== Role.SUPER_ADMIN) {
    throw new Error("Forbidden: Super Admin access required");
  }
}
