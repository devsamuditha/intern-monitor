import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@company.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log('Superadmin already exists!');
    return;
  }

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: email,
      role: Role.SUPER_ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isActive: true,
    },
  });

  console.log('Successfully created Super Admin:', superAdmin.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
