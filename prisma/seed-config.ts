import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding SystemConfig...');

    const configKey = 'AI_BILL_SCAN_DAILY_LIMIT';
    const defaultValue = '5';

    const existing = await prisma.systemConfig.findUnique({
        where: { key: configKey },
    });

    if (!existing) {
        await prisma.systemConfig.create({
            data: {
                key: configKey,
                value: defaultValue,
            },
        });
        console.log(`Created ${configKey} with value ${defaultValue}`);
    } else {
        console.log(`${configKey} already exists with value ${existing.value}`);
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
