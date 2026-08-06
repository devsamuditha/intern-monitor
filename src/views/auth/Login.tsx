/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { ArrowRight, User as UserIcon, Lock, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { NetworkBackground } from "@/src/components/ui/NetworkBackground";
import { Preloader } from "@/src/components/ui/Preloader";

/* ------------------------------------------------------------------ */
/*  Login page                                                        */
/* ------------------------------------------------------------------ */

export const Login: React.FC = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-cyan-950 to-emerald-950 flex flex-col md:flex-row relative overflow-hidden transition-colors duration-200">
      {/* Full-page network animation background */}
       <div className="fixed inset-0 pointer-events-none">
         <NetworkBackground opacity={0.4} nodeCount={220} />
       </div>

      <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -ml-[30px] -mb-[30px] pointer-events-none" />

      {/* Brand & Narrative Side */}
      <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between text-white relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="bg-white text-teal-600 p-2 rounded-xl shadow-lg">
            <img
              src="https://www.mobsolutions.lk/images/logo/mob-logo.png"
              alt="MOB Logo"
              height="120"
              width="120"
            />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">InternTrack</h1>
            <p className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">Learning Companion</p>
          </div>
        </div>

        <div className="my-12 md:my-auto max-w-md space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold"
          >
            MOB Developer Team
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight"
          >
            Manage. Monitor. Mentor.
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

        <div className="text-[11px] text-teal-200/80">
          Made with care for growing engineering teams. &copy; {new Date().getFullYear()} InternTrack
        </div>
      </div>

      {/* Login Form Side — transparent glass panel so the animation shows through */}
      <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative z-10">
        <div className="max-w-md w-full mx-auto space-y-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Access InternTrack</h3>
            <p className="text-xs text-teal-100/80 mt-1.5">
              Sign in with your issued username and password. Account creation is handled by your administrator.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/15 text-rose-200 text-xs font-medium rounded-xl border border-rose-400/30">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-teal-100 uppercase tracking-wide mb-1.5">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-teal-200/60" />
                <input
                  type="text"
                  placeholder="e.g. sam.chen"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-sm rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 py-2.5 text-white placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 transition-all duration-200"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-100 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-teal-200/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 py-2.5 text-white placeholder:text-[10px] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 transition-all duration-200"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-200/70 hover:text-white flex"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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

       <AnimatePresence>
         {loading && (
           <Preloader key="login-preloader" visible={loading} />
         )}
       </AnimatePresence>
     </div>
   );
 };

export default Login;
