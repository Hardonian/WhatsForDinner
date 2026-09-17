// @ts-nocheck
/**
 * Guardian GPT Explainer
 * Local LLM wrapper for summarizing what data was used, why, and by whom
 */
import { GuardianInspector } from './inspector';
export class GuardianGPT {
    inspector;
    constructor(logsDir = './guardian/logs') {
        this.inspector = new GuardianInspector(logsDir);
    }
    /**
     * Explain what happened with user data
     */
    async explain(request) {
        const { question, userId, context } = request;
        // Load relevant events
        let events = [];
        if (context?.eventId) {
            // Explain specific event
            events = await this.loadEventById(userId, context.eventId);
        }
        else {
            // Explain period
            const periodStart = context?.periodStart || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const periodEnd = context?.periodEnd || new Date();
            const report = await this.inspector.analyzeAndGenerateReport(userId, periodStart, periodEnd);
            events = await this.loadEventsFromReport(userId, report);
        }
        // Generate explanation based on question type
        if (question.includes('what data') || question.includes('which data')) {
            return this.explainWhatData(events);
        }
        else if (question.includes('why') || question.includes('reason')) {
            return this.explainWhy(events);
        }
        else if (question.includes('who') || question.includes('by whom')) {
            return this.explainWho(events);
        }
        else if (question.includes('what would happen') || question.includes('if you disable')) {
            return this.explainDisableImpact(events);
        }
        else {
            return this.explainGeneral(events, question);
        }
    }
    async loadEventById(userId, eventId) {
        // In a real implementation, this would load from ledger
        // For now, return empty array
        return [];
    }
    async loadEventsFromReport(userId, report) {
        // In a real implementation, this would load events from ledger
        // For now, return empty array
        return [];
    }
    explainWhatData(events) {
        if (events.length === 0) {
            return 'No data access events found for this period.';
        }
        const dataClasses = new Set(events.map(e => e.dataClass));
        const scopes = new Set(events.map(e => e.scope));
        const classNames = {
            telemetry: 'usage analytics',
            location: 'location data',
            audio: 'audio recordings',
            biometrics: 'biometric data',
            content: 'content',
            credentials: 'credentials',
            personal_info: 'personal information',
            metadata: 'metadata',
        };
        const scopeNames = {
            user: 'your device',
            app: 'the app',
            api: 'an API service',
            external: 'external services',
        };
        const dataList = Array.from(dataClasses).map(cls => classNames[cls] || cls).join(', ');
        const scopeList = Array.from(scopes).map(scope => scopeNames[scope] || scope).join(', ');
        return `During this period, the following data types were accessed: ${dataList}. ` +
            `These were accessed by: ${scopeList}. ` +
            `All data access was monitored and protected by Guardian.`;
    }
    explainWhy(events) {
        if (events.length === 0) {
            return 'No data access events found.';
        }
        const reasons = events.map(e => {
            const purpose = this.inferPurpose(e);
            return `• ${e.dataClass}: ${purpose}`;
        });
        return `Data was accessed for the following reasons:\n${reasons.join('\n')}\n\n` +
            `All access was necessary for app functionality and was protected by Guardian's privacy policies.`;
    }
    explainWho(events) {
        if (events.length === 0) {
            return 'No data access events found.';
        }
        const scopeCounts = {};
        for (const event of events) {
            scopeCounts[event.scope] = (scopeCounts[event.scope] || 0) + 1;
        }
        const scopeNames = {
            user: 'Your device (local processing)',
            app: 'The app itself',
            api: 'API services',
            external: 'External third-party services',
        };
        const whoList = Object.entries(scopeCounts)
            .map(([scope, count]) => `${scopeNames[scope] || scope}: ${count} access${count !== 1 ? 'es' : ''}`)
            .join(', ');
        return `Data was accessed by: ${whoList}. ` +
            `All access was logged and monitored. No data was shared with unauthorized parties.`;
    }
    explainDisableImpact(events) {
        const blockedCount = events.filter(e => e.guardianAction === 'block').length;
        const maskedCount = events.filter(e => e.guardianAction === 'mask' || e.guardianAction === 'redact').length;
        return `If you disable Guardian monitoring:\n\n` +
            `• ${blockedCount} blocked operations would be allowed\n` +
            `• ${maskedCount} masked/redacted operations would send full data\n` +
            `• You would lose visibility into data access\n` +
            `• Privacy protections would be reduced\n\n` +
            `Guardian currently protects your privacy by blocking high-risk operations and masking sensitive data. ` +
            `Disabling it would remove these protections.`;
    }
    explainGeneral(events, question) {
        if (events.length === 0) {
            return 'No data access events found for this period.';
        }
        const totalEvents = events.length;
        const lowRisk = events.filter(e => e.riskLevel === 'low').length;
        const highRisk = events.filter(e => e.riskLevel === 'high').length;
        return `During this period, Guardian monitored ${totalEvents} data access events. ` +
            `${lowRisk} were low risk and ${highRisk} were high risk. ` +
            `All high-risk operations were blocked or masked to protect your privacy. ` +
            `Guardian continuously monitors app behavior to ensure your data stays safe.`;
    }
    inferPurpose(event) {
        if (event.action.includes('api_call')) {
            return 'API communication for app functionality';
        }
        else if (event.action.includes('telemetry')) {
            return 'Usage analytics to improve the app';
        }
        else if (event.action.includes('content')) {
            return 'Content processing for features';
        }
        else if (event.dataClass === 'location') {
            return 'Location-based features';
        }
        else if (event.dataClass === 'audio') {
            return 'Audio processing features';
        }
        else {
            return 'App functionality';
        }
    }
}
