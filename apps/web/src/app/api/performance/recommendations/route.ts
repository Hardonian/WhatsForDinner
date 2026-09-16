import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');

    let recommendations;

    if (priority) {
      recommendations = performanceOptimizer.getRecommendationsByPriority(
        priority as any
      );
    } else if (type) {
      recommendations = performanceOptimizer.getRecommendationsByType(
        type as any
      );
    } else {
      recommendations = performanceOptimizer.getRecommendations();
    }

    return new Response(
      JSON.stringify({
        recommendations,
        count: recommendations.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export const dynamic = "force-dynamic";
