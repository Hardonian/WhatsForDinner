/**
 * Experiment Service
 * Handles experiment assignment, exposure tracking, and guardrail monitoring
 * Privacy-safe: respects consent, no fingerprinting
 */
export interface ExperimentAssignment {
    experimentKey: string;
    variantKey: string;
    meta?: Record<string, unknown>;
}
export interface GuardrailCheck {
    experimentKey: string;
    metricName: string;
    value: number;
    threshold: number;
    direction: 'above' | 'below';
}
/**
 * Get or assign experiment variant for a subject
 * @param experimentKey - Experiment identifier
 * @param subjectId - User ID or anonymous ID
 * @param overrideVariant - Optional variant override for QA/testing (from header)
 * @param allowReassignment - If false and sticky=true, returns existing assignment
 */
export declare function assignExperiment(experimentKey: string, subjectId: string | null, overrideVariant?: string, allowReassignment?: boolean): Promise<ExperimentAssignment | null>;
/**
 * Batch assign multiple experiments
 */
export declare function assignExperiments(experimentKeys: string[], subjectId: string | null, overrides?: Record<string, string>): Promise<Record<string, ExperimentAssignment | null>>;
/**
 * Track experiment exposure (when user sees the variant)
 */
export declare function trackExposure(experimentKey: string, variantKey: string, subjectId: string | null, metadata?: Record<string, unknown>): Promise<void>;
/**
 * Check guardrail metrics and auto-pause if threshold breached
 */
export declare function checkGuardrails(experimentKey: string): Promise<boolean>;
/**
 * Auto-pause experiment if guardrail breached
 */
export declare function pauseExperimentIfNeeded(experimentKey: string): Promise<boolean>;
/**
 * Get experiment statistics (for dashboard)
 */
export declare function getExperimentStats(experimentKey: string): Promise<{
    experiment: any;
    variants: any;
    assignments: any;
} | null>;
/**
 * Minimum sample size calculator (for power analysis)
 */
export declare function calculateMinSampleSize(baselineRate: number, mde: number, // Minimum Detectable Effect (e.g., 0.05 for 5%)
power?: number, alpha?: number): number;
//# sourceMappingURL=service.d.ts.map