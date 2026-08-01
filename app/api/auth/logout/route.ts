import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getSessionCookieClearOptions } from "@/src/lib/jwt";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
  return response;
}
