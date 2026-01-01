import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
    try {
        const provinceCount = await prisma.province.count();
        if (provinceCount === 0) {
            console.log('🌱 Database is empty. Starting seeding...');
            execSync('npm run seed:all', { stdio: 'inherit' });
        } else {
            console.log('✅ Database already has data. Skipping seed.');
        }
    } catch (error) {
        console.error('❌ Error checking database status:', error);
        // If the table doesn't exist yet, it might be the very first run
        // but prisma migrate deploy should have created it already.
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
