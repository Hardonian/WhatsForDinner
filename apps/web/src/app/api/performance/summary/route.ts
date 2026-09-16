import { successResponse } from '@/lib/api/response';

export async function GET(request: NextRequest) {
  try {
    // Get performance summary
    const summary = performanceMonitor.getSummary();
    
    // Get cache stats
    const cacheStats = cache.getStats();

    return NextResponse.json(successResponse({
      performance: summary,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get performance summary',
        },
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
