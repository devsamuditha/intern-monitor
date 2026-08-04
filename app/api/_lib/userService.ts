import { getPrisma } from "@/src/db/prisma";
import { hashPassword, generateUsername, generateUniqueUsername, generatePassword } from "@/src/lib/auth";
import { mapUser, logAudit } from "@/app/api/_lib/mappers";
import { Role } from "@prisma/client";

const DEFAULT_AVATAR_INTERN =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
const DEFAULT_AVATAR_OTHER =
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

export interface CreateUserParams {
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: string;
  techLeadId?: string | null;
  actorId?: string;
}

export interface CreateUserResult {
  user: ReturnType<typeof mapUser> & { mustChangePassword?: boolean };
  username: string;
  password: string;
}

export async function createUserWithCredentials(params: CreateUserParams): Promise<CreateUserResult> {
  const prisma = getPrisma();
  const prismaRole = params.role.toUpperCase() as Role;

  const existing = await prisma.user.findUnique({
    where: { email: params.email.toLowerCase() },
  });
  if (existing) {
    throw new Error("Email already registered in database");
  }

  // Use provided username or generate from name
  let username: string;
  if (params.username) {
    username = params.username.toLowerCase().trim();
    const usernameExists = await prisma.user.findUnique({ where: { username } });
    if (usernameExists) {
      throw new Error("Username already exists");
    }
  } else {
    username = generateUsername(params.name);
    let attempts = 0;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = generateUniqueUsername(generateUsername(params.name));
      attempts++;
      if (attempts > 6) {
        username = `${generateUsername(params.name)}${Date.now()}`;
        break;
      }
    }
  }

  // Use provided password or generate
  const password = params.password || generatePassword();
  const passwordHash = await hashPassword(password);

  const avatarUrl =
    prismaRole === Role.INTERN && !params.techLeadId
      ? DEFAULT_AVATAR_INTERN
      : DEFAULT_AVATAR_OTHER;

  const dbUser = await prisma.user.create({
    data: {
      name: params.name,
      email: params.email.toLowerCase(),
      username,
      passwordHash,
      mustChangePassword: false,
      role: prismaRole,
      avatarUrl,
      techLeadId: prismaRole === Role.INTERN ? (params.techLeadId || null) : null,
      isActive: true,
    },
  });

  const mapped = mapUser(dbUser) as any;
  mapped.mustChangePassword = dbUser.mustChangePassword;

  if (params.actorId) {
    try {
      await logAudit(prisma, params.actorId, "USER_CREATED", "USER", dbUser.id, undefined, {
        name: dbUser.name,
        email: dbUser.email,
        username: dbUser.username,
        role: dbUser.role,
      });
    } catch {
      // audit logging is best-effort
    }
  }

  return { user: mapped, username, password };
}
