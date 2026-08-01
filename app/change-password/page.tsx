"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/services/api";
import { Target, Lock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, refreshCurrentUser } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mustChange = user?.mustChangePassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!mustChange && !currentPassword) {
      setError("Current password is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.changePassword({
        currentPassword: mustChange ? undefined : currentPassword,
        newPassword,
      });
      await refreshCurrentUser();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 justify-center">
            <div className="bg-teal-600 text-white p-2 rounded-xl shadow-lg">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {mustChange ? "Set Up Your Password" : "Change Password"}
            </h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            {mustChange
              ? "You must set a new password before continuing."
              : "Update your password below."}
          </p>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-xl border border-rose-100 dark:border-rose-900/40">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!mustChange && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] transition text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Password"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
