import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for stale advisory locks...');
    try {
        // Find sessions holding advisory locks that are not the current session
        const locks: any[] = await prisma.$queryRawUnsafe(`
      SELECT pid, mode, granted
      FROM pg_locks
      WHERE locktype = 'advisory'
      AND pid <> pg_backend_pid();
    `);

        console.log(`Found ${locks.length} other sessions holding advisory locks.`);

        if (locks.length > 0) {
            console.log('Attempting to terminate sessions holding advisory locks...');
            // Terminate those sessions
            const result: any[] = await prisma.$queryRawUnsafe(`
        SELECT pg_terminate_backend(pid) as terminated
        FROM pg_locks
        WHERE locktype = 'advisory'
        AND pid <> pg_backend_pid();
      `);
            console.log('Termination result:', result);
        } else {
            console.log('No stale advisory locks found.');
        }

    } catch (e) {
        console.error('Error checking/clearing locks:', e);
        // Don't fail the pipeline if this optional step fails (e.g. due to permissions)
    } finally {
        await prisma.$disconnect();
    }
}

main();
