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

    // Seed Users only so authentication flows work perfectly
    this.users = [
      { id: "m-elena", name: "Elena Rostova", email: "elena@manager.com", role: Role.MANAGER, avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", isActive: true },
      { id: "tl-alex", name: "Alex Rivera", email: "alex@techlead.com", role: Role.TECH_LEAD, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", isActive: true },
      { id: "tl-jordan", name: "Jordan Vance", email: "jordan@techlead.com", role: Role.TECH_LEAD, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", isActive: true },
      { id: "int-sam", name: "Sam Chen", email: "sam@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-alex", isActive: true },
      { id: "int-liam", name: "Liam O'Connor", email: "liam@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-alex", isActive: false },
      { id: "int-sophia", name: "Sophia Martinez", email: "sophia@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-alex", isActive: true },
      { id: "int-maya", name: "Maya Lin", email: "maya@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-jordan", isActive: true },
      { id: "int-ethan", name: "Ethan Hunt", email: "ethan@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-jordan", isActive: false },
      { id: "int-zoe", name: "Zoe Taylor", email: "zoe@intern.com", role: Role.INTERN, avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80", techLeadId: "tl-jordan", isActive: true },
    ];

    // All active pipelines, daily log journals, assigned tasks, mistakes, marks, and threads are initialized empty.
    this.projects = [];
    this.dailyLogs = [];
    this.marks = [];
    this.mistakes = [];
    this.tasks = [];
    this.messages = [];
    this.questions = [];
    this.replies = [];
    
    console.log("Mock database initialized entirely empty and ready for sandbox operations. 🚀");
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
    dbUrl.includes('127.0.0.1:5432')
  );

  if (!isValidUrl || isPlaceholder) {
    throw new Error('DATABASE_URL environment variable is missing, invalid, or a default placeholder. Cannot start without a valid database connection.');
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

