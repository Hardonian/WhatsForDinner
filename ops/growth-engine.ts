/**
 * Growth Engine - UTM tracking + cohort/LTV analysis
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { secretsManager } from './secrets-manager-unified.mjs';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('growth-engine-ts');
const SUPABASE_URL = (await secretsManager.getSecret('NEXT_PUBLIC_SUPABASE_URL')) || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = (await secretsManager.getSecret('SUPABASE_SERVICE_ROLE_KEY')) || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
const REPORTS_DIR = join(process.cwd(), 'ops', 'reports');

interface CohortData {
  cohort: string; // YYYY-MM
  users: number;
  revenue: number;
  ltv: number;
  retention: number[];
}

interface GrowthReport {
  timestamp: string;
  cohorts: CohortData[];
  summary: {
    totalUsers: number;
    totalRevenue: number;
    avgLTV: number;
  };
}

async function normalizeUTM(): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Normalize UTM parameters in user events
  // This would update existing records to have normalized utm_source, utm_medium, utm_campaign
  
    
  // Example: Update events table
  const { error } = await supabase.rpc('normalize_utm_parameters');
  
  if (error) {
    logger.warn('UTM normalization function not found, skipping');
  } else {
      }
}

async function calculateCohorts(): Promise<CohortData[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const cohorts: CohortData[] = [];

  // Query user signups by month
  const { data: signups } = await supabase
    .from('users')
    .select('id, created_at')
    .order('created_at', { ascending: true });

  if (!signups) return cohorts;

  // Group by cohort (month)
  const cohortMap = new Map<string, string[]>();
  
  for (const signup of signups) {
    const cohort = new Date(signup.created_at).toISOString().slice(0, 7); // YYYY-MM
    if (!cohortMap.has(cohort)) {
      cohortMap.set(cohort, []);
    }
    cohortMap.get(cohort)!.push(signup.id);
  }

  // Calculate metrics for each cohort
  for (const [cohort, userIds] of cohortMap.entries()) {
    // Calculate revenue
    const { data: revenue } = await supabase
      .from('payments')
      .select('amount')
      .in('user_id', userIds);

    const totalRevenue = revenue?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const ltv = totalRevenue / userIds.length;

    cohorts.push({
      cohort,
      users: userIds.length,
      revenue: totalRevenue,
      ltv,
      retention: [] // Would calculate retention percentages
    });
  }

  return cohorts.sort((a, b) => a.cohort.localeCompare(b.cohort));
}

async function generateGrowthReport(): Promise<void> {
  
  await normalizeUTM();
  const cohorts = await calculateCohorts();

  const totalUsers = cohorts.reduce((sum, c) => sum + c.users, 0);
  const totalRevenue = cohorts.reduce((sum, c) => sum + c.revenue, 0);
  const avgLTV = cohorts.reduce((sum, c) => sum + c.ltv, 0) / cohorts.length;

  const report: GrowthReport = {
    timestamp: new Date().toISOString(),
    cohorts,
    summary: {
      totalUsers,
      totalRevenue,
      avgLTV
    }
  };

  // Save JSON report
  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }

  writeFileSync(
    join(REPORTS_DIR, 'growth.json'),
    JSON.stringify(report, null, 2)
  );

  // Generate CSV
  let csv = 'Cohort,Users,Revenue,LTV\n';
  for (const cohort of cohorts) {
    csv += `${cohort.cohort},${cohort.users},${cohort.revenue},${cohort.ltv}\n`;
  }
  writeFileSync(join(REPORTS_DIR, 'growth.csv'), csv);

  // Generate markdown report
  let markdown = `# Growth Report\n\n`;
  markdown += `Generated: ${report.timestamp}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- Total Users: ${totalUsers}\n`;
  markdown += `- Total Revenue: $${totalRevenue.toFixed(2)}\n`;
  markdown += `- Average LTV: $${avgLTV.toFixed(2)}\n\n`;
  markdown += `## Cohorts\n\n`;
  markdown += `| Cohort | Users | Revenue | LTV |\n`;
  markdown += `|--------|-------|---------|-----|\n`;
  for (const cohort of cohorts) {
    markdown += `| ${cohort.cohort} | ${cohort.users} | $${cohort.revenue.toFixed(2)} | $${cohort.ltv.toFixed(2)} |\n`;
  }

  writeFileSync(join(REPORTS_DIR, 'growth.md'), markdown);

  }

// Webhook adapters for ad platforms
async function setupWebhookAdapters(): Promise<void> {
  // TikTok webhook adapter
  // Meta webhook adapter
  // Google Ads webhook adapter
  
    // Implementation would create webhook endpoints
  }

if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'report') {
    generateGrowthReport().catch(error => {
      logger.error('Failed to generate report:', { error });
      process.exit(1);
    });
  } else if (command === 'webhooks') {
    setupWebhookAdapters().catch(error => {
      logger.error('Failed to setup webhooks:', { error });
      process.exit(1);
    });
  } else {
        process.exit(1);
  }
}

export { generateGrowthReport, calculateCohorts, normalizeUTM };
