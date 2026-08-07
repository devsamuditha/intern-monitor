/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { User } from '../../types.ts';
import { scaleIn } from '../../utils/motion';
import { RefreshCw, Building2, Plus, X, CheckCircle2, AlertTriangle, Trash2, Users, Crown } from 'lucide-react';

interface SuperAdminOrganizationsProps {
  currentUser: User;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count?: {
    users: number;
  };
}

export const SuperAdminOrganizations: React.FC<SuperAdminOrganizationsProps> = ({ currentUser }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateManager, setShowCreateManager] = useState<string | null>(null); // holds org ID

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  
  const [newManagerName, setNewManagerName] = useState("");
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [newManagerUsername, setNewManagerUsername] = useState("");
  const [newManagerPassword, setNewManagerPassword] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string; name: string } | null>(null);

  const loadOrganizations = async () => {
    try {
      const data = await api.getOrganizations();
      setOrganizations(data);
    } catch (e) {
      console.error("Failed to load organizations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleCreateOrganization = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      setCreateError("Name and slug are required.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await api.createOrganization({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase(),
      });
      setShowCreateOrg(false);
      setNewName("");
      setNewSlug("");
      await loadOrganizations();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create organization.");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateManager = async (orgId: string) => {
    if (!newManagerName.trim() || !newManagerEmail.trim() || !newManagerUsername.trim() || !newManagerPassword.trim()) {
      setCreateError("All fields are required.");
      return;
    }
    if (newManagerPassword.length < 8) {
      setCreateError("Password must be at least 8 characters.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await api.createUserBySuperAdmin({
        name: newManagerName.trim(),
        email: newManagerEmail.trim().toLowerCase(),
        username: newManagerUsername.trim().toLowerCase(),
        password: newManagerPassword.trim(),
        role: 'manager',
        organizationId: orgId,
      });
      setCreatedCredentials({
        name: res.user.name,
        username: res.username,
        password: res.password,
      });
      setShowCreateManager(null);
      setNewManagerName("");
      setNewManagerEmail("");
      setNewManagerUsername("");
      setNewManagerPassword("");
      await loadOrganizations();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create manager.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <motion.div {...scaleIn} className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading organizations...</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...scaleIn} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Organizations</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage tenants and their administrative access</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateOrg(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
          >
            <Plus className="h-4 w-4" />
            Create Organization
          </button>
          <button
            onClick={loadOrganizations}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organization Name</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tenant Slug</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Users</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-white">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                    {org.slug}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-teal-50 text-teal-700 border-teal-200/50 dark:bg-teal-950/40 dark:text-teal-300">
                      <Users className="h-3 w-3" />
                      {org._count?.users || 0} Users
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setShowCreateManager(org.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 rounded-lg text-[10px] font-bold transition"
                    >
                      <Crown className="h-3 w-3" />
                      New Manager
                    </button>
                  </td>
                </tr>
              ))}
              {organizations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No organizations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Organization Modal */}
      <AnimatePresence>
        {showCreateOrg && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Create Organization
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateOrg(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {createError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 rounded-xl">
                  {createError}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleCreateOrganization(); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corporation"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newSlug) {
                        setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                      }
                    }}
                    required
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tenant Slug *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. acme-corp"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    required
                    pattern="^[a-z0-9-]+$"
                    className="w-full font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Unique identifier, used for internal routing.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateOrg(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Manager Modal */}
      <AnimatePresence>
        {showCreateManager && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <Crown className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Create Manager
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateManager(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                This manager will have full administrative control over the selected organization.
              </div>

              {createError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 rounded-xl">
                  {createError}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleCreateManager(showCreateManager); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jordan Smith"
                    value={newManagerName}
                    onChange={(e) => setNewManagerName(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. jordan@company.com"
                    value={newManagerEmail}
                    onChange={(e) => setNewManagerEmail(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. jordan.smith"
                    value={newManagerUsername}
                    onChange={(e) => setNewManagerUsername(e.target.value)}
                    required
                    minLength={3}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    placeholder="Min 8 characters"
                    value={newManagerPassword}
                    onChange={(e) => setNewManagerPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateManager(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/20"
                  >
                    {creating ? 'Creating...' : 'Create Manager'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generated Credentials Modal */}
      <AnimatePresence>
        {createdCredentials && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Manager Credentials
                </h3>
              </div>
      
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl break-all">
                      {createdCredentials.username}
                    </code>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Temporary Password
                  </label>
                  <code className="block text-sm font-mono bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl break-all">
                    {createdCredentials.password}
                  </code>
                </div>
              </div>
      
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  Share these credentials securely. The user must change this password on first login.
                </p>
              </div>
      
              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
