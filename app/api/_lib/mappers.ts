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
    assigned_to: dbTask.assignedToId,
    assigned_by: dbTask.assignedById,
    title: dbTask.title,
    description: dbTask.description,
    due_date: dbTask.dueDate,
    priority: String(dbTask.priority).toLowerCase(),
    status: String(dbTask.status).toLowerCase(),
    completed_at: dbTask.completedAt || undefined,
    score: dbTask.score || undefined,
    comment: dbTask.comment || undefined,
    blockers: dbTask.blockers || undefined,
    pr_link: dbTask.prLink || undefined,
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

export function mapMessage(dbMsg: any) {
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

export function mapQuestion(dbQ: any) {
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

export function buildContentPreview(prisma: any, contentType: string, contentId: string) {
  return (async () => {
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
  })();
}

export async function hideContent(prisma: any, contentType: string, contentId: string) {
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

export async function logAudit(prisma: any, actorId: string, action: string, targetType: string, targetId: string, oldValue?: any, newValue?: any) {
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      targetType,
      details: JSON.stringify({ targetType, targetId, oldValue, newValue }),
    },
  });
}