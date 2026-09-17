export class NextResponse {
    status;
    data;
    headers;
    constructor(body, init) {
        this.data = body;
        this.status = init?.status || 200;
        this.headers = new Headers(init?.headers);
    }
    static json(data, init) {
        const res = new NextResponse(data, init);
        res.data = data;
        return res;
    }
    async json() {
        return this.data;
    }
}
