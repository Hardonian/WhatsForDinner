import { withPerformanceMonitoring } from '@/lib/performance-monitor';

// v1 implementation (legacy)
async function v1Handler(request: Request): Promise<Response> {
  return Response.json({
    version: 'v1',
    message: 'This is the v1 API. Consider migrating to v2.',
    data: [],
  });
}

// v2 implementation (current)
async function v2Handler(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    // Get recipes with pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    return Response.json({
      version: 'v2',
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });
  }

  if (request.method === 'POST') {
    // Create recipe with validation
    const validation = await validateRequest(request, createRecipeSchema);
    if (validation.error) {
      return validation.error;
    }

    return Response.json({
      version: 'v2',
      success: true,
      data: validation.data,
    });
  }

  return Response.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

// Versioned handler
export const GET = withVersionHeaders(
  withRateLimit(
    createVersionedHandler({
      v1: v1Handler,
      v2: v2Handler,
    }),
    apiRateLimiter
  )
);

export const POST = withVersionHeaders(
  withRateLimit(
    createVersionedHandler({
      v1: v1Handler,
      v2: v2Handler,
    }),
    apiRateLimiter
  )
);

export const dynamic = "force-dynamic";
