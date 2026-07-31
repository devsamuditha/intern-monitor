/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { User, UserRole } from '../../types.ts';
import { scaleIn } from '../../utils/motion';
import { RefreshCw, Shield, UserPlus, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SuperAdminUsersProps {
  currentUser: User;
}

interface ConfirmAction {
  type: 'role' | 'status' | 'reassign';
  userId: string;
  payload: any;
}

export const SuperAdminUsers: React.FC<SuperAdminUsersProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [techLeads, setTechLeads] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [showCreateManager, setShowCreateManager] = useState(false);
  const [showCreateTechLead, setShowCreateTechLead] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadUsers = async () => {
    try {
      const [allUsers, leads] = await Promise.all([
        api.getUsers(),
        api.getUsers({ role: 'tech_lead' }),
      ]);
      setUsers(allUsers);
      setTechLeads(leads.filter(u => u.active !== false));
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setConfirmAction({ type: 'role', userId, payload: { role: newRole } });
  };

  const handleStatusToggle = async (userId: string, currentActive: boolean) => {
    setConfirmAction({ type: 'status', userId, payload: { active: !currentActive } });
  };

  const handleReassignTechLead = async (userId: string, newTechLeadId: string | null) => {
    setConfirmAction({ type: 'reassign', userId, payload: { techLeadId: newTechLeadId } });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      const { type, userId, payload } = confirmAction;
      if (type === 'role') {
        await api.updateUser(userId, { role: payload.role });
      } else if (type === 'status') {
        await api.toggleUserStatus(userId, payload.active);
      } else if (type === 'reassign') {
        await api.reassignTechLead(userId, payload.techLeadId);
      }
      await loadUsers();
    } catch (e) {
      console.error("Failed to execute action:", e);
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const handleCreateUser = async (role: UserRole, e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      setCreateError("Name and email are required.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await api.createUserBySuperAdmin({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: role,
        techLeadId: role === 'intern' ? undefined : undefined,
      });
      setNewName('');
      setNewEmail('');
      setShowCreateManager(false);
      setShowCreateTechLead(false);
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <motion.div {...scaleIn} className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading user registry...</p>
      </motion.div>
    );
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      intern: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      tech_lead: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
      manager: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
      super_admin: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    };
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${colors[role] || colors.intern}`}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  const getConfirmMessage = () => {
    if (!confirmAction) return '';
    const user = users.find(u => u.id === confirmAction.userId);
    if (!user) return '';
    switch (confirmAction.type) {
      case 'role':
        return `Change role for ${user.name} to ${confirmAction.payload.role.replace('_', ' ')}?`;
      case 'status':
        return confirmAction.payload.active
          ? `Reactivate account for ${user.name}?`
          : `Deactivate account for ${user.name}?`;
      case 'reassign':
        const lead = techLeads.find(l => l.id === confirmAction.payload.techLeadId);
        return `Reassign Tech Lead for ${user.name} to ${lead ? lead.name : 'Unassigned'}?`;
      default:
        return '';
    }
  };

  return (
    <motion.div {...scaleIn} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">User Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage roles and access across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateManager(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
          >
            <UserPlus className="h-4 w-4" />
            Create Manager
          </button>
          <button
            onClick={() => setShowCreateTechLead(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
          >
            <UserPlus className="h-4 w-4" />
            Create Tech Lead
          </button>
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tech Lead</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                      <span className="font-semibold text-slate-900 dark:text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role.replace('_', ' ')}
                      onChange={(e) => handleRoleChange(user.id, e.target.value.replace(' ', '_') as UserRole)}
                      disabled={updating === user.id || user.id === currentUser.id}
                      className="text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="intern">Intern</option>
                      <option value="tech_lead">Tech Lead</option>
                      <option value="manager">Manager</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleStatusToggle(user.id, user.active || false)}
                      disabled={updating === user.id || user.id === currentUser.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition disabled:opacity-50 ${
                        user.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-850 dark:text-slate-400'
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      {user.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'intern' ? (
                      <select
                        value={user.assigned_tech_lead_id || ''}
                        onChange={(e) => handleReassignTechLead(user.id, e.target.value || null)}
                        disabled={updating === user.id}
                        className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">Unassigned</option>
                        {techLeads.map((tl) => (
                          <option key={tl.id} value={tl.id}>{tl.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {updating === user.id && (
                      <div className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-teal-600"></div>
                        Saving...
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Manager Modal */}
      <AnimatePresence>
        {showCreateManager && (
          <CreateModal
            title="Create Manager"
            icon={<UserPlus className="h-5 w-5" />}
            role="manager"
            name={newName}
            email={newEmail}
            onNameChange={setNewName}
            onEmailChange={setNewEmail}
            error={createError}
            loading={creating}
            onClose={() => { setShowCreateManager(false); setCreateError(null); }}
            onSubmit={() => handleCreateUser('manager')}
          />
        )}
      </AnimatePresence>

      {/* Create Tech Lead Modal */}
      <AnimatePresence>
        {showCreateTechLead && (
          <CreateModal
            title="Create Tech Lead"
            icon={<UserPlus className="h-5 w-5" />}
            role="tech_lead"
            name={newName}
            email={newEmail}
            onNameChange={setNewName}
            onEmailChange={setNewEmail}
            error={createError}
            loading={creating}
            onClose={() => { setShowCreateTechLead(false); setCreateError(null); }}
            onSubmit={() => handleCreateUser('tech_lead')}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
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
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Confirm Action
                  </h3>
                </div>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{getConfirmMessage()}</p>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedAction}
                  disabled={confirmLoading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 inline-flex items-center gap-2"
                >
                  {confirmLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface CreateModalProps {
  title: string;
  icon: React.ReactNode;
  role: UserRole;
  name: string;
  email: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ title, icon, name, email, onNameChange, onEmailChange, error, loading, onClose, onSubmit }) => {
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
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              {icon}
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Jordan Smith"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
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
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};




export default SuperAdminUsers;

