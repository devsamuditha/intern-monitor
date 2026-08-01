/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'intern' | 'tech_lead' | 'manager' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  avatar: string;
  assigned_tech_lead_id?: string;
  mustChangePassword?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  github_url: string;
  tech_stack: string[];
  owner_id: string;
  screenshots: string[];
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
  assigned_to: string; // intern_id
  assigned_by: string; // tech_lead_id
  title: string;
  description: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at?: string;
  score?: number; // given by Tech Lead
  comment?: string; // Tech Lead review comment
  blockers?: string;
  pr_link?: string;
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

export interface Message {
  id: string;
  from_id: string;
  to_id: string;
  content: string;
  timestamp: string;
  read: boolean;
  isHidden?: boolean;
}

export interface Reply {
  id: string;
  user_id: string;
  content: string;
  timestamp: string;
  isHidden?: boolean;
}

export interface Question {
  id: string;
  intern_id: string;
  title: string;
  content: string;
  timestamp: string;
  isHidden?: boolean;
  replies: Reply[];
}

export interface DaySession {
  id: string;
  intern_id: string;
  date: string; // YYYY-MM-DD
  started_at: string; // HH:MM AM/PM
  ended_at?: string; // HH:MM AM/PM
  status: 'active' | 'completed';
  today_project?: string;
  today_plan?: string;
  questions?: string;
  git_link?: string;
  end_journal?: string;
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


