/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Target, Sparkles, ArrowRight, User as UserIcon, Lock } from "lucide-react";
import { motion } from "motion/react";

export const Login: React.FC = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please provide both your username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const loggedInUser = await login(username.trim(), password.trim());
      if (loggedInUser?.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Incorrect username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-200">
      {/* Brand & Narrative Side */}
      <div className="md:w-1/2 bg-gradient-to-br from-teal-600 via-cyan-700 to-emerald-800 p-8 md:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -ml-[30px] -mb-[30px] pointer-events-none" />

        <div className="flex items-center gap-2.5 z-10">
          <div className="bg-white text-teal-600 p-2 rounded-xl shadow-lg">
            <Target className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">InternTrack</h1>
            <p className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">Learning Companion</p>
          </div>
        </div>

        <div className="my-12 md:my-auto max-w-md z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold"
          >
            <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" /> Encouraging Daily Learning
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight"
          >
            Not another boring corporate tracker.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-teal-100 leading-relaxed"
          >
            A warm, encouraging daily journal designed for tech interns, leads, and managers. Track streaks, capture achievements, review codes gracefully, and learn from mistakes together.
          </motion.p>
        </div>

        <div className="text-[11px] text-teal-200/80 z-10">
          Made with care for growing engineering teams. &copy; {new Date().getFullYear()} InternTrack
        </div>
      </div>

      {/* Login Form Side */}
      <div className="md:w-1/2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 p-8 md:p-12 lg:p-16 flex flex-col justify-center transition-colors duration-200">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Access InternTrack</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Sign in with your issued username and password. Account creation is handled by your administrator.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-xl border border-rose-100 dark:border-rose-900/40">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. sam.chen"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
