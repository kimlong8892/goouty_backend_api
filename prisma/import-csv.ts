
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();
const CSV_DIR = path.join(__dirname, '../csv_exports');
const SCHEMA_PATH = path.join(__dirname, 'schema.prisma');

// Type definition for our schema map
interface ModelSchema {
    [fieldName: string]: string; // fieldName -> fieldType (e.g., 'String', 'Int', 'DateTime')
}

interface SchemaMap {
    [modelName: string]: ModelSchema;
}

/**
 * Parses the schema.prisma file to determine field types for casting.
 */
function parseSchema(): SchemaMap {
    const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    const lines = schemaContent.split('\n');
    const schemaMap: SchemaMap = {};

    let currentModel: string | null = null;

    for (const line of lines) {
        const trimmed = line.trim();

        // Match model definition: model User {
        const modelMatch = trimmed.match(/^model\s+(\w+)\s+\{/);
        if (modelMatch) {
            currentModel = modelMatch[1];
            // Normalize model name to lowercase for easier matching with file names if needed, 
            // but Prisma client uses camelCase (user, trip). We'll keep PascalCase and map to camelCase later.
            schemaMap[currentModel] = {};
            continue;
        }

        // End of model
        if (trimmed === '}') {
            currentModel = null;
            continue;
        }

        if (currentModel) {
            // Match field definition: id String @id... or val Int?
            // Simple regex to grab the first two words: name and type
            // Ignore lines starting with @@ or //
            if (trimmed.startsWith('@@') || trimmed.startsWith('//') || trimmed.length === 0) continue;

            const parts = trimmed.split(/\s+/);
            if (parts.length >= 2) {
                const fieldName = parts[0];
                // Remove ? or [] suffix from type
                const fieldType = parts[1].replace('?', '').replace('[]', '');
                schemaMap[currentModel][fieldName] = fieldType;
            }
        }
    }

    return schemaMap;
}

/**
 * Robust CSV Line Parser
 * Handles quoted fields conforming to CSV standard.
 */
function parseCSVLine(text: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuote) {
            if (char === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    // Escaped quote
                    cur += '"';
                    i++;
                } else {
                    // End of quote
                    inQuote = false;
                }
            } else {
                cur += char;
            }
        } else {
            if (char === '"') {
                inQuote = true;
            } else if (char === ',') {
                result.push(cur);
                cur = '';
            } else {
                cur += char;
            }
        }
    }
    result.push(cur);
    return result;
}

/**
 * Casts a string value to the correct type based on the schema.
 */
function castValue(value: string, type: string): any {
    if (value === '' || value === undefined || value === null) {
        return null;
    }

    switch (type) {
        case 'Int':
            return parseInt(value, 10);
        case 'Float':
        case 'Decimal':
            // Prisma handles Decimals as strings or Decimal objects.
            // Passing string is safer for precision, but for Float we need number.
            if (type === 'Float') return parseFloat(value);
            return value; // Keep Decimal as string
        case 'Boolean':
            return value.toLowerCase() === 'true';
        case 'DateTime':
            return new Date(value);
        case 'Json':
            try {
                return JSON.parse(value);
            } catch (e) {
                return value; // Fail gracefully
            }
        default:
            return value; // String and others
    }
}

/**
 * Imports a single CSV file into the database.
 */
async function importTable(modelName: string, schemaMap: SchemaMap) {
    // Convert modelName to camelCase for prisma client (e.g., User -> user)
    const prismaDelegateName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const delegate = (prisma as any)[prismaDelegateName];

    if (!delegate) {
        console.warn(`⚠️ Skipped ${modelName}: Model not found in Prisma Client.`);
        return;
    }

    const filePath = path.join(CSV_DIR, `${prismaDelegateName}.csv`);
    if (!fs.existsSync(filePath)) {
        console.log(`ℹ️ Skipped ${modelName}: File not found (${prismaDelegateName}.csv).`);
        return;
    }

    console.log(`Processing ${modelName}...`);

    // Lookup correct model name in schemaMap (it uses PascalCase usually)
    // We search for case-insensitive match
    const schemaModelName = Object.keys(schemaMap).find(k => k.toLowerCase() === modelName.toLowerCase());
    if (!schemaModelName) {
        console.warn(`⚠️ Skipped ${modelName}: Schema definition not found.`);
        return;
    }

    const modelFields = schemaMap[schemaModelName];

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let headers: string[] | null = null;
    const batchSize = 100;
    let batch: any[] = [];
    let count = 0;

    let lineBuffer = '';

    for await (const line of rl) {
        if (!headers) {
            // First line should be headers. 
            // Theoretically headers could span lines but usually don't.
            // We'll assume headers are on one line for simplicity or strictly properly formatted.
            headers = parseCSVLine(line);
            continue;
        }

        // Accumulate lines for multiline records
        if (lineBuffer === '') {
            lineBuffer = line;
        } else {
            lineBuffer += '\n' + line;
        }

        // Check if quotes are balanced
        // Basic CSV rule: The total number of quotes in a full record must be even 
        // (escaped quotes "" count as 2, delimiters " count as 1, so total usage properly paired is always even)
        const quoteCount = (lineBuffer.match(/"/g) || []).length;

        if (quoteCount % 2 !== 0) {
            // Odd number of quotes means we are inside a quoted field
            continue;
        }

        // Process the complete record
        const values = parseCSVLine(lineBuffer);
        lineBuffer = ''; // Reset buffer

        const row: any = {};

        headers.forEach((header, index) => {
            const val = values[index];
            // Note: If values[index] is undefined (short row), we get undefined

            const type = modelFields[header] || 'String';

            if (modelFields[header]) {
                const castedPosition = castValue(val, type);
                // Filter out nulls for non-nullable fields if helpful, but Prisma throws better errors usually.
                // However, ensure we don't set 'undefined' explicitly for keys, 
                // but if we do row[header] = undefined, JSON.stringify removes it, effectively "missing".
                if (castedPosition !== undefined) {
                    row[header] = castedPosition;
                }
            }
        });

        batch.push(row);

        if (batch.length >= batchSize) {
            await delegate.createMany({
                data: batch,
                skipDuplicates: true
            });
            count += batch.length;
            batch = [];
        }
    }

    // Insert remaining
    if (batch.length > 0) {
        await delegate.createMany({
            data: batch,
            skipDuplicates: true
        });
        count += batch.length;
    }

    console.log(`✅ Imported ${count} records into ${modelName}.`);
}

async function main() {
    console.log('Starting CSV Import...');
    console.log('Parsing schema...');
    const schemaFullMap = parseSchema();

    // Defined Order to respect Foreign Keys
    const importOrder = [
        'Province',
        'User',
        'SocialAccount',
        'Device',
        'Notification',
        'Template',
        'Trip',
        'Day',
        'Activity',
        'TripMember',
        'Expense',
        'ExpenseParticipant',
        'PaymentSettlement',
        'PaymentTransaction',
        'TripTemplate',
        'TripTemplateDay',
        'TripTemplateActivity',
    ];

    for (const model of importOrder) {
        await importTable(model, schemaFullMap);
    }

    console.log('\n----------------------------------------');
    console.log('Import complete!');
    console.log('----------------------------------------');
}

main()
    .catch(e => {
        console.error('Fatal error during import:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
