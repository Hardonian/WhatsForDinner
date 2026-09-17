// @ts-nocheck
/**
 * requireEnv helper - enforce environment variables
 */
export function requireEnv(key, defaultValue) {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
export function requireEnvArray(keys) {
    const env = {};
    for (const key of keys) {
        env[key] = requireEnv(key);
    }
    return env;
}
export function optionalEnv(key, defaultValue = '') {
    return process.env[key] || defaultValue;
}
// Validate all required env vars at startup
/**
 * Extract Supabase project reference from URL
 * @param supabaseUrl - The Supabase URL (e.g., https://<project-ref>.supabase.co)
 * @returns The project reference or null if invalid
 */
export function extractSupabaseProjectRef(supabaseUrl) {
    if (!supabaseUrl) {
        return null;
    }
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    return (match && match[1]) ? match[1] : null;
}
/**
 * Get Supabase project reference from environment
 * Extracts from NEXT_PUBLIC_SUPABASE_URL or uses SUPABASE_PROJECT_REF
 * @returns The project reference or null if not found
 */
export function getSupabaseProjectRef() {
    // First try to get from explicit env var
    if (process.env.SUPABASE_PROJECT_REF) {
        return process.env.SUPABASE_PROJECT_REF;
    }
    // Extract from URL
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    if (url) {
        return extractSupabaseProjectRef(url);
    }
    return null;
}
export function validateEnv() {
    const required = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];
    const missing = [];
    for (const key of required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}
