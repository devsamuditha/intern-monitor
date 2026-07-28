"use client";

import React from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (redirecting) return;
    if (user) {
      setRedirecting(true);
      router.push("/dashboard");
    } else {
      setRedirecting(true);
      router.push("/login");
    }
  }, [user, loading, router, redirecting]);

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading InternTrack...</p>
      </div>
    );
  }

  return null;
}
