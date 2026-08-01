"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  signUp: (signUpData: {
    name: string;
    email: string;
    role: string;
    techLeadId?: string | null;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "interntrack_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) return JSON.parse(stored) as User;
    } catch {
      // corrupt storage, ignore
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const persistUser = (u: User | null) => {
    try {
      if (u) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // storage unavailable
    }
  };

  const refreshCurrentUser = async () => {
    setLoading(true);
    try {
      const { user: sessionUser } = await api.getSession();
      if (sessionUser) {
        setUser(sessionUser);
        persistUser(sessionUser);
      } else {
        setUser(null);
        persistUser(null);
      }
    } catch (e) {
      console.warn("Session check failed:", e);
      setUser(null);
      persistUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCurrentUser();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const { user: loggedInUser } = await api.login(username, password);
      setUser(loggedInUser);
      persistUser(loggedInUser);
      return loggedInUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (signUpData: {
    name: string;
    email: string;
    role: string;
    techLeadId?: string | null;
  }): Promise<User> => {
    setLoading(true);
    try {
      const data = await api.registerUser(signUpData);
      const createdUser = data.user;
      if (createdUser) setUser(createdUser);
      return createdUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn("Logout request failed:", e);
    }
    setUser(null);
    persistUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signUp, logout, refreshCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
