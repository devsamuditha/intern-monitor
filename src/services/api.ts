/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
 
"use client";

import {
  User, 
  Project, 
  DailyLog, 
  Task, 
  Mark, 
  Mistake, 
  Message, 
  Question,
  DaySession,
  TaskPriority,
  TaskStatus,
  MistakeSeverity
} from "../types.js";
import { AuditLog, SystemSetting, ContentFlag } from "../types.js";

// Helper to construct request headers. Auth is handled via HttpOnly session cookies
// which the browser sends automatically for same-origin requests, so no manual
// Authorization / x-user-id headers are required.
const getHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
});

const getAuthHeaders = async (): Promise<Record<string, string>> => getHeaders();

const handleResponse = async (response: Response): Promise<any> => {
  const status = response.status;
  const contentType = (response.headers.get("content-type") || "").toLowerCase();

  // Handle non-OK responses with best-effort parsing
  if (!response.ok) {
    let payload: any = null;
    try {
      if (contentType.includes("application/json")) {
        payload = await response.json();
      } else {
        const text = await response.text();
        payload = { message: text };
      }
    } catch (e) {
      payload = { message: "Failed to parse error response" };
    }

    const errMsg = payload?.error || payload?.message || "Something went wrong";
    const err: any = new Error(errMsg);
    err.status = status;
    err.payload = payload;
    throw err;
  }

  // No Content
  if (status === 204) return null;

  // Try to parse successful response
  try {
    if (contentType.includes("application/json")) return await response.json();
    return await response.text();
  } catch (e) {
    const err: any = new Error("Failed to parse response body");
    err.status = status;
    throw err;
  }
};

export const api = {
  // Config
  getConfig: async (): Promise<Record<string, any>> => {
    const res = await fetch("/api/config");
    return handleResponse(res);
  },

  // Auth
  login: async (username: string, password: string): Promise<{ user: User }> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(res);
  },

  getSession: async (): Promise<{ user: User | null }> => {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
  },

  logout: async (): Promise<{ success: boolean }> => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
  },

  checkUsernameExists: async (username: string): Promise<boolean> => {
    const res = await fetch("/api/auth/check-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    const data = await handleResponse(res);
    return data.exists;
  },

  registerUser: async (data: {
    name: string;
    email: string;
    role: string;
    techLeadId?: string | null;
  }): Promise<{ user: User; username: string; password: string }> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  changePassword: async (data: {
    currentPassword?: string;
    newPassword: string;
  }): Promise<{ success: boolean; mustChangePassword: boolean }> => {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getPublicTechLeads: async (): Promise<User[]> => {
    const res = await fetch("/api/public/tech-leads");
    return handleResponse(res);
  },

  // Users
  getUsers: async (filters?: { role?: string; assigned_tech_lead_id?: string }): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append("role", filters.role);
    if (filters?.assigned_tech_lead_id) params.append("assigned_tech_lead_id", filters.assigned_tech_lead_id);
    const res = await fetch(`/api/users?${params.toString()}`, {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<User> => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Projects
  getProjects: async (filters?: { status?: string; assigned_tech_lead_ids?: string[] }): Promise<Project[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.assigned_tech_lead_ids && filters.assigned_tech_lead_ids.length > 0) {
      params.append("assigned_tech_lead_id", filters.assigned_tech_lead_ids.join(','));
    }
    const res = await fetch(`/api/projects?${params.toString()}`, {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  saveProject: async (project: Partial<Project>): Promise<Project> => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(project)
    });
    return handleResponse(res);
  },

  deleteProject: async (projectId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Daily Logs
  getLogs: async (filters?: { intern_id?: string; project_id?: string }): Promise<DailyLog[]> => {
    const params = new URLSearchParams();
    if (filters?.intern_id) params.append("intern_id", filters.intern_id);
    if (filters?.project_id) params.append("project_id", filters.project_id);
    const res = await fetch(`/api/logs?${params.toString()}`, {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  submitLog: async (log: {
    intern_id: string;
    project_id: string;
    summary: string;
    technologies: string[];
    changes: string;
    screenshot_url?: string;
    github_url: string;
  }): Promise<DailyLog> => {
    const res = await fetch("/api/logs", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(log)
    });
    return handleResponse(res);
  },

  reviewLog: async (
    logId: string,
    data: {
      reviewer_id: string;
      score: number;
      comment?: string;
      mistakesFlagged?: Array<{ note: string; severity: MistakeSeverity }>;
    }
  ): Promise<{ success: boolean; log: DailyLog }> => {
    const res = await fetch(`/api/logs/${logId}/review`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Tasks
  getTasks: async (filters?: { assigned_to?: string; assigned_by?: string }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.assigned_to) params.append("assigned_to", filters.assigned_to);
    if (filters?.assigned_by) params.append("assigned_by", filters.assigned_by);
    const res = await fetch(`/api/tasks?${params.toString()}`, {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  assignTask: async (task: {
    assigned_to: string;
    assigned_by: string;
    title: string;
    description: string;
    due_date: string;
    priority: TaskPriority;
    blockers?: string;
    pr_link?: string;
  }): Promise<Task> => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(task)
    });
    return handleResponse(res);
  },

  updateTask: async (
    taskId: string,
    updates: Partial<{
      title: string;
      description: string;
      due_date: string;
      priority: TaskPriority;
      status: TaskStatus;
      blockers?: string;
      pr_link?: string;
    }>
  ): Promise<Task> => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  updateTaskStatus: async (
    taskId: string,
    status: TaskStatus,
    extra?: { blockers?: string; pr_link?: string }
  ): Promise<Task> => {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status, ...extra })
    });
    return handleResponse(res);
  },

  deleteTask: async (taskId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  reviewTask: async (
    taskId: string,
    data: {
      reviewer_id: string;
      score: number;
      comment?: string;
    }
  ): Promise<Task> => {
    const res = await fetch(`/api/tasks/${taskId}/review`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Marks
  getMarks: async (internId?: string): Promise<Mark[]> => {
    const url = internId ? `/api/marks?intern_id=${internId}` : "/api/marks";
    const res = await fetch(url, {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Mistakes
  getMistakes: async (filters?: { intern_id?: string; resolved?: boolean }): Promise<Mistake[]> => {
    const params = new URLSearchParams();
    if (filters?.intern_id) params.append("intern_id", filters.intern_id);
    if (filters?.resolved !== undefined) params.append("resolved", filters.resolved ? "true" : "false");
    const res = await fetch(`/api/mistakes?${params.toString()}`, {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  resolveMistake: async (mistakeId: string, resolved: boolean): Promise<Mistake> => {
    const res = await fetch(`/api/mistakes/${mistakeId}/resolve`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ resolved })
    });
    return handleResponse(res);
  },

  // Chat Messages
  getMessages: async (userA: string, userB: string): Promise<Message[]> => {
    const res = await fetch(`/api/messages?user_a=${userA}&user_b=${userB}`, {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  sendMessage: async (message: { from_id: string; to_id: string; content: string }): Promise<Message> => {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(message)
    });
    return handleResponse(res);
  },

  markMessagesRead: async (userId: string, senderId: string): Promise<{ success: boolean }> => {
    const res = await fetch("/api/messages", {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ user_id: userId, sender_id: senderId })
    });
    return handleResponse(res);
  },

  // Threaded Questions
  getQuestions: async (): Promise<Question[]> => {
    const res = await fetch("/api/questions", {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  askQuestion: async (question: { intern_id: string; title: string; content: string }): Promise<Question> => {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(question)
    });
    return handleResponse(res);
  },

  replyToQuestion: async (questionId: string, reply: { user_id: string; content: string }): Promise<Question> => {
    const res = await fetch(`/api/questions/${questionId}/replies`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(reply)
    });
    return handleResponse(res);
  },

  // Analytics
  getAnalytics: async (techLeadId?: string): Promise<any> => {
    const url = techLeadId ? `/api/analytics?tech_lead_id=${techLeadId}` : "/api/analytics";
    const res = await fetch(url, {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Day Sessions (Start / End Day)
  getTodayDaySessions: async (internId?: string): Promise<DaySession[]> => {
    const url = internId ? `/api/day-sessions/today?intern_id=${internId}` : "/api/day-sessions/today";
    const res = await fetch(url, {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  startDaySession: async (data: {
    intern_id: string;
    today_project?: string;
    today_plan?: string;
    questions?: string;
    git_link?: string;
  }): Promise<DaySession> => {
    const res = await fetch("/api/day-sessions/start", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  endDaySession: async (data: {
    intern_id: string;
    end_journal?: string;
  }): Promise<DaySession> => {
    const res = await fetch("/api/day-sessions/end", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  createUserBySuperAdmin: async (data: { name: string; email: string; username: string; password: string; role: string; techLeadId?: string; organizationId?: string }): Promise<{ user: User; username: string; password: string }> => {
    const res = await fetch("/api/superadmin/users", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  reassignTechLead: async (userId: string, techLeadId: string | null): Promise<User> => {
    const res = await fetch(`/api/superadmin/users/${userId}/reassign-tech-lead`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ techLeadId })
    });
    return handleResponse(res);
  },

  // SuperAdmin Organizations
  getOrganizations: async (): Promise<any[]> => {
    const res = await fetch("/api/superadmin/organizations", {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  createOrganization: async (data: { name: string; slug: string }): Promise<any> => {
    const res = await fetch("/api/superadmin/organizations", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updateOrganization: async (id: string, data: { name?: string; slug?: string }): Promise<any> => {
    const res = await fetch(`/api/superadmin/organizations/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deleteOrganization: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`/api/superadmin/organizations/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // SuperAdmin
  getAuditLogs: async (filters?: {
    action?: string;
    targetType?: string;
    userId?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number; limit: number; offset: number }> => {
    const params = new URLSearchParams();
    if (filters?.action) params.append("action", filters.action);
    if (filters?.targetType) params.append("targetType", filters.targetType);
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.actorId) params.append("actorId", filters.actorId);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));
    const res = await fetch(`/api/superadmin/audit-logs?${params.toString()}`, {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  getAuditLogsSummary: async (): Promise<{ actorId: string; actorName: string; count: number }[]> => {
    const res = await fetch("/api/superadmin/audit-logs/summary", {
      headers: await getAuthHeaders()
    });
    return handleResponse(res);
  },

  createContentFlag: async (data: { contentType: string; contentId: string; reason: string }): Promise<any> => {
    const res = await fetch("/api/content-flags", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getContentFlags: async (filters?: {
    status?: string;
    contentType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ flags: any[]; total: number; limit: number; offset: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.contentType) params.append("contentType", filters.contentType);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));
    const res = await fetch(`/api/superadmin/content-flags?${params.toString()}`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateContentFlag: async (id: string, action: "dismiss" | "resolve"): Promise<any> => {
    const res = await fetch(`/api/superadmin/content-flags/${id}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ action }),
    });
    return handleResponse(res);
  },

  getSystemSettings: async (): Promise<SystemSetting[]> => {
    const res = await fetch("/api/superadmin/system-settings", {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Public lightweight settings read (any authenticated user)
  getSettings: async (): Promise<Record<string, any>> => {
    const res = await fetch("/api/settings", {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateSystemSetting: async (key: string, value: string): Promise<SystemSetting> => {
    const res = await fetch(`/api/superadmin/system-settings/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ value })
    });
    return handleResponse(res);
  },

  getOverview: async (): Promise<any> => {
    const res = await fetch("/api/superadmin/overview", {
      headers: await getAuthHeaders(),
    });
    return handleResponse(res);
  }
};

