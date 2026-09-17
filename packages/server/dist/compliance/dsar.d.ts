/**
 * Compliance guard - data inventory and DSAR
 */
export declare function generateDataInventory(): Promise<string>;
export declare function handleDSAR(userId: string, action: 'export' | 'delete'): Promise<{
    user: any;
    events: any[] | null;
    exportedAt: string;
} | {
    deleted: boolean;
} | undefined>;
export declare function redactLogs(logContent: string): string;
//# sourceMappingURL=dsar.d.ts.map