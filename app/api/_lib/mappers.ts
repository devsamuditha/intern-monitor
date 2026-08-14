export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  username: true,
  role: true,
  avatarUrl: true,
  techLeadId: true,
  organizationId: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
};

export const AUTH_USER_SELECT = {
  ...SAFE_USER_SELECT,
  passwordHash: true,
};

export function mapUser(dbUser: any) {
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    username: dbUser.username,
    role: dbUser.role.toLowerCase(),
    avatar: dbUser.avatarUrl,
    assigned_tech_lead_id: dbUser.techLeadId || undefined,
    mustChangePassword: dbUser.mustChangePassword,
    organizationId: dbUser.organizationId || undefined,
  };
}

export function mapProject(dbProj: any) {
  if (!dbProj) return null;
  return {
    id: dbProj.id,
    name: dbProj.name,
    description: dbProj.description,
    github_url: dbProj.githubUrl,
    tech_stack: dbProj.techStack,
    owner_id: dbProj.ownerId,
    owner_name: dbProj.owner?.name || undefined,
    screenshots: dbProj.screenshots || [],
    status: dbProj.status ? dbProj.status.toLowerCase() : 'active',
    start_date: dbProj.startDate ? dbProj.startDate.toISOString() : undefined,
    end_date: dbProj.endDate ? dbProj.endDate.toISOString() : undefined,
    assigned_tech_lead_ids: dbProj.assignedTechLeadIds || [],
    assigned_intern_ids: dbProj.assignedInternIds || [],
  };
}

export function mapDailyLog(dbLog: any) {
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
    status: dbLog.status,
  };
}

export function mapTask(dbTask: any) {
  if (!dbTask) return null;
  return {
    id: dbTask.id,
    assigned_to: dbTask.assignedToId || undefined,
    assigned_by: dbTask.assignedById,
    title: dbTask.title,
    description: dbTask.description,
    due_date: dbTask.dueDate,
    priority: String(dbTask.priority).toLowerCase(),
    status: String(dbTask.status).toLowerCase(),
    started_at: dbTask.startedAt || undefined,
    completed_at: dbTask.completedAt || undefined,
    score: dbTask.score || undefined,
    comment: dbTask.comment || undefined,
    blockers: dbTask.blockers || undefined,
    pr_link: dbTask.prLink || undefined,
    self_score: dbTask.selfScore || undefined,
    self_comment: dbTask.selfComment || undefined,
    completed_description: dbTask.completedDescription || undefined,
    assigned_tech_lead_ids: dbTask.assignedTechLeadIds || undefined,
    pending_acceptance: dbTask.pendingAcceptance || undefined,
    accepted_at: dbTask.acceptedAt ? dbTask.acceptedAt.toISOString() : undefined,
    created_at: dbTask.createdAt ? dbTask.createdAt.toISOString() : undefined,
  };
}

export function mapMark(dbMark: any) {
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

export function mapMistake(dbMistake: any) {
  if (!dbMistake) return null;
  return {
    id: dbMistake.id,
    intern_id: dbMistake.internId,
    flagged_by: dbMistake.flaggedById,
    related_log_id: dbMistake.relatedLogId,
    note: dbMistake.note,
    severity: dbMistake.severity.toLowerCase(),
    date: dbMistake.date,
    resolved: dbMistake.resolved,
  };
}

const LATE_THRESHOLD_MINUTES = 9 * 60 + 30;

export function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function mapDaySession(dbSession: any) {
  if (!dbSession) return null;
  const isLate = dbSession.startedAt
    ? parseTimeToMinutes(dbSession.startedAt) > LATE_THRESHOLD_MINUTES
    : false;
  return {
    id: dbSession.id,
    intern_id: dbSession.internId,
    date: dbSession.date,
    started_at: dbSession.startedAt,
    ended_at: dbSession.endedAt || undefined,
    status: dbSession.status,
    is_late: isLate,
    today_project: dbSession.todayProject || undefined,
    today_plan: dbSession.todayPlan || undefined,
    questions: dbSession.questions || undefined,
    git_link: dbSession.gitLink || undefined,
    end_journal: dbSession.endJournal || undefined,
    earlyExitRequested: dbSession.earlyExitRequested || undefined,
    earlyExitReason: dbSession.earlyExitReason || undefined,
    earlyExitApproved: dbSession.earlyExitApproved || undefined,
    missedFinalJournal: dbSession.missedFinalJournal || undefined,
  };
}

export function mapAuditLog(dbLog: any) {
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

export function mapSystemSetting(dbSetting: any) {
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

export function mapContentFlag(dbFlag: any) {
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

export function getRelativeDateStr(offsetDays: number): string {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 5.5 * 3600000);
  istDate.setDate(istDate.getDate() + offsetDays);
  return istDate.toISOString().split('T')[0];
}

export function isValidGithubUrl(url?: string): boolean {
  if (!url || !url.trim()) return true;
  const clean = url.trim();
  try {
    const parsed = new URL(clean);
    return parsed.hostname === "github.com" || parsed.hostname === "www.github.com";
  } catch (e) {
    return false;
  }
}

export async function buildContentPreview(prisma: any, contentType: string, contentId: string, organizationId?: string) {
  try {
    const orgFilter = organizationId ? { organizationId } : {};
    if (contentType === "daily_log") {
      const log = await prisma.dailyLog.findUnique({
        where: { id: contentId, ...orgFilter },
        select: { summary: true, changes: true, technologies: true, intern: { select: { name: true } } },
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

export async function hideContent(prisma: any, contentType: string, contentId: string, organizationId?: string) {
  const orgFilter = organizationId ? { organizationId } : {};
  if (contentType === "daily_log") {
    await prisma.dailyLog.update({ where: { id: contentId, ...orgFilter }, data: { isHidden: true } });
  }
}

export async function logAudit(prisma: any, actorId: string, action: string, targetType: string, targetId: string, oldValue?: any, newValue?: any, organizationId?: string) {
  let orgId = organizationId;
  if (!orgId && actorId) {
    try {
      const actor = await prisma.user.findUnique({
        where: { id: actorId },
        select: { organizationId: true },
      });
      orgId = actor?.organizationId || undefined;
    } catch {
      // ignore lookup error
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      targetType,
      details: JSON.stringify({ targetType, targetId, oldValue, newValue }),
      organizationId: orgId || null,
    },
  });
}