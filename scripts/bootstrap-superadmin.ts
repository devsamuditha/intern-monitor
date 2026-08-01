/**
 * ONE-TIME bootstrap for the initial Super Admin.
 *
 * Run once after migrations + prisma generate:
 *   npx tsx scripts/bootstrap-superadmin.ts
 *
 * Reads SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD from environment.
 */
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "CHANGE_ME";

async function main() {
  const email = (process.env.SUPERADMIN_EMAIL || "superadmin@company.com").toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || DEFAULT_PASSWORD;

  if (!password || password === DEFAULT_PASSWORD) {
    console.error(
      `ERROR: SUPERADMIN_PASSWORD is empty or still the default "${DEFAULT_PASSWORD}".\n` +
        "Set a real password in your environment before bootstrapping."
    );
    process.exit(1);
  }

  let username = email.split("@")[0].toLowerCase();
  username = username.replace(/[^a-z0-9._-]/g, "").replace(/^[-_.]+|[-_.]+$/g, "");
  if (!username) username = "superadmin";

  let suffix = 0;
  const base = username;
  while (await prisma.user.findUnique({ where: { username } })) {
    suffix++;
    username = `${base}${suffix}`;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
      mustChangePassword: false,
      role: Role.SUPER_ADMIN,
      isActive: true,
      name: "Super Admin",
    },
    create: {
      email,
      username,
      name: "Super Admin",
      passwordHash,
      mustChangePassword: false,
      role: Role.SUPER_ADMIN,
      avatarUrl:
        "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      isActive: true,
    },
  });

  console.log("Bootstrapped Super Admin:");
  console.log(`  username: ${user.username}`);
  console.log(`  email:    ${user.email}`);
  console.log(`  role:     ${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
