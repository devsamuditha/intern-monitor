/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Target, Sparkles, ArrowRight, User as UserIcon, Mail, Lock, Landmark, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  // Modes: 'login' | 'register_intern' | 'register_tech_lead'
  const [activeMode, setActiveMode] = useState<'login' | 'register_intern' | 'register_tech_lead'>('login');

  // Settings
  const [allowNewRegistrations, setAllowNewRegistrations] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  // Shared Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedTechLeadId, setSelectedTechLeadId] = useState('');

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdowns
  const [techLeads, setTechLeads] = useState<any[]>([]);

  const { login, signUp } = useAuth();

  // Load public tech leads dynamically when we toggle modes, to populate the Intern registration dropdown
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await api.getPublicTechLeads();
        setTechLeads(data);
      } catch (err) {
        console.warn("Could not fetch active tech leads:", err);
      }
    };
    fetchLeads();
  }, [activeMode]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setAllowNewRegistrations(data.allow_new_registrations !== false);
      } catch (e) {
        // If settings fetch fails, default to allowing registrations
        setAllowNewRegistrations(true);
      } finally {
        setSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await login(email.trim(), password);
      setSuccess('Redirecting to your dashboard...');
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid corporate email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signUp({
        email: email.trim(),
        password,
        name: fullName.trim(),
        role: 'intern',
        techLeadId: selectedTechLeadId || null
      });
      setSuccess('Student account created! Logging in...');
    } catch (err: any) {
      setError(err.message || 'Registration failed. This email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTechLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid corporate email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await signUp({
        email: email.trim(),
        password,
        name: fullName.trim(),
        role: 'tech_lead'
      });
      setSuccess('Tech Lead account created! Logging in...');
    } catch (err: any) {
      setError(err.message || 'Registration failed. This email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const resetFormState = (mode: 'login' | 'register_intern' | 'register_tech_lead') => {
    setActiveMode(mode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setSelectedTechLeadId('');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Brand & Narrative Side - Warm encouraging atmosphere */}
      <div className="md:w-1/2 bg-gradient-to-br from-teal-600 via-cyan-700 to-emerald-800 p-8 md:p-12 lg:p-16 flex flex-col justify-between text-white relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -ml-[30px] -mb-[30px] pointer-events-none" />
 
        {/* Logo */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="bg-white text-teal-600 p-2 rounded-xl shadow-lg">
            <Target className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">InternTrack</h1>
            <p className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">Learning Companion</p>
          </div>
        </div>

        {/* Motivation Card */}
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

          {/* Social Proof */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10"
          >
            <div>
              <p className="text-xl font-extrabold text-white">5-Day 🔥</p>
              <p className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">Average Streak</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-white">100%</p>
              <p className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">Transparency</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-white">0% 📄</p>
              <p className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">Paperwork noise</p>
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-teal-200/80 z-10">
          Made with care for growing engineering teams. &copy; {new Date().getFullYear()} InternTrack
        </div>
      </div>

      {/* Forms & Quick Login Side */}
      <div className="md:w-1/2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 p-8 md:p-12 lg:p-16 flex flex-col justify-center transition-colors duration-200">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Access InternTrack</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Choose your operation mode below to connect with your sprint telemetry workspace.
            </p>
          </div>

          {/* Landing / Auth tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => resetFormState('login')}
              className={`flex-1 pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition ${
                activeMode === 'login'
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              Log In
            </button>
            {!allowNewRegistrations ? (
              <button
                disabled
                className="flex-1 pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed"
              >
                Student Sign Up
              </button>
            ) : (
              <button
                onClick={() => resetFormState('register_intern')}
                className={`flex-1 pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition ${
                  activeMode === 'register_intern'
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Student Sign Up
              </button>
            )}
            {!allowNewRegistrations ? (
              <button
                disabled
                className="flex-1 pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed"
              >
                Lead Sign Up
              </button>
            ) : (
              <button
                onClick={() => resetFormState('register_tech_lead')}
                className={`flex-1 pb-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition ${
                  activeMode === 'register_tech_lead'
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                Lead Sign Up
              </button>
            )}
          </div>

          {/* Registration closed banner */}
          {!allowNewRegistrations && activeMode !== 'login' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Registration is currently closed. Please check back later or contact an administrator.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-xl border border-rose-100 dark:border-rose-900/40">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              {success}
            </div>
          )}

          {/* Forms switcher */}
          <AnimatePresence mode="wait">
            {activeMode === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleLogin} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g. sam@intern.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      disabled={loading}
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
                  {loading ? 'Authenticating...' : 'Log In to Dashboard'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.form>
            )}

            {activeMode === 'register_intern' && (
              <motion.form 
                key="register_intern"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleRegisterIntern} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Sam Chen"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Corporate Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g. sam_new@intern.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="At least 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Assign to Tech Lead (Optional)
                  </label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedTechLeadId}
                      onChange={(e) => setSelectedTechLeadId(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-10 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none transition-all duration-200 cursor-pointer"
                      disabled={loading}
                    >
                      <option value="">No Lead Assigned (Self-guided)</option>
                      {techLeads.map((tl) => (
                        <option key={tl.id} value={tl.id}>{tl.name} ({tl.email})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] transition text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Creating Student profile...' : 'Register and Launch'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.form>
            )}

            {activeMode === 'register_tech_lead' && (
              <motion.form 
                key="register_tech_lead"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleRegisterTechLead} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                    Corporate Lead Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="e.g. alex_new@techlead.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="At least 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] transition text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Creating Engineering Lead profile...' : 'Register and Launch'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

