/**
 * Guardian Core Service
 * Monitors data access, assesses risk, and enforces privacy boundaries
 */
import type { GuardianEvent, RiskAssessment, PolicyConfig, DataScope } from './types';
export declare class Guardian {
    assessRisk(event: GuardianEvent): Promise<RiskAssessment>;
}
export declare class GuardianInspector {
    inspect(event: GuardianEvent): Promise<RiskAssessment>;
}
export declare class GuardianGPT {
    analyze(event: GuardianEvent): Promise<{
        analysis: string;
        event: GuardianEvent;
    }>;
}
export declare function createGuardianMiddleware(): (request: Request) => Promise<any>;
export type { GuardianEvent, RiskAssessment, PolicyConfig, DataScope };
//# sourceMappingURL=core.d.ts.map