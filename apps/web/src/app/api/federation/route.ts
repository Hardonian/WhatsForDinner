import { z } from 'zod';

const FederationRequestSchema = z.object({
  partner: z.string(),
  endpoint: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  data: z.record(z.any()).optional(),
  headers: z.record(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate and get tenant context (validates user access)
    const tenantResult = await getTenantContext(req);
    if (!tenantResult.success) {
      return tenantResult.response;
    }

    const { context, tenantId } = tenantResult;
    const { user } = context;

    const body = await req.json();
    const {
      partner,
      endpoint,
      method,
      data,
      headers: customHeaders,
      metadata,
    } = FederationRequestSchema.parse(body);

    const requestId = crypto.randomUUID();

    // Initialize federated gateway
    const gateway = new FederatedAPIGateway();

    // Route request through federated gateway
    const result = await gateway.routeRequest({
      partner,
      endpoint,
      method,
      data: data || {},
      headers: customHeaders || {},
      metadata: metadata || {},
      tenantId,
      userId: user.id,
      requestId,
    });

    return NextResponse.json(result);
  } catch (error) {
    // Error handled: Federation API error:

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Federation request failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate and get tenant context (validates user access)
    const tenantResult = await getTenantContext(req);
    if (!tenantResult.success) {
      return tenantResult.response;
    }

    const { context, tenantId } = tenantResult;
    const { user } = context;

    const { searchParams } = new URL(req.url);
    const partner = searchParams.get('partner');
    const endpoint = searchParams.get('endpoint');

    if (!partner || !endpoint) {
      return NextResponse.json(
        { error: 'Partner and endpoint parameters required' },
        { status: 400 }
      );
    }

    const requestId = crypto.randomUUID();

    // Initialize federated gateway
    const gateway = new FederatedAPIGateway();

    // Route GET request
    const result = await gateway.routeRequest({
      partner,
      endpoint,
      method: 'GET',
      tenantId,
      userId: user.id,
      requestId,
    });

    return NextResponse.json(result);
  } catch (error) {
    // Error handled: Federation GET error:
    return NextResponse.json(
      { error: 'Federation request failed' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
