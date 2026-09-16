import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (!type) {
      return new Response(
        JSON.stringify({
          error: 'Optimization type is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    switch (type) {
      case 'bundle':
        await performanceOptimizer.optimizeBundle();
        break;
      case 'image':
        await performanceOptimizer.optimizeImages();
        break;
      case 'caching':
        await performanceOptimizer.optimizeCaching();
        break;
      default:
        return new Response(
          JSON.stringify({
            error:
              'Invalid optimization type. Supported types: bundle, image, caching',
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${type} optimization completed successfully`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
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
