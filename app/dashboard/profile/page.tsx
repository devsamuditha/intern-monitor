"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { ProfileImageModal } from "@/src/components/ui/ProfileImageModal";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";
import { useUpdateUser } from "@/src/hooks/queries/useQueries";
import { User as UserIcon, Mail, Shield, Edit, Lock, ExternalLink, Check, X } from "lucide-react";
import { ThemedIcon } from "@/src/components/ui/ThemedIcon";

export default function ProfilePage() {
  const { user, refreshCurrentUser } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("profile");

  if (!user) return null;

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name ?? "");
  const updateUserMutation = useUpdateUser();

  const handleNameSave = async () => {
    if (!nameInput.trim() || nameInput === user.name) {
      setEditingName(false);
      return;
    }
    try {
      await updateUserMutation.mutateAsync({ userId: user.id, updates: { name: nameInput.trim() } });
      await refreshCurrentUser();
    } catch (err: any) {
      alert(err.message || "Failed to update name");
    } finally {
      setEditingName(false);
    }
  };

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <ThemedIcon icon={UserIcon} color="teal" size={24} />
          <h2 className="text-lg font-black tracking-tight text-white">Profile</h2>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={user.avatar ?? '/favicon.ico'}
                alt={user.name ?? 'Avatar'}
                className="h-20 w-20 rounded-full object-cover border-4 border-white/20"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setShowProfileModal(true)}
                type="button"
                className="absolute -bottom-1 -right-1 p-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition"
                title="Update Profile Picture"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M14.5 2.5a2.5 2.5 0 0 1 3.5 3.5" /><path d="M12 12h7" /><path d="M7 12h.01" /><path d="M11 16h.01" /><path d="M7 16h.01" /><polyline points="11 4 11 12 7 12" /></svg>
              </button>
            </div>
            <div>
              <p className="text-xs text-white/50">Profile Picture</p>
              <p className="text-xs text-white/60">Click the camera icon to update</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-white/50 uppercase">Name</label>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 text-sm rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-400/30"
                />
                <button
                  onClick={handleNameSave}
                  disabled={updateUserMutation.isPending}
                  className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 transition"
                  title="Save"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameInput(user.name); }}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">{user.name}</span>
                <button
                  onClick={() => { setEditingName(true); setNameInput(user.name); }}
                  className="p-1 rounded-lg text-white/50 hover:text-teal-300 hover:bg-white/10 transition"
                  title="Edit Name"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-white/50 uppercase">Email</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-white">{user.email}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-white/50 uppercase">Role</label>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-white capitalize">{user.role}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 space-y-3">
            <button
              type="button"
              onClick={() => {
                if (confirm("Redirecting to change-password page. Continue?")) {
                  window.open("/change-password", "_blank", "noopener,noreferrer");
                }
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition text-left"
            >
              <span>Change Password</span>
              <Lock className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        <ProfileImageModal
          userId={user.id}
          currentAvatarUrl={user.avatar ?? '/favicon.ico'}
          onClose={() => setShowProfileModal(false)}
          onUploaded={(newUrl) => {
            user.avatar = newUrl;
            refreshCurrentUser();
            setShowProfileModal(false);
          }}
        />
      </div>
    </DashboardShell>
  );
}
