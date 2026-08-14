/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'intern' | 'tech_lead' | 'manager' | 'super_admin';

export type ProjectStatus = 'planned' | 'upcoming' | 'active' | 'completed' | 'archived';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  avatar: string;
  isActive: boolean;
  assigned_tech_lead_id?: string;
  mustChangePassword?: boolean;
  organizationId?: string;
}

export interface Project {
   id: string;
   name: string;
   description: string;
   github_url: string;
   tech_stack: string[];
   owner_id: string;
   owner_name?: string;
   screenshots: string[];
   status?: ProjectStatus;
   start_date?: string;
   end_date?: string;
   assigned_tech_lead_ids?: string[];
   assigned_intern_ids?: string[];
  }

export interface DailyLog {
  id: string;
  intern_id: string;
  project_id: string;
  summary: string;
  technologies: string[];
  changes: string; // changelog bullet style
  screenshot_url?: string;
  github_url: string;
  date: string; // YYYY-MM-DD
  status: 'submitted' | 'reviewed';
  isHidden?: boolean;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  assigned_to?: string;
  assigned_by: string;
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  started_at?: string;
  completed_at?: string;
  score?: number;
  comment?: string;
  blockers?: string;
  pr_link?: string;
  self_score?: number;
  self_comment?: string;
  completed_description?: string;
  assigned_tech_lead_ids?: string[];
  pending_acceptance?: boolean;
  accepted_at?: string;
  created_at?: string;
}

export interface Mark {
  id: string;
  intern_id: string;
  given_by: string; // tech_lead_id
  related_log_id?: string;
  related_task_id?: string;
  score: number; // e.g. 1-5 or 1-100
  comment?: string;
  date: string;
}

export type MistakeSeverity = 'low' | 'medium' | 'high';

export interface Mistake {
  id: string;
  intern_id: string;
  flagged_by: string; // tech_lead_id
  related_log_id: string;
  note: string;
  severity: MistakeSeverity;
  date: string;
  resolved: boolean;
}

export interface DaySession {
  id: string;
  intern_id: string;
  date: string; // YYYY-MM-DD
  started_at: string; // HH:MM AM/PM
  ended_at?: string; // HH:MM AM/PM
   status: 'active' | 'completed';
   is_late?: boolean;
   today_project?: string;
  today_plan?: string;
  questions?: string;
  git_link?: string;
  end_journal?: string;
  earlyExitRequested?: boolean;
  earlyExitReason?: string;
  earlyExitApproved?: boolean;
  missedFinalJournal?: boolean;
}

export interface TeamStats {
  complianceRate: number; // % who submitted today
  avgMarks: number;
  totalLogs: number;
  activeCount: number;
  totalTasks: number;
  completedTasks: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetType?: string;
  details?: string;
  timestamp: string;
  actorName?: string;
  actorEmail?: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt: string;
}

export interface ContentFlag {
  id: string;
  userId: string;
  contentId: string;
  contentType: string;
  reason: string;
  status: 'pending' | 'dismissed' | 'resolved';
  createdAt: string;
  dismissedAt?: string;
  resolvedAt?: string;
  preview?: {
    title?: string;
    content?: string;
    authorName?: string;
    extra?: string;
  };
}

export interface CalendarMarker {
  id: string;
  user_id: string;
  date: string;
  is_available: boolean;
}


