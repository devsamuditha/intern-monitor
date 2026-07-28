/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { api } from './services/api.js';
import { Login } from './pages/auth/Login.js';
import { DashboardShell } from './components/layout/DashboardShell.js';
import { InternDashboard } from './pages/intern/InternDashboard.js';
import { MyProjects } from './pages/intern/MyProjects.js';
import { AskTeamThread } from './components/intern/AskTeamThread.js';
import { TeamOverview } from './pages/techlead/TeamOverview.js';
import { ManagerOverview } from './pages/manager/ManagerOverview.js';
import { SuperAdminOverview } from './pages/superadmin/SuperAdminOverview.js';
import { SuperAdminUsers } from './pages/superadmin/SuperAdminUsers.js';
import { SuperAdminAudit } from './pages/superadmin/SuperAdminAudit.js';
import { SuperAdminModeration } from './pages/superadmin/SuperAdminModeration.js';
import { SuperAdminSettings } from './pages/superadmin/SuperAdminSettings.js';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [settings, setSettings] = useState<Record<string, any>>({});

  // Set default active tab based on user's role upon login
  useEffect(() => {
    if (user) {
      if (user.role === 'intern') {
        setActiveTab('dashboard');
      } else if (user.role === 'tech_lead') {
        setActiveTab('team_overview');
      } else if (user.role === 'manager') {
        setActiveTab('analytics');
      } else if (user.role === 'super_admin') {
        setActiveTab('overview');
      }
    }
  }, [user]);

  // Load platform settings for feature flags
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (e) {
        // If settings fetch fails, default to all features enabled
        setSettings({ ask_the_team_enabled: true, allow_new_registrations: true, marking_scale: '1-5' });
      }
    };
    fetchSettings();
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading InternTrack...</p>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!user) {
    return <Login />;
  }

  // Logged in -> Render shell with appropriate active tab panel
  return (
    <DashboardShell 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onRefresh={handleRefresh}
      settings={settings}
    >
      <div key={`${user.id}-${refreshKey}`}>
        {/* INTERN VIEWS */}
        {user.role === 'intern' && (
          <>
            {activeTab === 'dashboard' && <InternDashboard user={user} onRefreshStats={handleRefresh} />}
            {activeTab === 'projects' && <MyProjects currentUser={user} />}
            {activeTab === 'discussions' && <AskTeamThread currentUser={user} />}
          </>
        )}

        {/* TECH LEAD VIEWS */}
        {user.role === 'tech_lead' && (
          <>
            {activeTab === 'team_overview' && <TeamOverview currentUser={user} />}
            {activeTab === 'discussions' && <AskTeamThread currentUser={user} />}
          </>
        )}

        {/* MANAGER VIEWS */}
        {user.role === 'manager' && (
          <>
            {activeTab === 'analytics' && <ManagerOverview currentUser={user} />}
            {activeTab === 'all_projects' && <MyProjects currentUser={user} readOnly={true} />}
            {activeTab === 'discussions' && <AskTeamThread currentUser={user} />}
          </>
        )}

        {/* SUPERADMIN VIEWS */}
        {user.role === 'super_admin' && (
          <>
            {activeTab === 'overview' && <SuperAdminOverview currentUser={user} />}
            {activeTab === 'users' && <SuperAdminUsers currentUser={user} />}
            {activeTab === 'audit' && <SuperAdminAudit currentUser={user} />}
            {activeTab === 'moderation' && <SuperAdminModeration currentUser={user} />}
            {activeTab === 'settings' && <SuperAdminSettings currentUser={user} />}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
