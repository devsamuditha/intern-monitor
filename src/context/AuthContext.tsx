/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
 
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  signUp: (signUpData: {
    email: string;
    password?: string;
    name: string;
    role: string;
    techLeadId?: string | null;
  }) => Promise<User>;
  logout: () => void;
  switchUser: (targetUser: User) => void;
  allDemoUsers: User[];
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded reference of demo accounts to display on the login screen
const DEMO_ACCOUNTS: User[] = [
  { id: "int-sam", name: "Sam Chen", email: "sam@intern.com", role: "intern", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", assigned_tech_lead_id: "tl-alex", active: true },
  { id: "int-liam", name: "Liam O'Connor", email: "liam@intern.com", role: "intern", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", assigned_tech_lead_id: "tl-alex", active: true },
  { id: "int-sophia", name: "Sophia Martinez", email: "sophia@intern.com", role: "intern", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", assigned_tech_lead_id: "tl-alex", active: true },
  { id: "int-maya", name: "Maya Lin", email: "maya@intern.com", role: "intern", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", assigned_tech_lead_id: "tl-jordan", active: true },
  { id: "int-ethan", name: "Ethan Hunt", email: "ethan@intern.com", role: "intern", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", assigned_tech_lead_id: "tl-jordan", active: true },
  { id: "int-zoe", name: "Zoe Taylor", email: "zoe@intern.com", role: "intern", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", assigned_tech_lead_id: "tl-jordan", active: true },
  { id: "tl-alex", name: "Alex Rivera", email: "alex@techlead.com", role: "tech_lead", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: "tl-jordan", name: "Jordan Vance", email: "jordan@techlead.com", role: "tech_lead", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: "m-elena", name: "Elena Rostova", email: "elena@manager.com", role: "manager", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
  { id: "sa-root", name: "Super Admin", email: "superadmin@company.com", role: "super_admin", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" },
];

const DEMO_EMAILS = new Set([
  'sam@intern.com', 'liam@intern.com', 'sophia@intern.com',
  'maya@intern.com', 'ethan@intern.com', 'zoe@intern.com',
  'alex@techlead.com', 'jordan@techlead.com',
  'elena@manager.com', 'superadmin@company.com',
]);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const checkAuth = async () => {
      try {
        const { getSupabaseClient } = await import('../lib/supabaseClient');
        const supabase = await getSupabaseClient();
        
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const users = await api.getUsers();
          const dbUser = users.find(u => u.email.toLowerCase() === session.user.email?.toLowerCase());
          if (dbUser) {
            setUser(dbUser);
            localStorage.setItem('user', JSON.stringify(dbUser));
          }
        } else {
          // Fallback to demo switcher localStorage
          const savedUserStr = localStorage.getItem('user');
          if (savedUserStr) {
            const savedUser = JSON.parse(savedUserStr);
            const users = await api.getUsers();
            const freshUser = users.find(u => u.id === savedUser.id);
            if (freshUser) {
              setUser(freshUser);
            } else {
              localStorage.removeItem('user');
            }
          }
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (event === 'SIGNED_IN' && currentSession?.user) {
            try {
              const users = await api.getUsers();
              const dbUser = users.find(u => u.email.toLowerCase() === currentSession.user.email?.toLowerCase());
              if (dbUser) {
                setUser(dbUser);
                localStorage.setItem('user', JSON.stringify(dbUser));
              }
            } catch (err) {
              console.error("Error fetching db user on auth change:", err);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            localStorage.removeItem('user');
          }
        });

        unsubscribe = () => {
          subscription.unsubscribe();
        };
    } catch (e) {
      console.warn("Supabase auth listener not initialized or missing config. Falling back to local state.", e);
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg.includes('Supabase is not configured')) {
        localStorage.removeItem('user');
        setUser(null);
      } else {
        const savedUserStr = localStorage.getItem('user');
        if (savedUserStr) {
          try {
            const savedUser = JSON.parse(savedUserStr);
            setUser(savedUser);
          } catch {
            localStorage.removeItem('user');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };
    checkAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    setLoading(true);
    try {
      if (password && !DEMO_EMAILS.has(email.toLowerCase())) {
        const { getSupabaseClient } = await import('../lib/supabaseClient');
        const supabase = await getSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      const { user: loggedInUser } = await api.login(email);
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      return loggedInUser;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (signUpData: {
    email: string;
    password?: string;
    name: string;
    role: string;
    techLeadId?: string | null;
  }): Promise<User> => {
    setLoading(true);
    try {
      // 1. Check if email already exists in database
      const exists = await api.checkEmailExists(signUpData.email);
      if (exists) {
        throw new Error("This email is already registered in the database.");
      }

      let authUserId = "";

      if (signUpData.password) {
        // 2. Create standard Supabase account
        const { getSupabaseClient } = await import('../lib/supabaseClient');
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase.auth.signUp({
          email: signUpData.email,
          password: signUpData.password,
          options: {
            data: {
              name: signUpData.name
            }
          }
        });
        if (error) throw error;
        if (!data.user) throw new Error("Could not initialize Supabase Auth session.");
        authUserId = data.user.id;
      } else {
        authUserId = `u-${Date.now()}`;
      }

      // 3. Create standard Prisma User row matching Supabase Auth ID
      const { user: createdUser } = await api.registerUser({
        id: authUserId,
        email: signUpData.email,
        name: signUpData.name,
        role: signUpData.role,
        techLeadId: signUpData.techLeadId
      });

      setUser(createdUser);
      localStorage.setItem('user', JSON.stringify(createdUser));
      return createdUser;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { getSupabaseClient } = await import('../lib/supabaseClient');
      const supabase = await getSupabaseClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Could not sign out of Supabase Auth, clearing local state", e);
    }
    setUser(null);
    localStorage.removeItem('user');
  };

  const switchUser = (targetUser: User) => {
    setUser(targetUser);
    localStorage.setItem('user', JSON.stringify(targetUser));
  };

  const refreshCurrentUser = async () => {
    if (!user) return;
    try {
      const users = await api.getUsers();
      const freshUser = users.find(u => u.id === user.id);
      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      }
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signUp,
      logout, 
      switchUser, 
      allDemoUsers: DEMO_ACCOUNTS,
      refreshCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


