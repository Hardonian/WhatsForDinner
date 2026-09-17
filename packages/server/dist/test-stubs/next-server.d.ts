export declare class NextResponse {
    status: number;
    private data;
    headers: Headers;
    constructor(body?: any, init?: any);
    static json(data: any, init?: any): NextResponse;
    json(): Promise<any>;
}
export type NextRequest = any;
//# sourceMappingURL=next-server.d.ts.map