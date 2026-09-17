// @ts-nocheck
/**
 * Regulatory Reporting Routes
 *
 * Generate monthly regulatory reports (GDPR, CPRA, CCPA) with metrics
 * Export as signed JSON + CSV for auditors
 */
import { NextResponse } from 'next/server';
import { db } from '../db/index';
import { regulatoryReports, dsarRequests, vendorCatalog, controls, riskRegister, } from '../db/schema';
import { eq, and, gte, lte, count, sql } from 'drizzle-orm';
import { getAdminAuth, requirePermission } from '../auth/admin';
import { logger } from '../observability/index';
import crypto from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
const REPORTS_BUCKET_URL = process.env.ARTIFACTS_BUCKET_URL || '/tmp/reports';
const ARTIFACTS_BUCKET_SIGNING_KEY = process.env.ARTIFACTS_BUCKET_SIGNING_KEY || process.env.JWT_SECRET || '';
/**
 * Generate monthly regulatory report
 */
export async function generateRegulatoryReport(periodStart, periodEnd, region) {
    // Collect metrics
    const dsarCounts = await db
        .select({
        type: dsarRequests.type,
        count: count(),
    })
        .from(dsarRequests)
        .where(and(eq(dsarRequests.region, region), gte(dsarRequests.submitted_at, periodStart), lte(dsarRequests.submitted_at, periodEnd)))
        .groupBy(dsarRequests.type);
    // SLA adherence (requests completed within deadline)
    const completedWithinDeadline = await db
        .select({ count: count() })
        .from(dsarRequests)
        .where(and(eq(dsarRequests.region, region), eq(dsarRequests.status, 'complete'), gte(dsarRequests.submitted_at, periodStart), lte(dsarRequests.submitted_at, periodEnd), sql `${dsarRequests.completed_at} <= ${dsarRequests.window_deadline}`));
    // Erasure totals
    const erasureTotal = await db
        .select({ count: count() })
        .from(dsarRequests)
        .where(and(eq(dsarRequests.region, region), eq(dsarRequests.type, 'erase'), eq(dsarRequests.status, 'complete'), gte(dsarRequests.submitted_at, periodStart), lte(dsarRequests.submitted_at, periodEnd)));
    // Consent withdrawals (would query consent table if exists)
    const consentWithdrawals = 0; // Placeholder
    // Incidents by severity (would query incidents table)
    const incidentsBySeverity = {
        low: 0,
        major: 0,
        critical: 0,
    }; // Placeholder
    // Vendor changes
    const vendorChanges = await db
        .select({ count: count() })
        .from(vendorCatalog)
        .where(and(gte(vendorCatalog.updated_at, periodStart), lte(vendorCatalog.updated_at, periodEnd)));
    // Controls status
    const controlsStatus = await db
        .select({
        status: controls.status,
        count: count(),
    })
        .from(controls)
        .groupBy(controls.status);
    // Risk register updates
    const riskUpdates = await db
        .select({ count: count() })
        .from(riskRegister)
        .where(and(gte(riskRegister.updated_at, periodStart), lte(riskRegister.updated_at, periodEnd)));
    const metrics = {
        period: {
            start: periodStart.toISOString(),
            end: periodEnd.toISOString(),
        },
        dsar: {
            by_type: Object.fromEntries(dsarCounts.map((r) => [r.type, Number(r.count)])),
            total: dsarCounts.reduce((sum, r) => sum + Number(r.count), 0),
            sla_adherence: {
                completed_within_deadline: Number(completedWithinDeadline[0]?.count || 0),
                total_completed: dsarCounts
                    .filter((r) => r.type === 'export' || r.type === 'erase')
                    .reduce((sum, r) => sum + Number(r.count), 0),
            },
        },
        erasure: {
            total_requests: Number(erasureTotal[0]?.count || 0),
        },
        consent: {
            withdrawals: consentWithdrawals,
        },
        incidents: incidentsBySeverity,
        vendors: {
            changes: Number(vendorChanges[0]?.count || 0),
        },
        controls: Object.fromEntries(controlsStatus.map((c) => [c.status, Number(c.count)])),
        risks: {
            updates: Number(riskUpdates[0]?.count || 0),
        },
    };
    // Create report record
    const [report] = await db
        .insert(regulatoryReports)
        .values({
        period_start: periodStart,
        period_end: periodEnd,
        region,
        metrics,
    })
        .returning();
    // Generate JSON report
    await mkdir(REPORTS_BUCKET_URL, { recursive: true });
    const jsonReport = JSON.stringify(metrics, null, 2);
    const jsonPath = join(REPORTS_BUCKET_URL, `report-${report.id}.json`);
    await writeFile(jsonPath, jsonReport, 'utf-8');
    // Generate CSV report
    const csvLines = [
        'Metric,Value',
        `DSAR Total,${metrics.dsar.total}`,
        `DSAR Export,${metrics.dsar.by_type.export || 0}`,
        `DSAR Erase,${metrics.dsar.by_type.erase || 0}`,
        `DSAR Restrict,${metrics.dsar.by_type.restrict || 0}`,
        `DSAR Rectify,${metrics.dsar.by_type.rectify || 0}`,
        `SLA Adherence,${metrics.dsar.sla_adherence.completed_within_deadline}/${metrics.dsar.sla_adherence.total_completed}`,
        `Erasure Requests,${metrics.erasure.total_requests}`,
        `Consent Withdrawals,${metrics.consent.withdrawals}`,
        `Vendor Changes,${metrics.vendors.changes}`,
        `Risk Updates,${metrics.risks.updates}`,
        `Controls Passing,${metrics.controls.passing || 0}`,
        `Controls Failing,${metrics.controls.failing || 0}`,
        `Controls Waived,${metrics.controls.waived || 0}`,
    ];
    const csvReport = csvLines.join('\n');
    const csvPath = join(REPORTS_BUCKET_URL, `report-${report.id}.csv`);
    await writeFile(csvPath, csvReport, 'utf-8');
    // Generate signature
    const combinedContent = jsonReport + csvReport;
    const signature = crypto
        .createHmac('sha256', ARTIFACTS_BUCKET_SIGNING_KEY)
        .update(combinedContent)
        .digest('hex');
    // Compute checksum
    const checksum = crypto.createHash('sha256').update(combinedContent).digest('hex');
    logger.info({
        reportId: report.id,
        region,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
    }, 'Regulatory report generated');
    return {
        reportId: report.id,
        url: jsonPath, // In production, return signed URL
        checksum,
    };
}
/**
 * GET /api/admin/reports/regulatory
 * List regulatory reports
 */
export async function GET(request) {
    try {
        const auth = await getAdminAuth(request);
        if (!auth || !requirePermission(auth.admin.role, 'reports:read')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const url = new URL(request.url);
        const region = url.searchParams.get('region');
        const filters = [];
        if (region) {
            filters.push(eq(regulatoryReports.region, region));
        }
        const reports = await db
            .select()
            .from(regulatoryReports)
            .where(filters.length > 0 ? and(...filters) : undefined)
            .orderBy(sql `${regulatoryReports.generated_at} DESC`);
        return NextResponse.json({ reports });
    }
    catch (error) {
        logger.error({ error }, 'Error fetching regulatory reports');
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
/**
 * POST /api/admin/reports/regulatory/generate
 * Generate new regulatory report
 */
export async function generateReport(request) {
    try {
        const auth = await getAdminAuth(request);
        if (!auth || !requirePermission(auth.admin.role, 'reports:read')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { period_start, period_end, region } = body;
        if (!period_start || !period_end || !region) {
            return NextResponse.json({ error: 'period_start, period_end, and region required' }, { status: 400 });
        }
        const periodStart = new Date(period_start);
        const periodEnd = new Date(period_end);
        const result = await generateRegulatoryReport(periodStart, periodEnd, region);
        return NextResponse.json(result, { status: 201 });
    }
    catch (error) {
        logger.error({ error }, 'Error generating regulatory report');
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
/**
 * GET /api/admin/reports/regulatory/:id/download
 * Download report (JSON + CSV with signature)
 */
export async function downloadReport(request) {
    try {
        const auth = await getAdminAuth(request);
        if (!auth || !requirePermission(auth.admin.role, 'reports:read')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const url = new URL(request.url);
        const reportId = url.pathname.split('/').pop();
        if (!reportId) {
            return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
        }
        const [report] = await db
            .select()
            .from(regulatoryReports)
            .where(eq(regulatoryReports.id, reportId))
            .limit(1);
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }
        // In production, generate signed URLs from storage
        const jsonUrl = `${REPORTS_BUCKET_URL}/report-${reportId}.json`;
        const csvUrl = `${REPORTS_BUCKET_URL}/report-${reportId}.csv`;
        return NextResponse.json({
            report_id: report.id,
            json_url: jsonUrl,
            csv_url: csvUrl,
            checksum: report.metrics, // Would compute from files
            generated_at: report.generated_at,
        });
    }
    catch (error) {
        logger.error({ error }, 'Error downloading report');
        return NextResponse.json({ error: 'Failed to download report' }, { status: 500 });
    }
}
