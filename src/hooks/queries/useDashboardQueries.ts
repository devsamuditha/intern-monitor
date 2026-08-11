"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/services/api";

export function useInternDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", userId],
    queryFn: async () => {
      if (!userId) throw new Error("No user id");
      const [logs, tasks, mistakes, marks, todaySessions, projects] = await Promise.all([
        api.getLogs({ intern_id: userId }),
        api.getTasks({ assigned_to: userId }),
        api.getMistakes({ intern_id: userId }),
        api.getMarks(userId),
        api.getTodayDaySessions(userId),
        api.getProjects(),
      ]);
      return { logs, tasks, mistakes, marks, todaySessions, projects };
    },
    enabled: !!userId,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => api.getProjects(),
  });
}

export function useLogs(internId?: string) {
  return useQuery({
    queryKey: ["logs", internId],
    queryFn: () => api.getLogs(internId ? { intern_id: internId } : undefined),
  });
}

export function useTasks(assignedTo?: string) {
  return useQuery({
    queryKey: ["tasks", assignedTo],
    queryFn: () => api.getTasks(assignedTo ? { assigned_to: assignedTo } : undefined),
  });
}

export function useMarks(internId?: string) {
  return useQuery({
    queryKey: ["marks", internId],
    queryFn: () => api.getMarks(internId),
  });
}

export function useMistakes(internId?: string, resolved?: boolean) {
  return useQuery({
    queryKey: ["mistakes", internId, resolved],
    queryFn: () => api.getMistakes(internId ? { intern_id: internId, resolved } : { resolved }),
  });
}

export function useTodayDaySessions(internId?: string) {
  return useQuery({
    queryKey: ["day-sessions", "today", internId],
    queryFn: () => api.getTodayDaySessions(internId),
  });
}

export function useSubmitLog(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.submitLog,
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["marks"] });
      queryClient.invalidateQueries({ queryKey: ["mistakes"] });
      queryClient.invalidateQueries({ queryKey: ["day-sessions"] });
    },
  });
}

export function useStartDaySession(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.startDaySession,
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
      }
      queryClient.invalidateQueries({ queryKey: ["day-sessions"] });
    },
  });
}

export function useEndDaySession(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.endDaySession,
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
      }
      queryClient.invalidateQueries({ queryKey: ["day-sessions"] });
    },
  });
}

export function useUpdateTaskStatus(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status, extra }: { taskId: string; status: string; extra?: any }) =>
      api.updateTaskStatus(taskId, status as any, extra),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["dashboard", userId] });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
