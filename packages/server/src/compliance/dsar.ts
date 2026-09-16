// @ts-nocheck
/**
 * Compliance guard - data inventory and DSAR
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function generateDataInventory() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const reportsDir = path.join(process.cwd(), 'ops', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Map data inventory
  const inventory = {
    tables: [
      { name: 'users', pii: ['email', 'name'], retention: 'account_lifetime' },
      { name: 'user_events', pii: ['user_id'], retention: '2_years' },
      { name: 'sessions', pii: ['user_id'], retention: '90_days' },
    ],
    external: [
      { service: 'Supabase', data: 'Database', pii: true },
      { service: 'Vercel', data: 'Analytics', pii: false },
      { service: 'Stripe', data: 'Payments', pii: true },
    ],
  };

  const report = `# Data Inventory Map

Generated: ${new Date().toISOString()}

## Tables

${inventory.tables.map((t) => `
### ${t.name}
- **PII Fields:** ${t.pii.join(', ')}
- **Retention:** ${t.retention}
`).join('\n')}

## External Services

${inventory.external.map((e) => `
### ${e.service}
- **Data Type:** ${e.data}
- **Contains PII:** ${e.pii ? 'Yes' : 'No'}
`).join('\n')}
`;

  const reportPath = path.join(reportsDir, 'data-inventory.md');
  fs.writeFileSync(reportPath, report);

  return reportPath;
}

export async function handleDSAR(userId: string, action: 'export' | 'delete') {
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (action === 'export') {
    // Export user data
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    const { data: events } = await supabase.from('user_events').select('*').eq('user_id', userId);

    const exportData = {
      user,
      events,
      exportedAt: new Date().toISOString(),
    };

    // Create audit trail
    await supabase.from('dsar_audit').insert({
      user_id: userId,
      action: 'export',
      timestamp: new Date().toISOString(),
    });

    return exportData;
  } else if (action === 'delete') {
    // Delete user data
    await supabase.from('user_events').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);

    // Create audit trail
    await supabase.from('dsar_audit').insert({
      user_id: userId,
      action: 'delete',
      timestamp: new Date().toISOString(),
    });

    return { deleted: true };
  }
}

export function redactLogs(logContent: string): string {
  // Redact PII from logs
  const patterns = [
    { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
    { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
    { regex: /\b\d{16}\b/g, replacement: '[CARD_REDACTED]' },
  ];

  let redacted = logContent;
  for (const pattern of patterns) {
    redacted = redacted.replace(pattern.regex, pattern.replacement);
  }

  return redacted;
}
