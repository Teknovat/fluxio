#!/usr/bin/env node

/**
 * Script to switch between SQLite and PostgreSQL in Prisma schema
 * Usage: 
 *   node scripts/switch-db.js sqlite
 *   node scripts/switch-db.js postgres
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const provider = process.argv[2];

if (!provider || !['sqlite', 'postgres', 'postgresql'].includes(provider)) {
    console.error('Usage: node scripts/switch-db.js [sqlite|postgres]');
    process.exit(1);
}

const targetProvider = provider === 'sqlite' ? 'sqlite' : 'postgresql';

try {
    let schema = fs.readFileSync(schemaPath, 'utf8');

    // Replace the provider line
    if (targetProvider === 'sqlite') {
        schema = schema.replace(
            /provider\s*=\s*"postgresql"/,
            'provider = "sqlite"'
        );
        console.log('✅ Switched to SQLite');
    } else {
        schema = schema.replace(
            /provider\s*=\s*"sqlite"/,
            'provider = "postgresql"'
        );
        console.log('✅ Switched to PostgreSQL');
    }

    fs.writeFileSync(schemaPath, schema);
    console.log('📝 Schema updated successfully');
    console.log('⚠️  Run "npm run db:push" to sync your database');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
