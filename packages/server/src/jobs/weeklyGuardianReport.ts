// @ts-nocheck
/**
 * Weekly Report Generation Job
 * Runs weekly to generate and store trust reports
 */

import { GuardianInspector } from '@whats-for-dinner/utils/guardian';
import * as fs from 'fs';
import * as path from 'path';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('weeklyguardianreport-ts');
export async function generateWeeklyReports(): Promise<void> {
  const logsDir = './guardian/logs';
  const reportsDir = './guardian/reports';

  if (!fs.existsSync(logsDir)) {
        return;
  }

  // Ensure reports directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const inspector = new GuardianInspector(logsDir);
  const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.jsonl'));

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let reportsGenerated = 0;

  for (const file of files) {
    try {
      const userId = file.replace('.jsonl', '');
      
      // Generate report
      const report = await inspector.analyzeAndGenerateReport(userId, weekStart, now);

      // Save JSON report
      const jsonPath = path.join(reportsDir, `trust_report_${userId}_${Date.now()}.json`);
      await inspector.saveReport(report, jsonPath);

      // Generate and save markdown report
      const markdown = await inspector.generateWeeklyReport(report);
      const mdPath = path.join(reportsDir, `trust_report_${userId}_${Date.now()}.md`);
      await fs.promises.writeFile(mdPath, markdown, 'utf-8');

      reportsGenerated++;

          } catch (error) {
      logger.error('Failed to generate report for ${file}:', { error });
    }
  }

  }

// Run if called directly
if (require.main === module) {
  generateWeeklyReports()
    .then(() => {
            process.exit(0);
    })
    .catch((error) => {
      // Error handled: Weekly report generation failed:
      process.exit(1);
    });
}
