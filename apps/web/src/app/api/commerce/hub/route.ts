import { z } from 'zod';

const CommerceHubRequestSchema = z.object({
  action: z.enum([
    'summary',
    'reconcile',
    'pricing_suggestion',
    'revenue_analysis',
  ]),
  period: z.string().optional().default('30d'),
  region: z.string().optional().default('global'),
  tenant_id: z.string().optional(),
  partner_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate and get tenant context (validates user access)
    const tenantResult = await getTenantContext(req);
    if (!tenantResult.success) {
      return tenantResult.response;
    }

    const { tenantId: requestTenantId } = tenantResult;

    const body = await req.json();
    const { action, period, region, partner_id } =
      CommerceHubRequestSchema.parse(body);

    // Initialize AI Commerce Hub
    const commerceHub = new AICommerceHub();

    let result: any;

    switch (action) {
      case 'summary':
        result = await commerceHub.getFinancialSummary(
          requestTenantId,
          period,
          region
        );
        break;
      case 'reconcile':
        result = await commerceHub.reconcileInvoices(requestTenantId, period);
        break;
      case 'pricing_suggestion':
        result = await commerceHub.getPricingSuggestions(
          requestTenantId,
          region
        );
        break;
      case 'revenue_analysis':
        result = await commerceHub.analyzeRevenueStreams(
          requestTenantId,
          period,
          partner_id
        );
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
      metadata: {
        period,
        region,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Error handled: Commerce Hub error:

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Commerce Hub request failed' },
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

    const { tenantId: requestTenantId } = tenantResult;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'summary';
    const period = searchParams.get('period') || '30d';
    const region = searchParams.get('region') || 'global';

    // Initialize AI Commerce Hub
    const commerceHub = new AICommerceHub();

    let result: any;

    switch (action) {
      case 'summary':
        result = await commerceHub.getFinancialSummary(
          requestTenantId,
          period,
          region
        );
        break;
      case 'pricing_suggestion':
        result = await commerceHub.getPricingSuggestions(
          requestTenantId,
          region
        );
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
      metadata: {
        period,
        region,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Error handled: Commerce Hub GET error:
    return NextResponse.json(
      { error: 'Commerce Hub request failed' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
