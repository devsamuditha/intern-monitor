import 'dotenv/config';

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getPrisma } from "./src/db/prisma.js";
import { getSupabaseAdmin, uploadBase64Image } from "./src/lib/supabase.js";
import { Role, TaskStatus, TaskPriority, MistakeSeverity } from "@prisma/client";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pino from "pino";
import pinoHttp from "pino-http";
import { logger } from "./src/lib/logger.js";
import {
  validateBody,
  LoginSchema,
  CheckEmailSchema,
  RegisterUserSchema,
  ToggleUserStatusSchema,
  UpdateUserSchema,
  ProjectSchema,
  SubmitDailyLogSchema,
  ReviewLogSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  TaskStatusSchema,
  ScoreTaskSchema,
  ResolveMistakeSchema,
  SendMessageSchema,
  ReadMessagesSchema,
  AskQuestionSchema,
  ReplyQuestionSchema,
  StartDaySchema,
  EndDaySchema,
  CreateUserBySuperAdminSchema,
  ReassignTechLeadSchema,
  CreateContentFlagSchema,
  UpdateContentFlagStatusSchema,
} from "./src/lib/validation.js";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet());
const isDev = process.env.NODE_ENV !== "production";

// --- RATE LIMITER (disabled in dev for local testing) ---
if (!isDev) {
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }));
}
app.use(pinoHttp({ logger }));

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ws: wss:; connect-src 'self' ws: wss:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' blob:;");
  res.setHeader("Access-Control-Allow-Origin", process.env.APP_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");
  next();
});

// Helper to format date strings relative to today
const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

// --- SCHEMA MAPPER FUNCTIONS ---
function mapUser(dbUser: any) {
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role.toLowerCase(), // INTERN -> intern, TECH_LEAD -> tech_lead, etc.
    avatar: dbUser.avatarUrl,
    assigned_tech_lead_id: dbUser.techLeadId || undefined,
    active: dbUser.isActive,
  };
}

function mapProject(dbProj: any) {
  if (!dbProj) return null;
  return {
    id: dbProj.id,
    name: dbProj.name,
    description: dbProj.description,
    github_url: dbProj.githubUrl,
    tech_stack: dbProj.techStack,
    owner_id: dbProj.ownerId,
    screenshots: dbProj.screenshots || [],
  };
}

function mapDailyLog(dbLog: any) {
  if (!dbLog) return null;
  return {
    id: dbLog.id,
    intern_id: dbLog.internId,
    project_id: dbLog.projectId,
    summary: dbLog.summary,
    technologies: dbLog.technologies,
    changes: dbLog.changes,
    screenshot_url: dbLog.screenshotUrl || undefined,
    github_url: dbLog.githubUrl,
    date: dbLog.date,
    status: dbLog.status, // submitted or reviewed
  };
}

function mapTask(dbTask: any) {
  if (!dbTask) return null;
  return {
    id: dbTask.id,
    assigned_to: dbTask.assignedToId,
    assigned_by: dbTask.assignedById,
    title: dbTask.title,
    description: dbTask.description,
    due_date: dbTask.dueDate,
    priority: String(dbTask.priority).toLowerCase(), // HIGH -> high, etc.
    status: String(dbTask.status).toLowerCase(), // TODO -> todo, etc.
    completed_at: dbTask.completedAt || undefined,
    score: dbTask.score || undefined,
    comment: dbTask.comment || undefined,
    blockers: dbTask.blockers || undefined,
    pr_link: dbTask.prLink || undefined,
  };
}

function mapMark(dbMark: any) {
  if (!dbMark) return null;
  return {
    id: dbMark.id,
    intern_id: dbMark.internId,
    given_by: dbMark.givenById,
    related_log_id: dbMark.relatedLogId || undefined,
    related_task_id: dbMark.relatedTaskId || undefined,
    score: dbMark.score,
    comment: dbMark.comment || undefined,
    date: dbMark.date,
  };
}

function mapMistake(dbMistake: any) {
  if (!dbMistake) return null;
  return {
    id: dbMistake.id,
    intern_id: dbMistake.internId,
    flagged_by: dbMistake.flaggedById,
    related_log_id: dbMistake.relatedLogId,
    note: dbMistake.note,
    severity: dbMistake.severity.toLowerCase(), // HIGH -> high, etc.
    date: dbMistake.date,
    resolved: dbMistake.resolved,
  };
}

function mapMessage(dbMsg: any) {
  if (!dbMsg) return null;
  return {
    id: dbMsg.id,
    from_id: dbMsg.fromId,
    to_id: dbMsg.toId,
    content: dbMsg.content,
    timestamp: dbMsg.createdAt.toISOString(),
    read: dbMsg.read,
  };
}

function mapQuestion(dbQ: any) {
  if (!dbQ) return null;
  return {
    id: dbQ.id,
    intern_id: dbQ.internId,
    title: dbQ.title,
    content: dbQ.content,
    timestamp: dbQ.createdAt.toISOString(),
    replies: dbQ.replies ? dbQ.replies.map((r: any) => ({
      id: r.id,
      user_id: r.authorId,
      content: r.content,
      timestamp: r.createdAt.toISOString(),
    })) : [],
  };
}

function mapDaySession(dbSession: any) {
  if (!dbSession) return null;
  return {
    id: dbSession.id,
    intern_id: dbSession.internId,
    date: dbSession.date,
    started_at: dbSession.startedAt,
    ended_at: dbSession.endedAt || undefined,
    status: dbSession.status,
    today_project: dbSession.todayProject || undefined,
    today_plan: dbSession.todayPlan || undefined,
    questions: dbSession.questions || undefined,
    git_link: dbSession.gitLink || undefined,
    end_journal: dbSession.endJournal || undefined,
  };
}

function mapAuditLog(dbLog: any) {
  if (!dbLog) return null;
  return {
    id: dbLog.id,
    userId: dbLog.userId,
    action: dbLog.action,
    targetType: dbLog.targetType || undefined,
    details: dbLog.details || undefined,
    timestamp: dbLog.timestamp.toISOString(),
    actorName: dbLog.user?.name || undefined,
    actorEmail: dbLog.user?.email || undefined,
  };
}

function mapSystemSetting(dbSetting: any) {
  if (!dbSetting) return null;
  return {
    id: dbSetting.id,
    key: dbSetting.key,
    value: dbSetting.value,
    updatedBy: dbSetting.updatedBy || undefined,
    updatedByName: dbSetting.updater?.name || undefined,
    updatedAt: dbSetting.updatedAt.toISOString(),
  };
}

function mapContentFlag(dbFlag: any) {
  if (!dbFlag) return null;
  return {
    id: dbFlag.id,
    userId: dbFlag.userId,
    contentId: dbFlag.contentId,
    contentType: dbFlag.contentType,
    reason: dbFlag.reason,
    status: dbFlag.status,
    createdAt: dbFlag.createdAt.toISOString(),
    dismissedAt: dbFlag.dismissedAt ? dbFlag.dismissedAt.toISOString() : undefined,
    resolvedAt: dbFlag.resolvedAt ? dbFlag.resolvedAt.toISOString() : undefined,
  };
}

function calculateStreak(logs: any[]): number {
  const dates = Array.from(new Set(logs.map(l => l.date))).sort();
  if (dates.length === 0) return 0;
  
  let streak = 0;
  let currentOffset = 0;
  
  const todayStr = getRelativeDateStr(0);
  const yesterdayStr = getRelativeDateStr(-1);
  
  let targetDate = dates.includes(todayStr) ? todayStr : (dates.includes(yesterdayStr) ? yesterdayStr : null);
  if (!targetDate) return 0;
  
  while (true) {
    const checkDate = getRelativeDateStr(currentOffset - (dates.includes(todayStr) ? 0 : 1));
    if (dates.includes(checkDate)) {
      streak++;
      currentOffset--;
    } else {
      break;
    }
  }
  return streak;
}

// --- AUTH MIDDLEWARE ---
const authMiddleware = async (req: any, res: any, next: any) => {
  let userId: string | null = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    } catch (e) {
      logger.warn({ err: e }, "Supabase JWT verification failed");
    }
  }

  if (!userId) {
    userId = req.headers['x-user-id'] || req.query.userId;
  }

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No user session found. Please log in." });
  }

  try {
    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({
      where: { id: String(userId) },
    });

    if (!dbUser) {
      return res.status(401).json({ error: "Unauthorized: Active user not found in the database." });
    }

    if (!dbUser.isActive) {
      return res.status(403).json({ error: "This account is inactive." });
    }

    req.user = dbUser;
    next();
  } catch (error: any) {
    logger.error({ err: error }, "Auth middleware error");
    if (error.message.includes("is not defined")) {
      return res.status(503).json({ error: error.message });
    }
    res.status(500).json({ error: "Database error: Please run migrations and seed the database." });
  }
};

const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== Role.SUPER_ADMIN) {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }
  next();
};

// --- AUDIT LOGGING HELPER ---
const logAudit = async (actorId: string, action: string, targetType: string, targetId: string, oldValue?: any, newValue?: any) => {
  const prisma = getPrisma();
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      targetType,
      details: JSON.stringify({ targetType, targetId, oldValue, newValue }),
    },
  });
};

async function buildContentPreview(prisma: any, contentType: string, contentId: string) {
  try {
    if (contentType === "message") {
      const msg = await prisma.message.findUnique({
        where: { id: contentId },
        include: { from: { select: { name: true } }, to: { select: { name: true } } },
      });
      if (!msg) return null;
      return {
        title: `Message from ${msg.from?.name || "Unknown"} to ${msg.to?.name || "Unknown"}`,
        content: msg.content,
        authorName: msg.from?.name,
        extra: `Conversation between ${msg.from?.name} and ${msg.to?.name}`,
      };
    } else if (contentType === "question") {
      const q = await prisma.question.findUnique({
        where: { id: contentId },
        include: { intern: { select: { name: true } }, replies: true },
      });
      if (!q) return null;
      return {
        title: q.title,
        content: q.content,
        authorName: q.intern?.name,
        extra: `${q.replies?.length || 0} replies`,
      };
    } else if (contentType === "reply") {
      const r = await prisma.reply.findUnique({
        where: { id: contentId },
        include: { author: { select: { name: true } }, question: { select: { title: true } } },
      });
      if (!r) return null;
      return {
        title: `Reply to: ${r.question?.title || "Unknown question"}`,
        content: r.content,
        authorName: r.author?.name,
        extra: "Reply",
      };
    } else if (contentType === "daily_log") {
      const log = await prisma.dailyLog.findUnique({
        where: { id: contentId },
        include: { intern: { select: { name: true } } },
      });
      if (!log) return null;
      return {
        title: log.summary,
        content: log.changes,
        authorName: log.intern?.name,
        extra: `Technologies: ${(log.technologies || []).join(", ")}`,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function hideContent(prisma: any, contentType: string, contentId: string) {
  if (contentType === "message") {
    await prisma.message.update({ where: { id: contentId }, data: { isHidden: true } });
  } else if (contentType === "question") {
    await prisma.question.update({ where: { id: contentId }, data: { isHidden: true } });
  } else if (contentType === "reply") {
    await prisma.reply.update({ where: { id: contentId }, data: { isHidden: true } });
  } else if (contentType === "daily_log") {
    await prisma.dailyLog.update({ where: { id: contentId }, data: { isHidden: true } });
  }
}

// --- API ROUTES ---

// Public Config (Return public supabase settings for client-side Realtime & Auth)
app.get("/api/config", (req, res) => {
  res.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  });
});

// Auth Login / Direct Shortcut Login
app.post("/api/auth/login", validateBody(LoginSchema), async (req, res) => {
  const { email } = req.body;

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: "No account found with this email in the database" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "This account is inactive. Please contact your manager." });
    }

    res.json({ user: mapUser(user) });
  } catch (error: any) {
    logger.error({ err: error }, "Login endpoint error");
    res.status(500).json({ error: error.message });
  }
});

// Check if email already exists in the database
app.post("/api/auth/check-email", validateBody(CheckEmailSchema), async (req, res) => {
  const { email } = req.body;

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    res.json({ exists: !!user });
  } catch (error: any) {
    logger.error({ err: error }, "Check email endpoint error");
    res.status(500).json({ error: error.message });
  }
});

// Register a new user in the database
app.post("/api/auth/register", validateBody(RegisterUserSchema), async (req, res) => {
  const { id, email, name, role, techLeadId } = req.body;

  try {
    const prisma = getPrisma();
  const prismaRole = role.toUpperCase() as Role;
  if (prismaRole !== Role.INTERN && prismaRole !== Role.TECH_LEAD && prismaRole !== Role.MANAGER && prismaRole !== Role.SUPER_ADMIN) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

    // Double check email uniqueness in database
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return res.status(400).json({ error: "Email already registered in database" });
    }

    // Assign standard friendly placeholders as avatars
    const avatarUrl = prismaRole === Role.INTERN
      ? `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`
      : `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;

    const user = await prisma.user.create({
      data: {
        id: id || undefined,
        name,
        email: email.toLowerCase(),
        role: prismaRole,
        avatarUrl,
        techLeadId: prismaRole === Role.INTERN ? (techLeadId || null) : null,
        isActive: true,
      },
    });

    res.status(201).json({ user: mapUser(user) });
  } catch (error: any) {
    logger.error({ err: error }, "Registration endpoint error");
    res.status(500).json({ error: error.message });
  }
});

// Get Public Active Tech Leads (unauthenticated for registration dropdown)
app.get("/api/public/tech-leads", async (req, res) => {
  try {
    const prisma = getPrisma();
    const leads = await prisma.user.findMany({
      where: { role: Role.TECH_LEAD, isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(leads.map(mapUser));
  } catch (error: any) {
    logger.error({ err: error }, "Public tech-leads endpoint error");
    res.json([]);
  }
});

// Get Users with filtering
app.get("/api/users", authMiddleware, async (req, res) => {
  const { role, assigned_tech_lead_id } = req.query;
  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (role) {
      whereClause.role = String(role).toUpperCase();
    }
    if (assigned_tech_lead_id) {
      whereClause.techLeadId = String(assigned_tech_lead_id);
    }

    const dbUsers = await prisma.user.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    res.json(dbUsers.map(mapUser));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle working status (active/inactive)
app.post("/api/users/:id/status", authMiddleware, requireSuperAdmin, validateBody(ToggleUserStatusSchema), async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  try {
    const prisma = getPrisma();
    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) return res.status(404).json({ error: "User not found" });
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !!active },
    });
    const action = updated.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED";
    await logAudit((req as any).user.id, action, "USER", updated.id, { active: oldUser.isActive }, { active: updated.isActive });
    res.json(mapUser(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user details (role, name, assigned tech lead, active status)
app.patch("/api/users/:id", authMiddleware, requireSuperAdmin, validateBody(UpdateUserSchema), async (req, res) => {
  const { id } = req.params;
  const { name, role, assigned_tech_lead_id, active } = req.body;
  try {
    const prisma = getPrisma();
    const oldUser = await prisma.user.findUnique({ where: { id } });
    if (!oldUser) return res.status(404).json({ error: "User not found" });
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role.toUpperCase() as Role;
    if (assigned_tech_lead_id !== undefined) updateData.techLeadId = assigned_tech_lead_id || null;
    if (active !== undefined) updateData.isActive = !!active;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    const detailUpdates: any = {};
    if (name !== undefined) detailUpdates.name = { old: oldUser.name, new: updated.name };
    if (role !== undefined) detailUpdates.role = { old: oldUser.role, new: updated.role };
    if (assigned_tech_lead_id !== undefined) detailUpdates.techLeadId = { old: oldUser.techLeadId, new: updated.techLeadId };
    if (active !== undefined) detailUpdates.isActive = { old: oldUser.isActive, new: updated.isActive };
    const action = role !== undefined && oldUser.role !== updated.role ? "USER_ROLE_CHANGED" : (active !== undefined && oldUser.isActive !== updated.isActive ? (updated.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED") : "USER_UPDATED");
    await logAudit((req as any).user.id, action, "USER", updated.id, detailUpdates);
    res.json(mapUser(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Projects
app.get("/api/projects", authMiddleware, async (req, res) => {
  try {
    const prisma = getPrisma();
    const dbProjects = await prisma.project.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(dbProjects.map(mapProject));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update Project
app.post("/api/projects", authMiddleware, validateBody(ProjectSchema), async (req, res) => {
  const { id, name, description, github_url, tech_stack, owner_id, screenshots } = req.body;
  try {
    const prisma = getPrisma();
    if (id) {
      const updated = await prisma.project.update({
        where: { id },
        data: {
          name,
          description,
          githubUrl: github_url,
          techStack: tech_stack || [],
          screenshots: screenshots || [],
        },
      });
      return res.json(mapProject(updated));
    }

    const created = await prisma.project.create({
      data: {
        name,
        description,
        githubUrl: github_url,
        techStack: tech_stack || [],
        ownerId: owner_id,
        screenshots: screenshots || ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"],
      },
    });
    res.json(mapProject(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Daily Logs
app.get("/api/logs", authMiddleware, async (req, res) => {
  const { intern_id, project_id } = req.query;
  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }
    if (project_id) {
      whereClause.projectId = String(project_id);
    }

    const dbLogs = await prisma.dailyLog.findMany({
      where: { ...whereClause, isHidden: false },
      orderBy: { date: 'desc' },
    });

    res.json(dbLogs.map(mapDailyLog));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Daily Log with Base64 screenshot upload proxy
app.post("/api/logs", authMiddleware, validateBody(SubmitDailyLogSchema), async (req, res) => {
  const { intern_id, project_id, summary, technologies, changes, screenshot_url, github_url } = req.body;

  try {
    const prisma = getPrisma();
    const todayStr = getRelativeDateStr(0);

    // Upload to Supabase Storage if base64 screenshot is sent
    let resolvedScreenshotUrl = screenshot_url || null;
    if (screenshot_url && screenshot_url.startsWith('data:image/')) {
      try {
        resolvedScreenshotUrl = await uploadBase64Image(screenshot_url);
      } catch (err) {
        logger.warn({ err }, "Storage upload failed, keeping original base64/placeholder");
      }
    }

    // Check if they already submitted today
    const alreadySubmitted = await prisma.dailyLog.findFirst({
      where: {
        internId: intern_id,
        date: todayStr,
      },
    });

    if (alreadySubmitted) {
      const updated = await prisma.dailyLog.update({
        where: { id: alreadySubmitted.id },
        data: {
          summary,
          technologies: technologies || [],
          changes,
          screenshotUrl: resolvedScreenshotUrl || alreadySubmitted.screenshotUrl,
          githubUrl: github_url,
        },
      });
      return res.json(mapDailyLog(updated));
    }

    const created = await prisma.dailyLog.create({
      data: {
        internId: intern_id,
        projectId: project_id,
        summary,
        technologies: technologies || [],
        changes,
        screenshotUrl: resolvedScreenshotUrl,
        githubUrl: github_url,
        date: todayStr,
        status: 'submitted',
      },
    });

    res.json(mapDailyLog(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Review Log (Tech Lead reviews log, awards marks, flags blunders)
app.post("/api/logs/:id/review", authMiddleware, validateBody(ReviewLogSchema), async (req, res) => {
  const { id } = req.params;
  const { reviewer_id, score, comment, mistakesFlagged } = req.body;
  try {
    const prisma = getPrisma();
    const log = await prisma.dailyLog.findUnique({ where: { id } });
    if (!log) return res.status(404).json({ error: "Daily log not found" });

    // Update log status to reviewed
    const updatedLog = await prisma.dailyLog.update({
      where: { id },
      data: { status: 'reviewed' },
    });

    const todayStr = getRelativeDateStr(0);

    // Create Mark
    if (score !== undefined) {
      await prisma.mark.create({
        data: {
          internId: log.internId,
          givenById: reviewer_id,
          relatedLogId: log.id,
          score: Number(score),
          comment: comment || null,
          date: todayStr,
        }
      });
    }

    // Create Mistakes
    if (mistakesFlagged && Array.isArray(mistakesFlagged)) {
      for (const m of mistakesFlagged) {
        await prisma.mistake.create({
          data: {
            internId: log.internId,
            flaggedById: reviewer_id,
            relatedLogId: log.id,
            note: m.note,
            severity: String(m.severity).toUpperCase() as any,
            date: todayStr,
            resolved: false,
          }
        });
      }
    }

    res.json({ success: true, log: mapDailyLog(updatedLog) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Tasks
app.get("/api/tasks", authMiddleware, async (req, res) => {
  const { assigned_to, assigned_by } = req.query;
  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (assigned_to) {
      whereClause.assignedToId = String(assigned_to);
    }
    if (assigned_by) {
      whereClause.assignedById = String(assigned_by);
    }

    const dbTasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    res.json(dbTasks.map(mapTask));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper for GitHub URL validation
function isValidGithubUrl(url?: string): boolean {
  if (!url || !url.trim()) return true;
  const clean = url.trim();
  try {
    const parsed = new URL(clean);
    return (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com');
  } catch (e) {
    return false;
  }
}

// Assign / Create Task
app.post("/api/tasks", authMiddleware, validateBody(CreateTaskSchema), async (req, res) => {
  const { assigned_to, assigned_by, title, description, due_date, priority, blockers, pr_link } = req.body;

  if (pr_link && !isValidGithubUrl(pr_link)) {
    return res.status(400).json({ error: "Invalid PR link. Must be a valid GitHub URL (https://github.com/...)" });
  }

  try {
    const prisma = getPrisma();
    const created = await prisma.task.create({
      data: {
        assignedToId: assigned_to,
        assignedById: assigned_by,
        title,
        description,
        dueDate: due_date,
        priority: String(priority).toUpperCase() as any,
        status: TaskStatus.TODO,
        blockers: blockers || null,
        prLink: pr_link || null,
      } as any,
    });

    res.json(mapTask(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Task (Full CRUD)
app.put("/api/tasks/:id", authMiddleware, validateBody(UpdateTaskSchema), async (req, res) => {
  const { id } = req.params;
  const { title, description, due_date, priority, status, blockers, pr_link } = req.body;

  if (pr_link && !isValidGithubUrl(pr_link)) {
    return res.status(400).json({ error: "Invalid PR link. Must be a valid GitHub URL (https://github.com/...)" });
  }

  try {
    const prisma = getPrisma();
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Task not found" });

    const todayStr = getRelativeDateStr(0);
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (due_date !== undefined) updateData.dueDate = due_date;
    if (priority !== undefined) updateData.priority = String(priority).toUpperCase();
    if (blockers !== undefined) updateData.blockers = blockers;
    if (pr_link !== undefined) updateData.prLink = pr_link;
    if (status !== undefined) {
      const normalizedStatus = String(status).toUpperCase();
      updateData.status = normalizedStatus;
      updateData.completedAt = normalizedStatus === 'DONE' ? todayStr : null;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    res.json(mapTask(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Task Status with Server-Side Enforcement
app.post("/api/tasks/:id/status", authMiddleware, validateBody(TaskStatusSchema), async (req, res) => {
  const { id } = req.params;
  const { status, blockers, pr_link } = req.body;

  const validStatuses = ['todo', 'in_progress', 'done', 'TODO', 'IN_PROGRESS', 'DONE'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status transition. Allowed values: todo, in_progress, done" });
  }

  if (pr_link && !isValidGithubUrl(pr_link)) {
    return res.status(400).json({ error: "Invalid PR link. Must be a valid GitHub URL (https://github.com/...)" });
  }

  try {
    const prisma = getPrisma();
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Task not found" });

    const todayStr = getRelativeDateStr(0);
    const normalizedStatus = String(status).toUpperCase();

    // If moving to DONE, require valid GitHub PR URL if provided or already stored
    const finalPrLink = pr_link !== undefined ? pr_link : (existing as any).prLink;
    if (normalizedStatus === 'DONE' && finalPrLink && !isValidGithubUrl(finalPrLink)) {
      return res.status(400).json({ error: "To mark a task as Done, please provide a valid GitHub PR URL." });
    }

    const updateData: any = {
      status: normalizedStatus as any,
      completedAt: normalizedStatus === 'DONE' ? todayStr : null,
    };

    if (blockers !== undefined) updateData.blockers = blockers;
    if (pr_link !== undefined) updateData.prLink = pr_link;

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    res.json(mapTask(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Task (CRUD Delete)
app.delete("/api/tasks/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const prisma = getPrisma();
    await prisma.task.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Score Task Review
app.post("/api/tasks/:id/review", authMiddleware, validateBody(ScoreTaskSchema), async (req, res) => {
  const { id } = req.params;
  const { reviewer_id, score, comment } = req.body;
  try {
    const prisma = getPrisma();
    const todayStr = getRelativeDateStr(0);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        score: Number(score),
        comment: comment || null,
      },
    });

    await prisma.mark.create({
      data: {
        internId: updatedTask.assignedToId,
        givenById: reviewer_id,
        relatedTaskId: updatedTask.id,
        score: Number(score),
        comment: comment || null,
        date: todayStr,
      }
    });

    res.json(mapTask(updatedTask));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Marks
app.get("/api/marks", authMiddleware, async (req, res) => {
  const { intern_id } = req.query;
  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }
    const dbMarks = await prisma.mark.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
    res.json(dbMarks.map(mapMark));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Mistakes
app.get("/api/mistakes", authMiddleware, async (req, res) => {
  const { intern_id, resolved } = req.query;
  try {
    const prisma = getPrisma();
    const whereClause: any = {};
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }
    if (resolved !== undefined) {
      whereClause.resolved = resolved === 'true';
    }

    const dbMistakes = await prisma.mistake.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    res.json(dbMistakes.map(mapMistake));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve Mistake
app.post("/api/mistakes/:id/resolve", authMiddleware, validateBody(ResolveMistakeSchema), async (req, res) => {
  const { id } = req.params;
  const { resolved } = req.body;
  try {
    const prisma = getPrisma();
    const updated = await prisma.mistake.update({
      where: { id },
      data: { resolved: !!resolved },
    });
    res.json(mapMistake(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Chat Messages per conversation (intern <-> tech lead)
app.get("/api/messages", authMiddleware, async (req, res) => {
  const { user_a, user_b } = req.query;
  if (!user_a || !user_b) {
    return res.status(400).json({ error: "Missing parameters user_a or user_b" });
  }
  try {
    const prisma = getPrisma();
    const dbMsgs = await prisma.message.findMany({
      where: {
        OR: [
          { fromId: String(user_a), toId: String(user_b) },
          { fromId: String(user_b), toId: String(user_a) },
        ],
        isHidden: false,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(dbMsgs.map(mapMessage));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send Chat Message
app.post("/api/messages", authMiddleware, validateBody(SendMessageSchema), async (req, res) => {
  const { from_id, to_id, content } = req.body;
  try {
    const prisma = getPrisma();
    const created = await prisma.message.create({
      data: {
        fromId: from_id,
        toId: to_id,
        content,
      },
    });
    res.json(mapMessage(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages in conversation as read
app.post("/api/messages/read", authMiddleware, validateBody(ReadMessagesSchema), async (req, res) => {
  const { user_id, sender_id } = req.body; // user_id is the recipient, sender_id is the sender
  try {
    const prisma = getPrisma();
    await prisma.message.updateMany({
      where: {
        toId: String(user_id),
        fromId: String(sender_id),
        read: false,
      },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Threaded Questions with nested replies
app.get("/api/questions", authMiddleware, async (req, res) => {
  try {
    const prisma = getPrisma();
    const dbQs = await prisma.question.findMany({
      where: {
        isHidden: false,
      },
      include: {
        replies: {
          where: { isHidden: false },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(dbQs.map(mapQuestion));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ask Question
app.post("/api/questions", authMiddleware, validateBody(AskQuestionSchema), async (req, res) => {
  const { intern_id, title, content } = req.body;
  try {
    const prisma = getPrisma();
    const created = await prisma.question.create({
      data: {
        internId: intern_id,
        title,
        content,
      },
      include: { replies: true },
    });
    res.json(mapQuestion(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reply to Question
app.post("/api/questions/:id/replies", authMiddleware, validateBody(ReplyQuestionSchema), async (req, res) => {
  const { id } = req.params;
  const { user_id, content } = req.body;
  try {
    const prisma = getPrisma();
    await prisma.reply.create({
      data: {
        questionId: id,
        authorId: user_id,
        content,
      },
    });

    const updatedQ = await prisma.question.findUnique({
      where: { id },
      include: {
        replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    res.json(mapQuestion(updatedQ));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Analytics (Rich aggregated dashboard data)
app.get("/api/analytics", authMiddleware, async (req, res) => {
  const { tech_lead_id } = req.query;
  try {
    const prisma = getPrisma();

    // 1. Get all interns
    const internsClause: any = { role: Role.INTERN };
    if (tech_lead_id) {
      internsClause.techLeadId = String(tech_lead_id);
    }
    const targetInterns = await prisma.user.findMany({
      where: internsClause,
    });
    const internIds = targetInterns.map(i => i.id);

    // 2. Fetch datasets
    const todayStr = getRelativeDateStr(0);
    const allLogs = await prisma.dailyLog.findMany({
      where: { internId: { in: internIds }, isHidden: false },
    });
    const allMarks = await prisma.mark.findMany({
      where: { internId: { in: internIds } },
    });
    const allTasks = await prisma.task.findMany({
      where: { assignedToId: { in: internIds } },
    });
    const allMistakes = await prisma.mistake.findMany({
      where: { internId: { in: internIds } },
    });
    const todaySessions = await (prisma as any).daySession.findMany({
      where: { date: todayStr }
    });

    // 3. High level stats
    const submittedTodayCount = allLogs.filter(l => l.date === todayStr).length;
    const complianceRate = targetInterns.length > 0 ? Math.round((submittedTodayCount / targetInterns.length) * 100) : 0;
    const avgMarks = allMarks.length > 0 ? parseFloat((allMarks.reduce((acc, curr) => acc + curr.score, 0) / allMarks.length).toFixed(1)) : 0;
    const totalLogs = allLogs.length;
    const activeCount = targetInterns.filter(u => u.isActive).length;
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === TaskStatus.DONE).length;

    // 4. Roster data per intern
    const rosterData = targetInterns.map(intern => {
      const iLogs = allLogs.filter(l => l.internId === intern.id);
      const iMarks = allMarks.filter(m => m.internId === intern.id);
      const iTasks = allTasks.filter(t => t.assignedToId === intern.id);
      const iMistakes = allMistakes.filter(m => m.internId === intern.id);
      const iTodaySession = todaySessions.find(s => s.internId === intern.id);

      const lastSub = iLogs.length > 0 ? iLogs.sort((a, b) => b.date.localeCompare(a.date))[0].date : "Never";
      const iAvgMark = iMarks.length > 0 ? parseFloat((iMarks.reduce((acc, curr) => acc + curr.score, 0) / iMarks.length).toFixed(1)) : 0;

      return {
        intern: {
          id: intern.id,
          name: intern.name,
          email: intern.email,
          avatar: intern.avatarUrl,
          active: intern.isActive,
          assigned_tech_lead_id: intern.techLeadId || undefined,
        },
        lastSubmission: lastSub,
        streak: calculateStreak(iLogs),
        avgMark: iAvgMark,
        totalTasks: iTasks.length,
        completedTasks: iTasks.filter(t => t.status === TaskStatus.DONE).length,
        unresolvedMistakesCount: iMistakes.filter(m => !m.resolved).length,
        todaySession: mapDaySession(iTodaySession),
      };
    });

    // 5. Last 7 days Trends
    const last7Days = Array.from({ length: 7 }, (_, idx) => getRelativeDateStr(-idx)).reverse();
    const submissionTrend = last7Days.map(dateStr => {
      const subsCount = allLogs.filter(l => l.date === dateStr).length;
      return {
        date: dateStr,
        count: subsCount,
      };
    });

    const marksTrend = last7Days.map(dateStr => {
      const marksOnDate = allMarks.filter(m => m.date === dateStr);
      const avgScore = marksOnDate.length > 0 ? parseFloat((marksOnDate.reduce((acc, curr) => acc + curr.score, 0) / marksOnDate.length).toFixed(1)) : 0;
      return {
        date: dateStr,
        score: avgScore,
      };
    });

    // 6. Technology distribution
    const techCounts: Record<string, number> = {};
    allLogs.forEach(l => {
      l.technologies.forEach(tech => {
        techCounts[tech] = (techCounts[tech] || 0) + 1;
      });
    });
    const mostUsedTechs = Object.entries(techCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({
      complianceRate,
      avgMarks,
      totalLogs,
      activeCount,
      totalTasks,
      completedTasks,
      rosterData,
      submissionTrend,
      marksTrend,
      mostUsedTechs,
    });
  } catch (error: any) {
    logger.error({ err: error }, "Analytics endpoint error");
    res.status(500).json({ error: error.message });
  }
});

// --- DAY SESSION ENDPOINTS (Start Day / End Day) ---

// Get Today's Day Sessions
app.get("/api/day-sessions/today", authMiddleware, async (req, res) => {
  const { intern_id } = req.query;
  try {
    const prisma: any = getPrisma();
    const todayStr = getRelativeDateStr(0);
    const whereClause: any = { date: todayStr };
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }
    const dbSessions = await prisma.daySession.findMany({ where: whereClause });
    res.json(dbSessions.map(mapDaySession));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start Day
app.post("/api/day-sessions/start", authMiddleware, validateBody(StartDaySchema), async (req, res) => {
  const { intern_id, today_project, today_plan, questions, git_link } = req.body;

  try {
    const prisma: any = getPrisma();
    const todayStr = getRelativeDateStr(0);
    
    // Check if session exists today
    const existing = await prisma.daySession.findFirst({
      where: { internId: intern_id, date: todayStr }
    });

    if (existing) {
      const updated = await prisma.daySession.update({
        where: { id: existing.id },
        data: {
          todayProject: today_project || existing.todayProject,
          todayPlan: today_plan || existing.todayPlan,
          questions: questions || existing.questions,
          gitLink: git_link || existing.gitLink,
        }
      });
      return res.json(mapDaySession(updated));
    }

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const created = await prisma.daySession.create({
      data: {
        internId: intern_id,
        date: todayStr,
        startedAt: timeStr,
        status: 'active',
        todayProject: today_project || null,
        todayPlan: today_plan || null,
        questions: questions || null,
        gitLink: git_link || null,
      }
    });

    try {
      await prisma.user.update({
        where: { id: intern_id },
        data: { isActive: true }
      });
    } catch (e) {
      // Ignore if user update fails
    }

    res.json(mapDaySession(created));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// End Day
app.post("/api/day-sessions/end", authMiddleware, validateBody(EndDaySchema), async (req, res) => {
  const { intern_id, end_journal } = req.body;

  try {
    const prisma: any = getPrisma();
    const todayStr = getRelativeDateStr(0);

    const existing = await prisma.daySession.findFirst({
      where: { internId: intern_id, date: todayStr }
    });

    if (!existing) {
      return res.status(404).json({ error: "No active day session found for today" });
    }

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const updated = await prisma.daySession.update({
      where: { id: existing.id },
      data: {
        endedAt: timeStr,
        status: 'completed',
        endJournal: end_journal || null
      }
    });

    try {
      await prisma.user.update({
        where: { id: intern_id },
        data: { isActive: false }
      });
    } catch (e) {
      // Ignore if user update fails
    }

    res.json(mapDaySession(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- SUPERADMIN ENDPOINTS ---

// Get all audit logs
app.get("/api/superadmin/audit-logs", authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const { action, targetType, userId, actorId, startDate, endDate, limit = "50", offset = "0" } = req.query;

    const where: any = {};
    if (action && typeof action === "string") where.action = action;
    if (targetType && typeof targetType === "string") where.targetType = targetType;
    if (userId && typeof userId === "string") where.userId = userId;
    if (actorId && typeof actorId === "string") where.userId = actorId;
    if (startDate && typeof startDate === "string") where.timestamp = { ...(where.timestamp || {}), gte: new Date(startDate as string) };
    if (endDate && typeof endDate === "string") where.timestamp = { ...(where.timestamp || {}), lte: new Date(endDate as string) };

    const parsedLimit = Math.min(Number(limit) || 50, 200);
    const parsedOffset = Number(offset) || 0;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        include: { user: true },
        take: parsedLimit,
        skip: parsedOffset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs: logs.map(mapAuditLog), total, limit: parsedLimit, offset: parsedOffset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs summary (weekly most active actors)
app.get("/api/superadmin/audit-logs/summary", authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const summary = await prisma.$queryRaw`
      SELECT "userId" as "actorId", u.name as "actorName", COUNT(*) as count
      FROM "AuditLog"
      JOIN "User" u ON "AuditLog"."userId" = u.id
      WHERE "AuditLog"."timestamp" >= ${oneWeekAgo}
      GROUP BY "AuditLog"."userId", u.name
      ORDER BY count DESC
      LIMIT 10
    `;

    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create content flag
app.post("/api/content-flags", authMiddleware, validateBody(CreateContentFlagSchema), async (req, res) => {
  const { contentType, contentId, reason } = req.body;
  try {
    const prisma = getPrisma();
    const user = (req as any).user;

    // Fetch the content to check author and scope
    let contentAuthorId: string | null = null;
    const contentTypeLower = contentType.toLowerCase();

    if (contentTypeLower === "message") {
      const msg = await prisma.message.findUnique({ where: { id: contentId } });
      if (msg) contentAuthorId = msg.fromId;
    } else if (contentTypeLower === "question") {
      const q = await prisma.question.findUnique({ where: { id: contentId } });
      if (q) contentAuthorId = q.internId;
    } else if (contentTypeLower === "reply") {
      const r = await prisma.reply.findUnique({ where: { id: contentId } });
      if (r) contentAuthorId = r.authorId;
    } else if (contentTypeLower === "daily_log") {
      const log = await prisma.dailyLog.findUnique({ where: { id: contentId } });
      if (log) contentAuthorId = log.internId;
    }

    if (!contentAuthorId) {
      return res.status(404).json({ error: "Content not found" });
    }

    // Self-flagging prevention
    if (user.id === contentAuthorId) {
      return res.status(400).json({ error: "You cannot flag your own content" });
    }

    // Duplicate flagging prevention (same user + same content + pending status)
    const existing = await prisma.contentFlag.findFirst({
      where: {
        userId: user.id,
        contentId,
        contentType: contentTypeLower,
        status: "pending",
      },
    });
    if (existing) {
      return res.status(400).json({ error: "You have already flagged this content" });
    }

    const flag = await prisma.contentFlag.create({
      data: {
        userId: user.id,
        contentId,
        contentType: contentTypeLower,
        reason,
        status: "pending",
      },
    });

    await logAudit(user.id, "CONTENT_FLAG_CREATED", contentType.toUpperCase(), contentId, undefined, { reason });

    res.status(201).json(mapContentFlag(flag));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get content flags for SuperAdmin moderation queue
app.get("/api/superadmin/content-flags", authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const { status, contentType, limit = "50", offset = "0" } = req.query;

    const where: any = {};
    if (status && typeof status === "string") where.status = status;
    if (contentType && typeof contentType === "string") where.contentType = contentType.toLowerCase();

    const parsedLimit = Math.min(Number(limit) || 50, 200);
    const parsedOffset = Number(offset) || 0;

    const [flags, total] = await Promise.all([
      prisma.contentFlag.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { user: true },
        take: parsedLimit,
        skip: parsedOffset,
      }),
      prisma.contentFlag.count({ where }),
    ]);

    // Build preview data for each flag
    const flagsWithPreview = await Promise.all(
      flags.map(async (flag) => {
        const preview = await buildContentPreview(prisma, flag.contentType, flag.contentId);
        return { ...mapContentFlag(flag), preview };
      })
    );

    res.json({ flags: flagsWithPreview, total, limit: parsedLimit, offset: parsedOffset });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update content flag status (dismiss or resolve)
app.patch("/api/superadmin/content-flags/:id", authMiddleware, requireSuperAdmin, validateBody(UpdateContentFlagStatusSchema), async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  try {
    const prisma = getPrisma();
    const user = (req as any).user;

    const flag = await prisma.contentFlag.update({
      where: { id },
      data: {
        status: action === "resolve" ? "resolved" : "dismissed",
        ...(action === "resolve" ? { resolvedAt: new Date() } : { dismissedAt: new Date() }),
      },
    });

    // If resolving, hide the underlying content
    if (action === "resolve") {
      await hideContent(prisma, flag.contentType, flag.contentId);
      await logAudit(user.id, "CONTENT_FLAG_RESOLVED", flag.contentType.toUpperCase(), flag.contentId, { isHidden: false }, { isHidden: true });
    } else {
      await logAudit(user.id, "CONTENT_FLAG_DISMISSED", flag.contentType.toUpperCase(), flag.contentId);
    }

    const preview = await buildContentPreview(prisma, flag.contentType, flag.contentId);
    res.json({ ...mapContentFlag(flag), preview });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get system settings (public — lightweight read for any authenticated user)
app.get("/api/settings", authMiddleware, async (req, res) => {
  try {
    const prisma = getPrisma();
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
    const result: Record<string, any> = {};
    for (const s of settings) {
      let parsed: any = s.value;
      if (s.value === 'true') parsed = true;
      else if (s.value === 'false') parsed = false;
      else if (!isNaN(Number(s.value)) && s.value.trim() !== '') parsed = Number(s.value);
      result[s.key] = parsed;
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get system settings (SuperAdmin only — full detail)
app.get("/api/superadmin/system-settings", authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();
    const settings = await prisma.systemSetting.findMany({
      include: { updater: true },
      orderBy: { key: 'asc' },
    });
    res.json(settings.map(mapSystemSetting));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update system setting
app.put("/api/superadmin/system-settings/:key", authMiddleware, requireSuperAdmin, async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    const prisma = getPrisma();
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    const oldValue = existing?.value;

    // Type-aware validation and coercion
    let coercedValue: string;
    if (key === 'allow_new_registrations' || key === 'ask_the_team_enabled') {
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return res.status(400).json({ error: `Setting "${key}" expects a boolean value` });
      }
      coercedValue = String(typeof value === 'boolean' ? value : value === 'true');
    } else if (key === 'marking_scale') {
      if (value !== '1-5' && value !== '1-10') {
        return res.status(400).json({ error: 'marking_scale must be "1-5" or "1-10"' });
      }
      coercedValue = value;
    } else {
      // Generic string setting
      if (typeof value !== 'string') {
        return res.status(400).json({ error: 'Setting value must be a string' });
      }
      coercedValue = value;
    }

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: coercedValue,
        updatedBy: (req as any).user.id,
      },
      create: {
        key,
        value: coercedValue,
        updatedBy: (req as any).user.id,
      },
    });

    await logAudit(
      (req as any).user.id,
      'SETTING_UPDATED',
      'SYSTEM_SETTING',
      key,
      { value: oldValue },
      { value: coercedValue }
    );

    res.json(mapSystemSetting(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get superadmin overview analytics
app.get("/api/superadmin/overview", authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const prisma = getPrisma();

    // 1. Total users per role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
      orderBy: { role: 'asc' },
    });

    // 2. Active vs inactive intern count
    const activeInterns = await prisma.user.count({
      where: { role: Role.INTERN, isActive: true },
    });
    const inactiveInterns = await prisma.user.count({
      where: { role: Role.INTERN, isActive: false },
    });
    const totalInterns = activeInterns + inactiveInterns;

    // 3. Submission compliance for active interns
    const todayStr = getRelativeDateStr(0);
    const activeInternIds = (await prisma.user.findMany({
      where: { role: Role.INTERN, isActive: true },
      select: { id: true },
    })).map(u => u.id);

    const logsToday = await prisma.dailyLog.count({
      where: { internId: { in: activeInternIds }, date: todayStr, isHidden: false },
    });
    const thisWeekStr = getRelativeDateStr(-7);
    const logsThisWeek = await prisma.dailyLog.count({
      where: { internId: { in: activeInternIds }, date: { gte: thisWeekStr }, isHidden: false },
    });
    const submissionComplianceToday = activeInterns > 0 ? Math.round((logsToday / activeInterns) * 100) : 0;
    const submissionComplianceWeek = activeInterns > 0 ? Math.round((logsThisWeek / (activeInterns * 7)) * 100) : 0;

    // 4. Marks distribution — average and histogram
    const allMarks = activeInternIds.length > 0
      ? await prisma.mark.findMany({
          where: { internId: { in: activeInternIds }, score: { not: null } },
          select: { score: true },
        })
      : [];
    const avgMark = allMarks.length > 0
      ? parseFloat((allMarks.reduce((a, m) => a + (m.score || 0), 0) / allMarks.length).toFixed(1))
      : 0;
    const marksHistogram = [
      { range: '1-2', count: allMarks.filter(m => (m.score || 0) <= 2).length },
      { range: '3', count: allMarks.filter(m => m.score === 3).length },
      { range: '4-5', count: allMarks.filter(m => (m.score || 0) >= 4).length },
    ];

    // 5. Most-used technologies (top 5)
    const allLogs = activeInternIds.length > 0
      ? await prisma.dailyLog.findMany({
          where: { internId: { in: activeInternIds }, isHidden: false },
          select: { technologies: true },
        })
       : [];

    const techCounts: Record<string, number> = {};
    allLogs.forEach(l => {
      (l.technologies || []).forEach((tech: string) => {
        techCounts[tech] = (techCounts[tech] || 0) + 1;
      });
    });
    const mostUsedTechs = Object.entries(techCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 6. Pending content moderation count
    const pendingFlags = await prisma.contentFlag.count({
      where: { status: 'pending' },
    });

    // 7. Last 10 audit log entries
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: { user: true },
    });

    res.json({
      usersByRole,
      activeInterns,
      inactiveInterns,
      totalInterns,
      submissionComplianceToday,
      submissionComplianceWeek,
      avgMark,
      marksHistogram,
      mostUsedTechs,
      pendingFlags,
      recentAuditLogs: recentAuditLogs.map(mapAuditLog),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create user by SuperAdmin (manager or tech_lead)
app.post("/api/superadmin/users", authMiddleware, requireSuperAdmin, validateBody(CreateUserBySuperAdminSchema), async (req, res) => {
  const { name, email, role, techLeadId } = req.body;
  try {
    const prisma = getPrisma();
    const prismaRole = role.toUpperCase() as Role;
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return res.status(400).json({ error: "Email already registered in database" });
    }
    const avatarUrl = `https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role: prismaRole,
        avatarUrl,
        techLeadId: null,
        isActive: true,
      },
    });
    await logAudit((req as any).user.id, "USER_CREATED", "USER", user.id, undefined, { name, email, role: prismaRole });
    res.status(201).json({ user: mapUser(user) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reassign Tech Lead for an Intern
app.patch("/api/superadmin/users/:id/reassign-tech-lead", authMiddleware, requireSuperAdmin, validateBody(ReassignTechLeadSchema), async (req, res) => {
  const { id } = req.params;
  const { techLeadId } = req.body;
  try {
    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    if (targetUser.role !== Role.INTERN) {
      return res.status(400).json({ error: "Target user must be an Intern" });
    }
    if (techLeadId) {
      const lead = await prisma.user.findUnique({ where: { id: techLeadId } });
      if (!lead || lead.role !== Role.TECH_LEAD || !lead.isActive) {
        return res.status(400).json({ error: "Invalid or inactive Tech Lead" });
      }
    }
    const oldTechLeadId = targetUser.techLeadId;
    const updated = await prisma.user.update({
      where: { id },
      data: { techLeadId: techLeadId || null },
    });
    await logAudit((req as any).user.id, "USER_REASSIGNED", "USER", updated.id, { techLeadId: oldTechLeadId }, { techLeadId: updated.techLeadId });
    res.json(mapUser(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Global Express Error Handler Middleware (prevents raw stack traces)
app.use((err: any, req: any, res: any, next: any) => {
  logger.error({ err }, "Global express error");
  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected error occurred on the server.";
  res.status(status).json({ error: message });
});

// --- VITE MIDDLEWARE SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

startServer();
