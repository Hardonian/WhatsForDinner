/**
 * Regulatory Reporting Routes
 *
 * Generate monthly regulatory reports (GDPR, CPRA, CCPA) with metrics
 * Export as signed JSON + CSV for auditors
 */
import type { NextRequest } from 'next/server';
/**
 * Generate monthly regulatory report
 */
export declare function generateRegulatoryReport(periodStart: Date, periodEnd: Date, region: 'gdpr' | 'ccpa' | 'cpra' | 'other'): Promise<{
    reportId: string;
    url: string;
    checksum: string;
}>;
/**
 * GET /api/admin/reports/regulatory
 * List regulatory reports
 */
export declare function GET(request: NextRequest): Promise<any>;
/**
 * POST /api/admin/reports/regulatory/generate
 * Generate new regulatory report
 */
export declare function generateReport(request: NextRequest): Promise<any>;
/**
 * GET /api/admin/reports/regulatory/:id/download
 * Download report (JSON + CSV with signature)
 */
export declare function downloadReport(request: NextRequest): Promise<any>;
//# sourceMappingURL=reports.regulatory.d.ts.map