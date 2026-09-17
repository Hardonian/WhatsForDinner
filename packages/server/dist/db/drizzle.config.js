// @ts-nocheck
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
export default defineConfig({
    schema: './src/db/schema.ts',
    out: './db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '',
    },
    verbose: true,
    strict: true,
});
