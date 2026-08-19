/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { User, UserRole } from '../../types.ts';
import { 
  Users, UserPlus, Shield, ShieldAlert, ShieldCheck, Search, Filter, 
  Edit3, UserX, UserCheck, RefreshCw, X, Check, CheckCircle2, AlertTriangle, Sparkles
} from 'lucide-react';
import { scaleIn } from '../../utils/motion';

interface UserManagementProps {
  currentUser: User;
  onRefresh?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, onRefresh }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [techLeads, setTechLeads] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Modal states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('intern');
  const [editTechLeadId, setEditTechLeadId] = useState<string>('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Create User Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("intern");
  const [newTechLeadId, setNewTechLeadId] = useState<string>("");
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string; name: string } | null>(null);

  const loadUsersData = async () => {
    setLoading(true);
    try {
      const allUsers = await api.getUsers();
      setUsers(allUsers);
      setTechLeads(allUsers.filter(u => u.role === 'tech_lead'));
    } catch (err) {
      console.error("Failed to load users for management:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  // Filter users
  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchRole = u.role.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRole) return false;
    }

    return true;
  });

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditTechLeadId(user.assigned_tech_lead_id || '');
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmittingEdit(true);
    setEditError(null);

    try {
      await api.updateUser(editingUser.id, {
        name: editName.trim(),
        role: editRole,
        assigned_tech_lead_id: editRole === 'intern' ? (editTechLeadId || undefined) : undefined,
      });

      setEditingUser(null);
      await loadUsersData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Failed to update user:", err);
      setEditError(err.message || "Failed to update user details.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
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
        role: newRole,
        techLeadId: newRole === "intern" ? (newTechLeadId || null) : null,
      });
      setCreatedCredentials({ username: data.username, password: data.password, name: newName.trim() });
      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      setNewRole("intern");
      setNewTechLeadId("");
      await loadUsersData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Failed to create user:", err);
      setCreateError(err.message || "Failed to create user account.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Stats
  const totalCount = users.length;
  const internCount = users.filter(u => u.role === 'intern').length;
  const techLeadCount = users.filter(u => u.role === 'tech_lead').length;
  const managerCount = users.filter(u => u.role === 'manager').length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        <p className="text-xs text-slate-500">Loading user & role directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-6 shadow-lg shadow-teal-500/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                SuperAdmin User & Access Control Center
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage company accounts, promote or reassign roles across software engineering teams, and activate or deactivate user credentials.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Provision New User
            </button>
            <button
              onClick={loadUsersData}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              title="Refresh User Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* User Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div 
            onClick={() => { setRoleFilter('all'); }}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              roleFilter === 'all'
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 ring-2 ring-teal-400/20'
                : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Users</span>
            <p className="text-lg font-black text-slate-900 dark:text-white">{totalCount}</p>
          </div>

          <div 
            onClick={() => { setRoleFilter('intern'); }}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              roleFilter === 'intern'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-400/20'
                : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Interns</span>
            <p className="text-lg font-black text-blue-900 dark:text-blue-200">{internCount}</p>
          </div>

          <div 
            onClick={() => { setRoleFilter('tech_lead'); }}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              roleFilter === 'tech_lead'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-2 ring-purple-400/20'
                : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">Tech Leads</span>
            <p className="text-lg font-black text-purple-900 dark:text-purple-200">{techLeadCount}</p>
          </div>

          <div 
            onClick={() => { setRoleFilter('manager'); }}
            className={`p-3 rounded-xl border cursor-pointer transition ${
              roleFilter === 'manager'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-400/20'
                : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Managers</span>
            <p className="text-lg font-black text-amber-900 dark:text-amber-200">{managerCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-4 shadow-lg shadow-teal-500/5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="all">👥 All Roles</option>
              <option value="intern">💻 Software Interns</option>
              <option value="tech_lead">⚡ Tech Leads & Mentors</option>
              <option value="manager">👑 Managers & Admins</option>
            </select>
          </div>

        </div>
      </div>

      {/* Users Roster Table */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 dark:border-slate-700/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/30 dark:border-slate-700/30 text-[10px] uppercase font-bold text-slate-400 tracking-wider bg-white/50 dark:bg-slate-950/50">
                <th className="p-4">User Identity</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Reporting Mentor</th>
                <th className="p-4 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30 dark:divide-slate-700/30 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No users found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                  filteredUsers.map(u => {
                  const assignedLead = techLeads.find(tl => tl.id === u.assigned_tech_lead_id);

                  return (
                    <tr 
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-950/60 transition"
                    >
                      {/* Name & Avatar */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={u.avatar} 
                            alt={u.name} 
                            className="h-9 w-9 rounded-full object-cover border" 
                            referrerPolicy="no-referrer" 
                          />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {u.name}
                              {u.id === currentUser.id && (
                                <span className="px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-950 text-[9px] text-teal-700 dark:text-teal-300 font-bold">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                          u.role === 'manager'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/60'
                            : u.role === 'tech_lead'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300/60'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/60'
                        }`}>
                          <Shield className="h-3 w-3" />
                          {u.role === 'tech_lead' ? 'Tech Lead' : u.role}
                        </span>
                      </td>

                      {/* Reporting Tech Lead */}
                      <td className="p-4">
                        {u.role === 'intern' ? (
                          assignedLead ? (
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {assignedLead.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Action Controls */}
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit Role / Lead
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role & Access Modal */}
      <AnimatePresence>
        {editingUser && (
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
                    <Shield className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Edit User Role & Permissions
                  </h3>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 rounded-xl">
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                     className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Assign Role *
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="intern">💻 Intern (Submits daily logs & tasks)</option>
                    <option value="tech_lead">⚡ Tech Lead (Reviews code & assigns tasks)</option>
                    <option value="manager">👑 Manager / SuperAdmin (Org oversight & user admin)</option>
                  </select>
                </div>

                {editRole === 'intern' && (
                  <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Assigned Tech Lead / Mentor
                      </label>
                      <select
                        value={editTechLeadId}
                        onChange={(e) => setEditTechLeadId(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      >
                      <option value="">Unassigned</option>
                      {techLeads.map(tl => (
                        <option key={tl.id} value={tl.id}>{tl.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20"
                  >
                    {submittingEdit ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Provision New User Modal */}
      <AnimatePresence>
        {showCreateModal && (
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
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Provision New Corporate User
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
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

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. David Vance"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
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
                    placeholder="e.g. david@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Role Assignment *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="intern">💻 Software Intern</option>
                    <option value="tech_lead">⚡ Tech Lead / Mentor</option>
                    <option value="manager">👑 Manager / SuperAdmin</option>
                  </select>
                </div>

                {newRole === 'intern' && (
                  <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Assign Tech Lead / Mentor
                      </label>
                      <select
                        value={newTechLeadId}
                        onChange={(e) => setNewTechLeadId(e.target.value)}
                         className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                       >
                      <option value="">Unassigned</option>
                      {techLeads.map(tl => (
                        <option key={tl.id} value={tl.id}>{tl.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCreate}
                     className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20"
                  >
                    {submittingCreate ? 'Provisioning...' : 'Provision User Account'}
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
          <CredentialsModal
            name={createdCredentials.name}
            username={createdCredentials.username}
            password={createdCredentials.password}
            onClose={() => setCreatedCredentials(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface CredentialsModalProps {
  name: string;
  username: string;
  password: string;
  onClose: () => void;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({ name, username, password, onClose }) => {
  return (
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
            Credentials for {name}
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Username
            </label>
            <code className="block text-sm font-mono bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl break-all">
              {username}
            </code>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Temporary Password
            </label>
            <code className="block text-sm font-mono bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl break-all">
              {password}
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
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </div>
  );
};



