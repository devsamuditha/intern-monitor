"use client";

import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { api } from "@/src/services/api";
import { User, Project, DailyLog, Task, Mark, Mistake, Message, Question, DaySession } from "@/src/types";

// ─── Settings ───────────────────────────────────────────

export function useSettingsQuery() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Tech Lead Dashboard ─────────────────────────────────

export function useTechLeadDashboard(techLeadId: string | undefined) {
  return useQueries({
    queries: [
      {
        queryKey: ["analytics", techLeadId],
        queryFn: () => api.getAnalytics(techLeadId),
        enabled: !!techLeadId,
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: ["projects", "upcoming"],
        queryFn: () => api.getProjects({ status: "upcoming" }),
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: ["public-tech-leads"],
        queryFn: () => api.getPublicTechLeads(),
        staleTime: 10 * 60 * 1000,
      },
    ],
  });
}

// ─── Manager Dashboard ───────────────────────────────────

export function useManagerDashboard() {
  return useQueries({
    queries: [
      {
        queryKey: ["analytics"],
        queryFn: () => api.getAnalytics(),
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: ["users"],
        queryFn: () => api.getUsers(),
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: ["tasks"],
        queryFn: () => api.getTasks(),
        staleTime: 2 * 60 * 1000,
      },
    ],
  });
}

// ─── SuperAdmin Dashboards ───────────────────────────────

export function useSuperAdminOverview() {
  return useQuery({
    queryKey: ["superadmin", "overview"],
    queryFn: () => api.getOverview(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSuperAdminUsers(filters?: { role?: string; assigned_tech_lead_id?: string }) {
  return useQuery({
    queryKey: ["superadmin", "users", filters],
    queryFn: () => api.getUsers(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSuperAdminContentFlags(filters?: { status?: string; contentType?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["superadmin", "content-flags", filters],
    queryFn: () => api.getContentFlags(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSuperAdminAuditLogs(filters?: {
  action?: string;
  targetType?: string;
  userId?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["superadmin", "audit-logs", filters],
    queryFn: () => api.getAuditLogs(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSuperAdminAuditSummary() {
  return useQuery({
    queryKey: ["superadmin", "audit-summary"],
    queryFn: () => api.getAuditLogsSummary(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuperAdminSettings() {
  return useQuery({
    queryKey: ["superadmin", "system-settings"],
    queryFn: () => api.getSystemSettings(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuperAdminOrganizations() {
  return useQuery({
    queryKey: ["superadmin", "organizations"],
    queryFn: () => api.getOrganizations(),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Shared Data Queries ─────────────────────────────────

export function useRanking() {
  return useQuery({
    queryKey: ["ranking"],
    queryFn: () => api.getInternRanking(),
    staleTime: 30 * 60 * 1000,
  });
}

export function usePublicTechLeads() {
  return useQuery({
    queryKey: ["public-tech-leads"],
    queryFn: () => api.getPublicTechLeads(),
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────

const invalidateDashboardQueries = (qc: any) => {
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["analytics"] });
  qc.invalidateQueries({ queryKey: ["logs"] });
  qc.invalidateQueries({ queryKey: ["marks"] });
  qc.invalidateQueries({ queryKey: ["mistakes"] });
  qc.invalidateQueries({ queryKey: ["tasks"] });
  qc.invalidateQueries({ queryKey: ["day-sessions"] });
  qc.invalidateQueries({ queryKey: ["users"] });
  qc.invalidateQueries({ queryKey: ["ranking"] });
  qc.invalidateQueries({ queryKey: ["superadmin"] });
};

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<User> }) =>
      api.updateUser(userId, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["superadmin", "users"] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.deleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["superadmin", "users"] });
    },
  });
}

export function useCreateUserBySuperAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; username: string; password: string; role: string; techLeadId?: string; organizationId?: string }) =>
      api.createUserBySuperAdmin(data),
    onSuccess: () => {
      invalidateDashboardQueries(qc);
    },
  });
}

export function useReassignTechLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, techLeadId }: { userId: string; techLeadId: string | null }) =>
      api.reassignTechLead(userId, techLeadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["superadmin", "users"] });
    },
  });
}

export function useSaveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (project: Partial<Project>) => api.saveProject(project),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => api.deleteProject(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      api.updateTask(taskId, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.deleteTask(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReviewTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: { reviewer_id: string; score: number; comment?: string } }) =>
      api.reviewTask(taskId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useResolveMistake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mistakeId, resolved }: { mistakeId: string; resolved: boolean }) =>
      api.resolveMistake(mistakeId, resolved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mistakes"] });
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: { from_id: string; to_id: string; content: string }) =>
      api.sendMessage(message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useAskQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (question: { intern_id: string; title: string; content: string }) =>
      api.askQuestion(question),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useReplyToQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, reply }: { questionId: string; reply: { user_id: string; content: string } }) =>
      api.replyToQuestion(questionId, reply),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useUpdateContentFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "dismiss" | "resolve" }) =>
      api.updateContentFlag(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "content-flags"] });
    },
  });
}

export function useUpdateSystemSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.updateSystemSetting(key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["superadmin", "system-settings"] });
    },
  });
}
