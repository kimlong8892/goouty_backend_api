import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
    try {
        const [provinceCount, templateCount] = await Promise.all([
            prisma.province.count(),
            (prisma as any).template.count()
        ]);

        console.log('🚫 Seeding disabled by user request.');
        // if (provinceCount === 0) {
        //     console.log('🌱 Provinces missing. Seeding provinces...');
        //     execSync('npm run seed:provinces', { stdio: 'inherit' });
        // }

        // if (templateCount === 0) {
        //     console.log('🌱 Templates missing. Seeding templates...');
        //     execSync('npm run seed:templates', { stdio: 'inherit' });
        // }

        // if (provinceCount === 0 || templateCount === 0) {
        //     console.log('✅ Basic essential data seeding completed.');
        // } else {
        //     console.log('✅ Essential data already exists. Skipping seed.');
        // }
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
