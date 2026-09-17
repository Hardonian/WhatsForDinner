/**
 * Guardian Integration Patterns
 * Composable patterns for integrating Guardian into various parts of the app
 */
import { createGuardianMiddleware } from './middleware';
import { TrustFabricAI } from './trust-fabric';
import type { DataScope, DataClass } from './types';
export declare function withGuardian<T extends any[]>(handler: (...args: T) => Promise<Response>, options: {
    userId: string;
    scope: DataScope;
    dataClass: DataClass;
    target: string;
}): (...args: T) => Promise<Response>;
/**
 * Pattern 2: React Hook Integration
 * Use Guardian in React components
 */
export declare function useGuardian(userId: string): {
    guardian: import("./middleware").GuardianMiddleware;
    insurance: any;
    trustFabric: TrustFabricAI;
    trackEvent: (scope: DataScope, dataClass: DataClass, action: string, target: string, metadata?: Record<string, unknown>) => Promise<{
        allowed: boolean;
        action: string;
        explanation: string;
        riskLevel: string;
    }>;
    togglePrivateMode: () => void;
    activateLockdown: () => Promise<void>;
    getRecommendations: () => {
        tighten: DataClass[];
        loosen: DataClass[];
        rationale: string;
    };
};
/**
 * Pattern 3: Server Action Integration
 * Protect server actions with Guardian
 */
export declare function guardServerAction<T extends any[], R>(action: (...args: T) => Promise<R>, options: {
    userId: string;
    scope: DataScope;
    dataClass: DataClass;
    actionName: string;
}): (...args: T) => Promise<R>;
/**
 * Pattern 4: Component-Level Explainability
 * Add explainability tooltips to UI components
 */
export declare function useExplainability(userId: string): {
    explain: (question: string, context?: {
        eventId?: string;
        periodStart?: Date;
        periodEnd?: Date;
    }) => Promise<{
        answer: string;
        sources: never[];
    }>;
    getFeatureExplanation: (featureId: string) => {
        featureId: string;
        dataUsed: string[];
        purpose: string;
        explanation: string;
    };
};
/**
 * Pattern 5: Batch Event Processing
 * Process multiple events efficiently
 */
export declare class GuardianBatchProcessor {
    private guardian;
    private queue;
    constructor(userId: string);
    addEvent(scope: DataScope, dataClass: DataClass, action: string, target: string, metadata?: Record<string, unknown>): void;
    processBatch(): Promise<void>;
    flush(): Promise<void>;
}
/**
 * Pattern 6: Optimized Guardian Instance Management
 * Cache and reuse Guardian instances
 */
declare class GuardianInstanceManager {
    private instances;
    getInstance(userId: string): ReturnType<typeof createGuardianMiddleware>;
    clearInstance(userId: string): void;
    clearAll(): void;
}
export declare const guardianManager: GuardianInstanceManager;
export {};
//# sourceMappingURL=integration-patterns.d.ts.map