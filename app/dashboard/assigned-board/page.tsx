"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { TasksBoard } from "@/src/components/intern/TasksBoard";
import { CompleteTaskModal } from "@/src/components/intern/CompleteTaskModal";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";
import { useTasks, useUpdateTaskStatus } from "@/src/hooks/queries/useDashboardQueries";
import { Task } from "@/src/types";

export default function AssignedBoardPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("assigned-board");

  if (!user) return null;

  const { data: tasks = [], refetch } = useTasks(user.id);
  const updateTaskStatusMutation = useUpdateTaskStatus(user.id);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [showCompleteTaskModal, setShowCompleteTaskModal] = useState(false);

  const handleTaskStatusToggle = async (task: Task) => {
    if (updateTaskStatusMutation.isPending) return;
    if (task.status === "todo") {
      try {
        await updateTaskStatusMutation.mutateAsync({ taskId: task.id, status: "in_progress" });
        refetch();
      } catch (err: any) {
        alert(err.message || "Failed to start task");
      }
    } else if (task.status === "in_progress") {
      setTaskToComplete(task);
      setShowCompleteTaskModal(true);
    }
  };

  const handleCompleteTaskSubmit = async (data: {
    taskId: string;
    pr_link: string;
    completed_description: string;
    self_score?: number;
    self_comment?: string;
  }) => {
    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId: data.taskId,
        status: "done",
        extra: {
          pr_link: data.pr_link,
          completed_description: data.completed_description,
          self_score: data.self_score,
          self_comment: data.self_comment,
        },
      });
      setShowCompleteTaskModal(false);
      setTaskToComplete(null);
      refetch();
    } catch (err: any) {
      alert(err.message || "Failed to complete task");
    }
  };

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-4xl mx-auto">
        <TasksBoard
          tasks={tasks}
          onTaskStatusToggle={handleTaskStatusToggle}
          taskStatusLoading={updateTaskStatusMutation.isPending}
        />
        <CompleteTaskModal
          show={showCompleteTaskModal}
          onClose={() => setShowCompleteTaskModal(false)}
          task={taskToComplete}
          onSubmit={handleCompleteTaskSubmit}
          submitting={updateTaskStatusMutation.isPending}
        />
      </div>
    </DashboardShell>
  );
}
