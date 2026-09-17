export class NextResponse {
  status: number;
  private data: any;
  headers: Headers;

  constructor(body?: any, init?: any) {
    this.data = body;
    this.status = init?.status || 200;
    this.headers = new Headers(init?.headers);
  }

  static json(data: any, init?: any) {
    const res = new NextResponse(data, init);
    (res as any).data = data;
    return res;
  }

  async json() {
    return this.data;
  }
}

export type NextRequest = any;
