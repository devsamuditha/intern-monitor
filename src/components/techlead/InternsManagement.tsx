/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { User } from '../../types.ts';
import { 
  Users, UserPlus, Search, Edit3, UserX, UserCheck, RefreshCw, X, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { scaleIn, fadeInUp } from '../../utils/motion';

interface InternsManagementProps {
  currentUser: User;
}

export const InternsManagement: React.FC<InternsManagementProps> = ({ currentUser }) => {
  const [interns, setInterns] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal States
  const [editingIntern, setEditingIntern] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Create Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string; name: string } | null>(null);

  const loadInterns = async () => {
    setLoading(true);
    try {
      // Get users with role intern assigned to this tech lead
      const data = await api.getUsers({ role: 'intern', assigned_tech_lead_id: currentUser.id });
      setInterns(data);
    } catch (err) {
      console.error("Failed to load interns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterns();
  }, []);

  const handleOpenEdit = (intern: User) => {
    setEditingIntern(intern);
    setEditName(intern.name);
    setEditEmail(intern.email);
    setEditActive(intern.isActive);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntern) return;

    setSubmittingEdit(true);
    setEditError(null);

    try {
      // Update details
      await api.updateUser(editingIntern.id, {
        name: editName.trim(),
        email: editEmail.trim(),
      });

      // Update status if it changed
      if (editActive !== editingIntern.isActive) {
        await api.updateInternStatus(editingIntern.id, editActive);
      }

      setEditingIntern(null);
      await loadInterns();
    } catch (err: any) {
      console.error("Failed to update intern:", err);
      setEditError(err.message || "Failed to update intern details.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCreateIntern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      setCreateError("Name and email are required.");
      return;
    }

    setSubmittingCreate(true);
    setCreateError(null);

    try {
      const data = await api.registerUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: "intern",
        techLeadId: currentUser.id,
      });

      setCreatedCredentials({
        username: data.username,
        password: data.password,
        name: newName.trim()
      });
      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      await loadInterns();
    } catch (err: any) {
      console.error("Failed to create intern:", err);
      setCreateError(err.message || "Failed to register intern account.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleDeleteIntern = async (internId: string, internName: string) => {
    if (!confirm(`Are you sure you want to delete the intern "${internName}"? This will permanently remove their access and logs.`)) {
      return;
    }

    try {
      await api.deleteUser(internId);
      await loadInterns();
    } catch (err: any) {
      console.error("Failed to delete intern:", err);
      alert(err.message || "Failed to delete intern.");
    }
  };

  const filteredInterns = interns.filter(u => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/30 p-6 md:p-8 shadow-lg shadow-teal-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-600 text-white shadow-md font-bold">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Intern Roster & Management
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Register new interns under your supervision, edit profile details, deactivate accounts, or permanently delete them.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Intern
            </button>
            <button
              onClick={loadInterns}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition cursor-pointer"
              title="Refresh Interns Roster"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-4 shadow-lg shadow-teal-500/5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search interns by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-slate-950/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Roster */}
      <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg overflow-hidden">
        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-xs text-slate-400">Loading intern directory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-white/5">
                  <th className="p-4">Intern</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {filteredInterns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                      No interns assigned to you found.
                    </td>
                  </tr>
                ) : (
                  filteredInterns.map(intern => (
                    <tr key={intern.id} className="hover:bg-white/5 transition duration-150">
                      <td className="p-4 font-bold text-white flex items-center gap-3">
                        <img 
                          src={intern.avatar ?? '/favicon.ico'} 
                          alt="" 
                          className="h-8 w-8 rounded-full object-cover border border-white/10" 
                          referrerPolicy="no-referrer"
                        />
                        {intern.name}
                      </td>
                      <td className="p-4 font-mono text-[11px]">{intern.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          intern.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {intern.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(intern)}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-teal-300 hover:text-white font-semibold text-[11px] transition inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteIntern(intern.id, intern.name)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-[11px] transition inline-flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <UserX className="h-3 w-3" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingIntern && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-teal-400" /> Edit Intern Details
                </h3>
                <button onClick={() => setEditingIntern(null)} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 rounded-xl">
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-white/10 bg-slate-950/30 px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-white/10 bg-slate-950/30 px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-slate-950/20">
                  <div>
                    <label className="block text-xs font-bold text-white">Active Status</label>
                    <p className="text-[10px] text-slate-400">Intern can access the platform and submit daily logs.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-white/10 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingIntern(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    {submittingEdit ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-teal-400" /> Provision Intern Account
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {createError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 rounded-xl">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateIntern} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Liam Foster"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-white/10 bg-slate-950/30 px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. liam@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-white/10 bg-slate-950/30 px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCreate}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    {submittingCreate ? 'Provisioning...' : 'Create Intern'}
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
              className="bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-extrabold text-white">
                  Account Created for {createdCredentials.name}
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <code className="block text-xs font-mono bg-slate-950 border border-white/10 text-emerald-400 px-3.5 py-2 rounded-xl break-all">
                    {createdCredentials.username}
                  </code>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Temporary Password
                  </label>
                  <code className="block text-xs font-mono bg-slate-950 border border-white/10 text-emerald-400 px-3.5 py-2 rounded-xl break-all">
                    {createdCredentials.password}
                  </code>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-[10px] font-semibold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  Share credentials securely. Password must be updated on their first sign-in.
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-white/10">
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
