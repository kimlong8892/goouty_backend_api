import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚫 Notification templates seeding disabled by user request.');
}

main()
  .catch((e) => {
    console.error('❌ Critical error during template seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
