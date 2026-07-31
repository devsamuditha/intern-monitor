import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1 Tech Lead
  const techLead = await prisma.user.upsert({
    where: { email: 'alex@techlead.com' },
    update: {},
    create: {
      id: 'tl-alex',
      name: 'Alex Rivera',
      email: 'alex@techlead.com',
      role: Role.TECH_LEAD,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isActive: true,
    },
  });
  console.log(`Created Tech Lead: ${techLead.email}`);

  // 1 Manager
  const manager = await prisma.user.upsert({
    where: { email: 'elena@manager.com' },
    update: {},
    create: {
      id: 'm-elena',
      name: 'Elena Rostova',
      email: 'elena@manager.com',
      role: Role.MANAGER,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isActive: true,
    },
  });
  console.log(`Created Manager: ${manager.email}`);

  // 2 Interns
  const intern1 = await prisma.user.upsert({
    where: { email: 'sam@intern.com' },
    update: { techLeadId: techLead.id },
    create: {
      id: 'int-sam',
      name: 'Sam Chen',
      email: 'sam@intern.com',
      role: Role.INTERN,
      techLeadId: techLead.id,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isActive: true,
    },
  });
  console.log(`Created Intern 1: ${intern1.email}`);

  const intern2 = await prisma.user.upsert({
    where: { email: 'liam@intern.com' },
    update: { techLeadId: techLead.id },
    create: {
      id: 'int-liam',
      name: "Liam O'Connor",
      email: 'liam@intern.com',
      role: Role.INTERN,
      techLeadId: techLead.id,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isActive: true,
    },
  });
  console.log(`Created Intern 2: ${intern2.email}`);

  // 1 Super Admin (just in case it's missing)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@company.com' },
    update: {},
    create: {
      id: 'sa-root',
      name: 'Super Admin',
      email: 'superadmin@company.com',
      role: Role.SUPER_ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isActive: true,
    },
  });
  console.log(`Created Super Admin: ${superAdmin.email}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
