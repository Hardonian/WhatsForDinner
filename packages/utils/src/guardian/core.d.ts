/**
 * Guardian Core Service
 * Monitors data access, assesses risk, and enforces privacy boundaries
 */
import type { GuardianEvent, RiskAssessment, PolicyConfig, DataScope } from './types';
export declare class Guardian {
    assessRisk(event: GuardianEvent): Promise<RiskAssessment>;
}
export type { GuardianEvent, RiskAssessment, PolicyConfig, DataScope };
//# sourceMappingURL=core.d.ts.map