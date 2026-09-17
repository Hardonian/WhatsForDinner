// @ts-nocheck
/**
 * Guardian Inspector Agent
 * Background agent that analyzes logs hourly and generates trust reports
 */
const fs = (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) ? (() => { try {
    return eval('require')('fs');
}
catch {
    return null;
} })() : null;
const path = (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) ? (() => { try {
    return eval('require')('path');
}
catch {
    return null;
} })() : null;
import { createComponentLogger } from '../logger';
const logger = createComponentLogger('inspector-ts');
export class GuardianInspector {
    logsDir;
    constructor(logsDir = './guardian/logs') {
        this.logsDir = logsDir;
    }
    /**
     * Analyze logs and generate trust report
     */
    async analyzeAndGenerateReport(userId, periodStart, periodEnd) {
        const ledgerPath = path.join(this.logsDir, `${userId}.jsonl`);
        if (!fs.existsSync(ledgerPath)) {
            return this.createEmptyReport(userId, periodStart, periodEnd);
        }
        const events = await this.loadEventsInPeriod(ledgerPath, periodStart, periodEnd);
        // Aggregate statistics
        const eventsByRisk = {
            low: 0,
            medium: 0,
            high: 0,
        };
        const eventsByClass = {};
        const eventsByScope = {};
        const actionsTaken = {};
        let totalRiskScore = 0;
        const anomalies = [];
        const policyChanges = [];
        for (const event of events) {
            // Count by risk level
            eventsByRisk[event.metadata.riskLevel]++;
            // Count by data class
            const dataClass = event.metadata.dataClass;
            eventsByClass[dataClass] = (eventsByClass[dataClass] || 0) + 1;
            // Count by scope
            eventsByScope[event.scope] = (eventsByScope[event.scope] || 0) + 1;
            // Count actions taken
            actionsTaken[event.guardianAction] = (actionsTaken[event.guardianAction] || 0) + 1;
            // Accumulate risk scores
            if (event.metadata.riskScore) {
                totalRiskScore += event.metadata.riskScore;
            }
            // Detect anomalies
            if (event.metadata.riskLevel === 'high' && event.guardianAction === 'block') {
                anomalies.push({
                    type: 'blocked_high_risk',
                    description: `High-risk ${event.metadata.dataClass} access was blocked`,
                    timestamp: event.timestamp,
                });
            }
            // Track policy changes
            if (event.type === 'policy_change') {
                policyChanges.push({
                    timestamp: event.timestamp,
                    change: JSON.stringify(event.metadata.updates || {}),
                });
            }
        }
        const totalEvents = events.length;
        const averageRiskScore = totalEvents > 0 ? totalRiskScore / totalEvents : 0;
        // Calculate trust score (inverse of average risk, normalized to 0-100)
        const trustScore = Math.max(0, 100 - averageRiskScore);
        // Calculate confidence score (% of safe operations)
        const safeOperations = events.filter((e) => e.metadata.riskLevel === 'low' && e.guardianAction === 'allow').length;
        const confidenceScore = totalEvents > 0 ? (safeOperations / totalEvents) * 100 : 100;
        const report = {
            userId,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            totalEvents,
            eventsByRisk,
            eventsByClass: eventsByClass,
            eventsByScope: eventsByScope,
            actionsTaken: actionsTaken,
            trustScore: Math.round(trustScore),
            anomalies,
            policyChanges,
            confidenceScore: Math.round(confidenceScore * 100) / 100,
            generatedAt: new Date().toISOString(),
        };
        return report;
    }
    async loadEventsInPeriod(ledgerPath, periodStart, periodEnd) {
        const content = fs.readFileSync(ledgerPath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        const events = [];
        for (const line of lines) {
            try {
                const entry = JSON.parse(line);
                const eventTimestamp = new Date(entry.timestamp);
                if (eventTimestamp >= periodStart && eventTimestamp <= periodEnd) {
                    // Convert ledger entry back to GuardianEvent format
                    const event = {
                        eventId: entry.eventId,
                        timestamp: entry.timestamp,
                        userId: '', // Will be set by caller
                        scope: entry.scope,
                        dataClass: entry.metadata.dataClass,
                        action: entry.metadata.action,
                        target: entry.metadata.target,
                        metadata: entry.metadata,
                        riskScore: entry.metadata.riskScore || 0,
                        riskLevel: entry.metadata.riskLevel || 'low',
                        guardianAction: entry.guardianAction,
                        explanation: entry.metadata.explanation || '',
                        fingerprint: entry.sha256,
                        previousHash: entry.previousHash,
                    };
                    events.push(event);
                }
            }
            catch (error) {
                if (process.env.NODE_ENV === 'development') {
                    logger.warn('Failed to parse ledger entry:', { error });
                }
            }
        }
        return events;
    }
    createEmptyReport(userId, periodStart, periodEnd) {
        return {
            userId,
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            totalEvents: 0,
            eventsByRisk: { low: 0, medium: 0, high: 0 },
            eventsByClass: {},
            eventsByScope: {},
            actionsTaken: {},
            trustScore: 100,
            anomalies: [],
            policyChanges: [],
            confidenceScore: 100,
            generatedAt: new Date().toISOString(),
        };
    }
    /**
     * Save trust report to file
     */
    async saveReport(report, outputPath) {
        const reportPath = outputPath || path.join(this.logsDir, `trust_report_${report.userId}_${Date.now()}.json`);
        const dir = path.dirname(reportPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
        return reportPath;
    }
    /**
     * Generate weekly markdown report
     */
    async generateWeeklyReport(report) {
        const weekStart = new Date(report.periodStart).toLocaleDateString();
        const weekEnd = new Date(report.periodEnd).toLocaleDateString();
        const markdown = `# Guardian Trust Report

**Period:** ${weekStart} - ${weekEnd}
**Generated:** ${new Date(report.generatedAt).toLocaleString()}

## Summary

- **Total Events:** ${report.totalEvents}
- **Trust Score:** ${report.trustScore}/100
- **Confidence Score:** ${report.confidenceScore}%

## Events by Risk Level

- **Low Risk:** ${report.eventsByRisk.low}
- **Medium Risk:** ${report.eventsByRisk.medium}
- **High Risk:** ${report.eventsByRisk.high}

## Events by Data Class

${Object.entries(report.eventsByClass)
            .map(([cls, count]) => `- **${cls}:** ${count}`)
            .join('\n')}

## Events by Scope

${Object.entries(report.eventsByScope)
            .map(([scope, count]) => `- **${scope}:** ${count}`)
            .join('\n')}

## Actions Taken

${Object.entries(report.actionsTaken)
            .map(([action, count]) => `- **${action}:** ${count}`)
            .join('\n')}

## Anomalies Detected

${report.anomalies.length === 0
            ? 'No anomalies detected.'
            : report.anomalies
                .map((a) => `- **${a.type}:** ${a.description} (${new Date(a.timestamp).toLocaleString()})`)
                .join('\n')}

## Policy Changes

${report.policyChanges.length === 0
            ? 'No policy changes.'
            : report.policyChanges
                .map((p) => `- ${new Date(p.timestamp).toLocaleString()}: ${p.change}`)
                .join('\n')}

## Guardian Confidence Score

${report.confidenceScore}% of operations were safe (low risk, allowed).

---

*This report was automatically generated by the Guardian system.*
`;
        return markdown;
    }
}
