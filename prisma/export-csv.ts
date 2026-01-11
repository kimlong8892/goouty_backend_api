
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Directory to store CSV files
const OUTPUT_DIR = path.join(__dirname, '../csv_exports');

/**
 * Converts a single value to a CSV-safe string.
 */
const escapeCsvField = (field: any): string => {
    if (field === null || field === undefined) {
        return '';
    }

    // Handle Date objects
    if (field instanceof Date) {
        return field.toISOString();
    }

    // Convert to string
    const stringValue = String(field);

    // Escape quotes, handle delimiters (comma, newline)
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
};

/**
 * Exports a specific Prisma model to a CSV file.
 */
async function exportTable(modelName: string, modelDelegate: any) {
    try {
        console.log(`\nStarting export for: ${modelName}`);
        const data = await modelDelegate.findMany();

        if (data.length === 0) {
            console.log(`No data found for ${modelName}. Skipping.`);
            return;
        }

        // Get headers from the first record
        const headers = Object.keys(data[0]);

        // Construct CSV content
        const headerRow = headers.join(',');
        const dataRows = data.map((row: any) => {
            return headers.map(header => escapeCsvField(row[header])).join(',');
        });

        const csvContent = [headerRow, ...dataRows].join('\n');

        // Write to file
        const filePath = path.join(OUTPUT_DIR, `${modelName}.csv`);
        fs.writeFileSync(filePath, csvContent, { encoding: 'utf8' });

        console.log(`✅ Successfully exported ${data.length} records to ${modelName}.csv`);
    } catch (error) {
        console.error(`❌ Error exporting ${modelName}:`, error);
    }
}

async function main() {
    console.log('Starting database export to CSV...');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created output directory: ${OUTPUT_DIR}`);
    } else {
        console.log(`Output directory exists: ${OUTPUT_DIR}`);
    }

    // List of models to export (Order doesn't strictly matter for CSV export)
    const models = [
        'user',
        'trip',
        'day',
        'tripMember',
        'activity',
        'expense',
        'expenseParticipant',
        'socialAccount',
        'paymentSettlement',
        'paymentTransaction',
        'device',
        'notification',
        'province',
        'tripTemplate',
        'tripTemplateDay',
        'tripTemplateActivity',
        'template'
    ];

    // Iterate and export
    for (const modelName of models) {
        // Check if the model exists on the prisma client instance (it should)
        // We cast to any because accessing by string key isn't strictly typed by default
        const delegate = (prisma as any)[modelName];

        if (delegate) {
            await exportTable(modelName, delegate);
        } else {
            console.warn(`⚠️ Model "${modelName}" not found in Prisma Client. Check schema or spelling.`);
        }
    }

    console.log('\n----------------------------------------');
    console.log(`Export complete! Files saved in: ${OUTPUT_DIR}`);
    console.log('----------------------------------------');
}

main()
    .catch(e => {
        console.error('Fatal error during export:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
