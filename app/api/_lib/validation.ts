import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const CheckUsernameSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
});

export const RegisterUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email address is required" }),
  role: z.enum(['intern', 'tech_lead', 'manager', 'super_admin', 'INTERN', 'TECH_LEAD', 'MANAGER', 'SUPER_ADMIN'], {
    message: "Role must be intern, tech_lead, manager, or super_admin"
  }),
  techLeadId: z.string().optional().nullable(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters" }),
});

export const ResetFirstPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export const ToggleUserStatusSchema = z.object({
  active: z.boolean({ message: "Active flag must be a boolean" }),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }).optional(),
  role: z.enum(['intern', 'tech_lead', 'manager', 'super_admin', 'INTERN', 'TECH_LEAD', 'MANAGER', 'SUPER_ADMIN']).optional(),
  assigned_tech_lead_id: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const ProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "Project name is required" }),
  description: z.string().min(1, { message: "Project description is required" }),
  github_url: z.string().min(1, { message: "GitHub URL is required" }),
  tech_stack: z.array(z.string()).optional(),
  owner_id: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
});

export const SubmitDailyLogSchema = z.object({
  intern_id: z.string().min(1, { message: "Intern ID is required" }),
  project_id: z.string().min(1, { message: "Project ID is required" }),
  summary: z.string().min(1, { message: "Summary is required" }),
  technologies: z.array(z.string()).optional(),
  changes: z.string().min(1, { message: "Key changes description is required" }),
  screenshot_url: z.string().optional().nullable(),
  github_url: z.string().min(1, { message: "GitHub repository URL is required" }),
});

export const ReviewLogSchema = z.object({
  reviewer_id: z.string().min(1, { message: "Reviewer ID is required" }),
  score: z.number().min(0).max(10).optional(),
  comment: z.string().optional().nullable(),
  mistakesFlagged: z.array(z.object({
    note: z.string().min(1, { message: "Mistake note is required" }),
    severity: z.enum(['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH']),
  })).optional(),
});

export const CreateTaskSchema = z.object({
  assigned_to: z.string().min(1, { message: "Assigned intern ID is required" }),
  assigned_by: z.string().min(1, { message: "Assigner ID is required" }),
  title: z.string().min(1, { message: "Task title is required" }),
  description: z.string().min(1, { message: "Task description is required" }),
  due_date: z.string().min(1, { message: "Due date is required" }),
  priority: z.enum(['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH']),
  blockers: z.string().optional().nullable(),
  pr_link: z.string().optional().nullable(),
});

export const UpdateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  due_date: z.string().min(1).optional(),
  priority: z.enum(['low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'TODO', 'IN_PROGRESS', 'DONE']).optional(),
  blockers: z.string().optional().nullable(),
  pr_link: z.string().optional().nullable(),
});

export const TaskStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done', 'TODO', 'IN_PROGRESS', 'DONE']),
  blockers: z.string().optional().nullable(),
  pr_link: z.string().optional().nullable(),
});

export const ScoreTaskSchema = z.object({
  reviewer_id: z.string().min(1, { message: "Reviewer ID is required" }),
  score: z.number().min(0).max(10, { message: "Score must be between 0 and 10" }),
  comment: z.string().optional().nullable(),
});

export const ResolveMistakeSchema = z.object({
  resolved: z.boolean({ message: "Resolved status must be a boolean" }),
});

export const SendMessageSchema = z.object({
  from_id: z.string().min(1, { message: "Sender ID is required" }),
  to_id: z.string().min(1, { message: "Recipient ID is required" }),
  content: z.string().min(1, { message: "Message content cannot be empty" }),
});

export const ReadMessagesSchema = z.object({
  user_id: z.string().min(1, { message: "User ID is required" }),
  sender_id: z.string().min(1, { message: "Sender ID is required" }),
});

export const AskQuestionSchema = z.object({
  intern_id: z.string().min(1, { message: "Intern ID is required" }),
  title: z.string().min(1, { message: "Question title is required" }),
  content: z.string().min(1, { message: "Question content is required" }),
});

export const ReplyQuestionSchema = z.object({
  user_id: z.string().min(1, { message: "Author ID is required" }),
  content: z.string().min(1, { message: "Reply content cannot be empty" }),
});

export const StartDaySchema = z.object({
  intern_id: z.string().min(1, { message: "Intern ID is required" }),
  today_project: z.string().optional().nullable(),
  today_plan: z.string().optional().nullable(),
  questions: z.string().optional().nullable(),
  git_link: z.string().optional().nullable(),
});

export const CreateUserBySuperAdminSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email address is required" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  role: z.enum(['intern', 'tech_lead', 'manager', 'super_admin', 'INTERN', 'TECH_LEAD', 'MANAGER', 'SUPER_ADMIN'], {
    message: "Role must be intern, tech_lead, manager, or super_admin"
  }),
  techLeadId: z.string().optional().nullable(),
});

export const ReassignTechLeadSchema = z.object({
  techLeadId: z.string().optional().nullable(),
});

export const EndDaySchema = z.object({
  intern_id: z.string().min(1, { message: "Intern ID is required" }),
  end_journal: z.string().optional().nullable(),
});

export const CreateContentFlagSchema = z.object({
  contentType: z.enum(['message', 'question', 'reply', 'daily_log']),
  contentId: z.string().min(1),
  reason: z.string().min(1, { message: "Reason is required" }).max(500),
});

export const UpdateContentFlagStatusSchema = z.object({
  action: z.enum(['dismiss', 'resolve']),
});

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (request: Request) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new Error("Validation Error: Invalid JSON body");
    }
    const result = schema.safeParse(body);
    if (!result.success) {
      const formattedErrors = result.error.issues.map(issue => `${issue.path.join('.') || 'body'}: ${issue.message}`).join(', ');
      throw new Error(`Validation Error: ${formattedErrors}`);
    }
    return result.data;
  };
}