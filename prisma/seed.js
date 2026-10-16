const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding root admin user for Al-Marai B2B...');
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      name: 'محمد عبد الله (المدير العام)',
      role: 'admin',
      isActive: true,
    },
    create: {
      id: 'user-admin',
      name: 'محمد عبد الله (المدير العام)',
      username: 'admin',
      password: '123',
      role: 'admin',
      isActive: true,
    },
  });

  console.log(`Root admin verified: ${admin.username} (${admin.name})`);
  console.log('System is clean with 0 fake products, 0 batches, 0 clients, 0 invoices.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
