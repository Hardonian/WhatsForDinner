/**
 * Partner hooks and integration contracts
 */
import { z } from 'zod';
export declare const PartnerWebhookSchema: z.ZodObject<{
    partner: z.ZodEnum<["tiktok", "meta", "stripe"]>;
    event: z.ZodString;
    timestamp: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    partner?: "meta" | "tiktok" | "stripe";
    data?: Record<string, any>;
    timestamp?: string;
    event?: string;
}, {
    partner?: "meta" | "tiktok" | "stripe";
    data?: Record<string, any>;
    timestamp?: string;
    event?: string;
}>;
export type PartnerWebhook = z.infer<typeof PartnerWebhookSchema>;
export declare function validatePartnerWebhook(payload: unknown): Promise<PartnerWebhook>;
export interface PartnerIntegration {
    name: string;
    webhookUrl: string;
    events: string[];
    auth: 'bearer' | 'basic' | 'custom';
}
export declare const partnerIntegrations: PartnerIntegration[];
//# sourceMappingURL=integrations.d.ts.map