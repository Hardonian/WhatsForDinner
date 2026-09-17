// @ts-nocheck
/**
 * Guardian Middleware
 * Hooks into telemetry events and monitors data access
 */
import { Guardian } from './core';
import { createComponentLogger } from '../logger';
const logger = createComponentLogger('middleware-ts');
export class GuardianMiddleware {
    guardian;
    enabled = true;
    constructor(userId, ledgerDir) {
        this.guardian = new Guardian(userId, ledgerDir);
    }
    /**
     * Enable or disable Guardian monitoring
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Process a telemetry event
     */
    async processTelemetryEvent(event) {
        if (!this.enabled) {
            return {
                allowed: true,
                action: 'allow',
                explanation: 'Guardian monitoring is disabled',
                riskLevel: 'low',
            };
        }
        const guardianEvent = await this.guardian.processEvent(event.userId, event.scope, event.dataClass, event.action, event.target, event.metadata || {});
        const allowed = guardianEvent.guardianAction === 'allow';
        return {
            allowed,
            action: guardianEvent.guardianAction,
            explanation: guardianEvent.explanation,
            riskLevel: guardianEvent.riskLevel,
        };
    }
    /**
     * Create a middleware wrapper for API calls
     */
    wrapApiCall(userId, apiCall, scope, dataClass, target, metadata) {
        return this.guardian.processEvent(userId, scope, dataClass, 'api_call', target, metadata || {}).then(async (event) => {
            if (event.guardianAction === 'block' || event.guardianAction === 'alert') {
                throw new Error(`Guardian blocked API call: ${event.explanation}`);
            }
            // Mask or redact data if needed
            if (event.guardianAction === 'mask' || event.guardianAction === 'redact') {
                // Data masking would happen here
                if (process.env.NODE_ENV === 'development') {
                    logger.warn('Guardian masked/redacted data:', { explanation: event.explanation });
                }
            }
            return apiCall();
        });
    }
    /**
     * Check if sensitive context is active (camera, microphone, etc.)
     */
    checkSensitiveContext() {
        // In a real implementation, this would check browser APIs
        // For now, return mock values
        return {
            cameraActive: false,
            microphoneActive: false,
            locationActive: false,
        };
    }
    /**
     * Get Guardian instance
     */
    getGuardian() {
        return this.guardian;
    }
}
/**
 * Create Guardian middleware instance
 */
export function createGuardianMiddleware(userId, ledgerDir) {
    return new GuardianMiddleware(userId, ledgerDir);
}
