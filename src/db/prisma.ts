import { PrismaClient, Role, TaskStatus, TaskPriority, MistakeSeverity } from '@prisma/client';

let prisma: PrismaClient | null = null;

// --- IN-MEMORY FALLBACK DATABASE ---
class MockPrismaClient {
  private users: any[] = [];
  private projects: any[] = [];
  private dailyLogs: any[] = [];
  private tasks: any[] = [];
  private marks: any[] = [];
  private mistakes: any[] = [];
  private messages: any[] = [];
  private questions: any[] = [];
  private replies: any[] = [];
  private daySessions: any[] = [];

  constructor() {
    this.seedInMemoryDb();
  }

  private getRelativeDateStr(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

private seedInMemoryDb() {
    console.log("Initializing interactive in-memory fallback database... 🌱");

     this.users = [
       { id: "m-elena", name: "Elena Rostova", email: "elena@manager.com", role: Role.MANAGER, avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", isActive: true },
       { id: "tl-alex", name: "Alex Rivera", email: "alex@techlead.com", role: Role.TECH_LEAD, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", isActive: true },
       { id: "tl-jordan", name: "Jordan Vance", email: "jordan@techlead.com", role: Role.TECH_LEAD, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", isActive: true },
       { id: "int-sam", name: "Sam Chen", email: "sam@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-alex", isActive: true },
       { id: "int-liam", name: "Liam O'Connor", email: "liam@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-alex", isActive: true },
       { id: "int-sophia", name: "Sophia Martinez", email: "sophia@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-alex", isActive: true },
       { id: "int-maya", name: "Maya Lin", email: "maya@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-jordan", isActive: true },
       { id: "int-ethan", name: "Ethan Hunt", email: "ethan@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-jordan", isActive: true },
       { id: "int-zoe", name: "Zoe Taylor", email: "zoe@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-jordan", isActive: true },
       { id: "sa-root", name: "Super Admin", email: "superadmin@company.com", role: Role.SUPER_ADMIN, avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", isActive: true },
     ];

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    this.projects = [
      { id: "p-1", name: "Frontend Redesign", description: "Redesign the internal dashboard UI", githubUrl: "https://github.com/acme/frontend-redesign", techStack: ["React", "Tailwind"], ownerId: "tl-alex", screenshots: [], createdAt: new Date("2026-06-01") },
      { id: "p-2", name: "API Gateway", description: "Build the new API gateway service", githubUrl: "https://github.com/acme/api-gateway", techStack: ["Node.js", "Express"], ownerId: "tl-jordan", screenshots: [], createdAt: new Date("2026-06-10") },
      { id: "p-3", name: "Data Pipeline", description: "ETL pipeline for reporting", githubUrl: "https://github.com/acme/data-pipeline", techStack: ["Python", "Airflow"], ownerId: "m-elena", screenshots: [], createdAt: new Date("2026-05-15") },
    ];

    this.dailyLogs = [
      { id: "log-1", internId: "int-sam", projectId: "p-1", summary: "Implemented responsive layout for dashboard", technologies: ["React", "Tailwind"], changes: "- Fixed sidebar navigation responsiveness\n- Added dark mode toggle support", screenshotUrl: undefined, githubUrl: "https://github.com/sam/frontend-redesign/commit/abc123", date: today, status: "submitted", isHidden: false, createdAt: new Date() },
      { id: "log-2", internId: "int-sam", projectId: "p-1", summary: "Set up CI/CD pipeline for frontend", technologies: ["GitHub Actions", "Docker"], changes: "- Added GitHub Actions workflow\n- Configured Docker build for staging", screenshotUrl: undefined, githubUrl: "https://github.com/sam/frontend-redesign/commit/def456", date: yesterday, status: "reviewed", isHidden: false, createdAt: new Date(Date.now() - 86400000) },
      { id: "log-3", internId: "int-sophia", projectId: "p-1", summary: "Built component library primitives", technologies: ["React", "Storybook"], changes: "- Created Button and Input primitives\n- Added theme variants", screenshotUrl: undefined, githubUrl: "https://github.com/sophia/frontend-redesign/commit/ghi789", date: today, status: "submitted", isHidden: false, createdAt: new Date() },
      { id: "log-4", internId: "int-liam", projectId: "p-1", summary: "Investigated accessibility issues", technologies: ["React", "axe-core"], changes: "- Fixed color contrast on buttons\n- Added ARIA labels to form fields", screenshotUrl: undefined, githubUrl: "https://github.com/liam/frontend-redesign/commit/jkl012", date: lastWeek, status: "reviewed", isHidden: false, createdAt: new Date(Date.now() - 14 * 86400000) },
      { id: "log-5", internId: "int-maya", projectId: "p-2", summary: "Implemented rate limiting middleware", technologies: ["Node.js", "Express"], changes: "- Added rate limiter middleware\n- Configured per-route limits", screenshotUrl: undefined, githubUrl: "https://github.com/maya/api-gateway/commit/mno345", date: today, status: "submitted", isHidden: false, createdAt: new Date() },
      { id: "log-6", internId: "int-maya", projectId: "p-2", summary: "Set up error logging and alerting", technologies: ["Node.js", "Sentry"], changes: "- Integrated Sentry for error tracking\n- Added alert webhook", screenshotUrl: undefined, githubUrl: "https://github.com/maya/api-gateway/commit/pqr678", date: yesterday, status: "reviewed", isHidden: false, createdAt: new Date(Date.now() - 86400000) },
      { id: "log-7", internId: "int-zoe", projectId: "p-2", summary: "Refactored auth middleware", technologies: ["Node.js", "JWT"], changes: "- Modularized auth check logic\n- Added token refresh handling", screenshotUrl: undefined, githubUrl: "https://github.com/zoe/api-gateway/commit/stu901", date: today, status: "submitted", isHidden: false, createdAt: new Date() },
      { id: "log-8", internId: "int-ethan", projectId: "p-2", summary: "Wrote API documentation", technologies: ["Swagger", "OpenAPI"], changes: "- Documented all endpoints\n- Added usage examples", screenshotUrl: undefined, githubUrl: "https://github.com/ethan/api-gateway/commit/vwx234", date: lastWeek, status: "reviewed", isHidden: false, createdAt: new Date(Date.now() - 14 * 86400000) },
    ];

    this.tasks = [
      { id: "task-1", assignedToId: "int-sam", assignedById: "tl-alex", title: "Build notification drawer component", description: "Create a notification drawer that shows real-time alerts", dueDate: today, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, completedAt: null, score: null, comment: null, blockers: null, prLink: null, createdAt: new Date() },
      { id: "task-2", assignedToId: "int-sam", assignedById: "tl-alex", title: "Fix mobile nav crash on iOS", description: "Investigate and fix the sidebar crash on iOS Safari", dueDate: yesterday, priority: TaskPriority.HIGH, status: TaskStatus.DONE, completedAt: yesterday, score: 5, comment: "Great fix, clean implementation", blockers: null, prLink: "https://github.com/sam/frontend-redesign/commit/xyz", createdAt: new Date(Date.now() - 2 * 86400000) },
      { id: "task-3", assignedToId: "int-sophia", assignedById: "tl-alex", title: "Add theme switcher persistence", description: "Persist theme preference to localStorage", dueDate: today, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, completedAt: null, score: null, comment: null, blockers: null, prLink: null, createdAt: new Date() },
      { id: "task-4", assignedToId: "int-maya", assignedById: "tl-jordan", title: "Add pagination to logs API", description: "Implement cursor-based pagination for the daily logs endpoint", dueDate: today, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, completedAt: null, score: null, comment: null, blockers: null, prLink: null, createdAt: new Date() },
      { id: "task-5", assignedToId: "int-zoe", assignedById: "tl-jordan", title: "Write unit tests for auth module", description: "Cover all auth middleware functions with unit tests", dueDate: lastWeek, priority: TaskPriority.LOW, status: TaskStatus.DONE, completedAt: lastWeek, score: 4, comment: "Solid coverage, good edge case handling", blockers: null, prLink: "https://github.com/zoe/api-gateway/commit/test123", createdAt: new Date(Date.now() - 10 * 86400000) },
    ];

    this.marks = [
      { id: "mrk-1", internId: "int-sam", givenById: "tl-alex", relatedLogId: "log-2", relatedTaskId: null, score: 85, comment: "Good CI/CD setup, well-structured", date: yesterday },
      { id: "mrk-2", internId: "int-liam", givenById: "tl-alex", relatedLogId: "log-4", relatedTaskId: null, score: 70, comment: "Solid accessibility work, needs more test cases", date: lastWeek },
      { id: "mrk-3", internId: "int-maya", givenById: "tl-jordan", relatedLogId: "log-6", relatedTaskId: null, score: 90, comment: "Excellent logging integration", date: yesterday },
    ];

    this.mistakes = [
      { id: "mst-1", internId: "int-ethan", flaggedById: "tl-jordan", relatedLogId: "log-8", note: "Missing rate limiting on public endpoints", severity: MistakeSeverity.MEDIUM, date: lastWeek, resolved: true, createdAt: new Date(Date.now() - 14 * 86400000) },
      { id: "mst-2", internId: "int-liam", flaggedById: "tl-alex", relatedLogId: "log-4", note: "Inconsistent error handling pattern", severity: MistakeSeverity.LOW, date: lastWeek, resolved: true, createdAt: new Date(Date.now() - 14 * 86400000) },
    ];

    this.messages = [
      { id: "msg-1", fromId: "tl-alex", toId: "int-sam", content: "Hey Sam, the notification drawer is looking good. Can you also add support for grouped notifications?", createdAt: new Date(Date.now() - 3600000), read: true },
      { id: "msg-2", fromId: "int-sam", toId: "tl-alex", content: "Sure, I can extend it to support grouping by type. Will have it done by EOD.", createdAt: new Date(Date.now() - 1800000), read: false },
      { id: "msg-3", fromId: "tl-jordan", toId: "int-maya", content: "Maya, the pagination PR is ready for review. Please test the cursor-based approach.", createdAt: new Date(Date.now() - 7200000), read: false },
      { id: "msg-4", fromId: "int-zoe", toId: "tl-jordan", content: "The auth module tests are all passing. Ready for your review.", createdAt: new Date(Date.now() - 10800000), read: true },
    ];

    this.questions = [
      { id: "q-1", internId: "int-sam", title: "How to handle auth token refresh?", content: "What is the recommended approach for refreshing JWT tokens without causing race conditions?", createdAt: new Date(), isHidden: false, replies: [{ id: "r-1", questionId: "q-1", authorId: "tl-alex", content: "Use a mutex pattern — queue the refresh and share the promise across concurrent requests. See the auth middleware for an example.", createdAt: new Date(Date.now() - 3600000), isHidden: false }] },
      { id: "q-2", internId: "int-sophia", title: "Best practice for Storybook theming?", content: "Has anyone set up Storybook to work with the Tailwind theme dark mode?", createdAt: new Date(Date.now() - 86400000), isHidden: false, replies: [] },
    ];

    this.replies = [
      { id: "r-1", questionId: "q-1", authorId: "tl-alex", content: "Use a mutex pattern — queue the refresh and share the promise across concurrent requests.", createdAt: new Date(Date.now() - 3600000), isHidden: false },
      { id: "r-2", questionId: "q-1", authorId: "int-sam", content: "Thanks Alex, I'll implement the mutex pattern today.", createdAt: new Date(Date.now() - 1800000), isHidden: false },
    ];

    this.daySessions = [
      { id: "ds-1", internId: "int-sam", date: today, startedAt: "9:00 AM", endedAt: undefined, status: "active", todayProject: "Frontend Redesign", todayPlan: "Finish notification drawer component", questions: null, gitLink: null, endJournal: null, createdAt: new Date() },
      { id: "ds-2", internId: "int-sam", date: yesterday, startedAt: "9:15 AM", endedAt: "5:30 PM", status: "completed", todayProject: "Frontend Redesign", todayPlan: "Set up CI/CD pipeline", questions: "How to configure staging env?", gitLink: "https://github.com/sam/frontend-redesign", endJournal: "CI/CD pipeline is working. Staging deploys successfully.", createdAt: new Date(Date.now() - 86400000) },
      { id: "ds-3", internId: "int-sophia", date: today, startedAt: "8:45 AM", endedAt: undefined, status: "active", todayProject: "Frontend Redesign", todayPlan: "Build component library primitives", questions: null, gitLink: null, endJournal: null, createdAt: new Date() },
      { id: "ds-4", internId: "int-maya", date: today, startedAt: "10:00 AM", endedAt: undefined, status: "active", todayProject: "API Gateway", todayPlan: "Implement rate limiting middleware", questions: null, gitLink: null, endJournal: null, createdAt: new Date() },
      { id: "ds-5", internId: "int-maya", date: yesterday, startedAt: "9:00 AM", endedAt: "5:00 PM", status: "completed", todayProject: "API Gateway", todayPlan: "Set up error logging", questions: null, gitLink: "https://github.com/maya/api-gateway", endJournal: "Sentry integration is working. Alert webhooks configured.", createdAt: new Date(Date.now() - 86400000) },
    ];

    console.log("Mock database seeded with users, projects, logs, tasks, marks, mistakes, messages, questions, and day sessions. 🚀");
  }

  // --- QUERY HANDLERS ---
  public user = {
    findUnique: async (args: any) => {
      const { id, email } = args.where;
      const found = this.users.find(u => 
        (id !== undefined && u.id === id) || 
        (email !== undefined && u.email.toLowerCase() === email.toLowerCase())
      );
      return found || null;
    },
    findMany: async (args?: any) => {
      let filtered = [...this.users];
      if (args?.where) {
        const { role, techLeadId } = args.where;
        if (role) {
          filtered = filtered.filter(u => u.role === role);
        }
        if (techLeadId) {
          filtered = filtered.filter(u => u.techLeadId === techLeadId);
        }
      }
      return filtered;
    },
    update: async (args: any) => {
      const { id } = args.where;
      const index = this.users.findIndex(u => u.id === id);
      if (index !== -1) {
        this.users[index] = { ...this.users[index], ...args.data };
        return this.users[index];
      }
      throw new Error(`User not found: ${id}`);
    },
    create: async (args: any) => {
      const { id, name, email, role, techLeadId, avatarUrl, isActive } = args.data;
      const newUser = {
        id: id || `u-${Date.now()}`,
        name,
        email: email.toLowerCase(),
        role: role,
        avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`,
        techLeadId: techLeadId || null,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date()
      };
      if (this.users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
        throw new Error(`Email already registered in mock database`);
      }
      this.users.push(newUser);
      return newUser;
    }
  };

  public project = {
    findMany: async () => {
      return [...this.projects];
    },
    create: async (args: any) => {
      const newProj = {
        id: `p-${Date.now()}`,
        ...args.data,
        screenshots: args.data.screenshots || [],
      };
      this.projects.push(newProj);
      return newProj;
    },
    update: async (args: any) => {
      const { id } = args.where;
      const index = this.projects.findIndex(p => p.id === id);
      if (index !== -1) {
        this.projects[index] = { ...this.projects[index], ...args.data };
        return this.projects[index];
      }
      throw new Error(`Project not found: ${id}`);
    }
  };

  public dailyLog = {
    findMany: async (args?: any) => {
      let filtered = [...this.dailyLogs];
      if (args?.where) {
        const { internId, projectId } = args.where;
        if (internId) {
          if (internId.in) {
            filtered = filtered.filter(l => internId.in.includes(l.internId));
          } else {
            filtered = filtered.filter(l => l.internId === internId);
          }
        }
        if (projectId) {
          filtered = filtered.filter(l => l.projectId === projectId);
        }
      }
      return filtered;
    },
    findFirst: async (args: any) => {
      const { internId, date } = args.where;
      const found = this.dailyLogs.find(l => l.internId === internId && l.date === date);
      return found || null;
    },
    findUnique: async (args: any) => {
      const { id } = args.where;
      const found = this.dailyLogs.find(l => l.id === id);
      return found || null;
    },
    create: async (args: any) => {
      const newLog = {
        id: `log-${Date.now()}`,
        ...args.data,
        status: "submitted"
      };
      this.dailyLogs.push(newLog);
      return newLog;
    },
    update: async (args: any) => {
      const { id } = args.where;
      const index = this.dailyLogs.findIndex(l => l.id === id);
      if (index !== -1) {
        this.dailyLogs[index] = { ...this.dailyLogs[index], ...args.data };
        return this.dailyLogs[index];
      }
      throw new Error(`Log not found: ${id}`);
    }
  };

  public task = {
    findMany: async (args?: any) => {
      let filtered = [...this.tasks];
      if (args?.where) {
        const { assignedToId, assignedById } = args.where;
        if (assignedToId) {
          if (assignedToId.in) {
            filtered = filtered.filter(t => assignedToId.in.includes(t.assignedToId));
          } else {
            filtered = filtered.filter(t => t.assignedToId === assignedToId);
          }
        }
        if (assignedById) {
          filtered = filtered.filter(t => t.assignedById === assignedById);
        }
      }
      return filtered;
    },
    create: async (args: any) => {
      const newTask = {
        id: `t-${Date.now()}`,
        status: TaskStatus.TODO,
        createdAt: new Date(),
        completedAt: null,
        score: null,
        comment: null,
        ...args.data
      };
      this.tasks.push(newTask);
      return newTask;
    },
    update: async (args: any) => {
      const { id } = args.where;
      const index = this.tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...args.data };
        return this.tasks[index];
      }
      throw new Error(`Task not found: ${id}`);
    }
  };

  public mark = {
    findMany: async (args?: any) => {
      let filtered = [...this.marks];
      if (args?.where) {
        const { internId } = args.where;
        if (internId) {
          if (internId.in) {
            filtered = filtered.filter(m => internId.in.includes(m.internId));
          } else {
            filtered = filtered.filter(m => m.internId === internId);
          }
        }
      }
      return filtered;
    },
    create: async (args: any) => {
      const newMark = {
        id: `mrk-${Date.now()}`,
        createdAt: new Date(),
        ...args.data
      };
      this.marks.push(newMark);
      return newMark;
    }
  };

  public mistake = {
    findMany: async (args?: any) => {
      let filtered = [...this.mistakes];
      if (args?.where) {
        const { internId, resolved } = args.where;
        if (internId) {
          if (internId.in) {
            filtered = filtered.filter(m => internId.in.includes(m.internId));
          } else {
            filtered = filtered.filter(m => m.internId === internId);
          }
        }
        if (resolved !== undefined) {
          filtered = filtered.filter(m => m.resolved === resolved);
        }
      }
      return filtered;
    },
    create: async (args: any) => {
      const newMistake = {
        id: `mst-${Date.now()}`,
        createdAt: new Date(),
        resolved: false,
        ...args.data
      };
      this.mistakes.push(newMistake);
      return newMistake;
    },
    update: async (args: any) => {
      const { id } = args.where;
      const index = this.mistakes.findIndex(m => m.id === id);
      if (index !== -1) {
        this.mistakes[index] = { ...this.mistakes[index], ...args.data };
        return this.mistakes[index];
      }
      throw new Error(`Mistake not found: ${id}`);
    }
  };

  public message = {
    findMany: async (args?: any) => {
      let filtered = [...this.messages];
      if (args?.where) {
        const { OR } = args.where;
        if (OR && OR.length === 2) {
          const first = OR[0];
          const second = OR[1];
          filtered = filtered.filter(m => 
            (m.fromId === first.fromId && m.toId === first.toId) ||
            (m.fromId === second.fromId && m.toId === second.toId)
          );
        }
      }
      return filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },
    create: async (args: any) => {
      const newMsg = {
        id: `msg-${Date.now()}`,
        read: false,
        createdAt: new Date(),
        ...args.data
      };
      this.messages.push(newMsg);
      return newMsg;
    }
  };

  public question = {
    findMany: async (args?: any) => {
      return this.questions.map(q => ({
        ...q,
        replies: this.replies.filter(r => r.questionId === q.id).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    findUnique: async (args: any) => {
      const { id } = args.where;
      const q = this.questions.find(item => item.id === id);
      if (!q) return null;
      return {
        ...q,
        replies: this.replies.filter(r => r.questionId === q.id).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      };
    },
    create: async (args: any) => {
      const newQ = {
        id: `q-${Date.now()}`,
        createdAt: new Date(),
        ...args.data
      };
      this.questions.push(newQ);
      return {
        ...newQ,
        replies: []
      };
    }
  };

  public reply = {
    create: async (args: any) => {
      const newR = {
        id: `r-${Date.now()}`,
        createdAt: new Date(),
        ...args.data
      };
      this.replies.push(newR);
      return newR;
    }
  };

  public daySession = {
    findMany: async (args?: any) => {
      let filtered = [...this.daySessions];
      if (args?.where) {
        const { internId, date } = args.where;
        if (internId) {
          if (internId.in) {
            filtered = filtered.filter(s => internId.in.includes(s.internId));
          } else {
            filtered = filtered.filter(s => s.internId === internId);
          }
        }
        if (date) {
          filtered = filtered.filter(s => s.date === date);
        }
      }
      return filtered;
    },
    findFirst: async (args: any) => {
      const { internId, date } = args.where;
      return this.daySessions.find(s => s.internId === internId && s.date === date) || null;
    },
    create: async (args: any) => {
      const newSession = {
        id: `ds-${Date.now()}`,
        createdAt: new Date(),
        ...args.data
      };
      this.daySessions.push(newSession);
      return newSession;
    },
    update: async (args: any) => {
      const { id } = args.where;
      const index = this.daySessions.findIndex(s => s.id === id);
      if (index !== -1) {
        this.daySessions[index] = { ...this.daySessions[index], ...args.data };
        return this.daySessions[index];
      }
      throw new Error(`DaySession not found: ${id}`);
    }
  };

  public $disconnect = async () => {};
}

const mockPrismaInstance = new MockPrismaClient();

export function getPrisma(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  
  const isValidUrl = dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'));
  const isPlaceholder = dbUrl && (
    dbUrl.includes('host:port') || 
    dbUrl.includes('MY_DATABASE_URL') || 
    dbUrl.includes('password@host') ||
    dbUrl.includes('localhost:5432') ||
    dbUrl.includes('127.0.0.1:5432') ||
    dbUrl.includes('HOST:5432')
  );

  if (!isValidUrl || isPlaceholder) {
    console.warn("DATABASE_URL missing/invalid — using in-memory MockPrismaClient fallback");
    return mockPrismaInstance as any;
  }

  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }
  return prisma;
}

