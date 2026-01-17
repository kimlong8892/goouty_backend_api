import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
    try {
        const [provinceCount] = await Promise.all([
            prisma.province.count(),
        ]);

        if (provinceCount === 0) {
            console.log('🌱 Provinces missing. Seeding provinces...');
            execSync('npm run seed:provinces', { stdio: 'inherit' });
        }

        // Always run templates seed to ensure they are up to date (uses upsert)
        console.log('🌱 Updating notification templates...');
        execSync('npm run seed:templates', { stdio: 'inherit' });

        console.log('✅ Essential data seeding completed.');
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
