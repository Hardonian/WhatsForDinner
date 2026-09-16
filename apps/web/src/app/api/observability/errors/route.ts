import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = searchParams.get('limit');

    const filters: any = {};
    if (severity) filters.severity = severity;
    if (startTime) filters.startTime = startTime;
    if (endTime) filters.endTime = endTime;
    if (limit) filters.limit = parseInt(limit);

    const errors = await observabilitySystem.getErrors(filters);

    // Group errors by severity
    const groupedErrors = errors.reduce(
      (acc, error) => {
        if (!acc[error.severity]) {
          acc[error.severity] = [];
        }
        acc[error.severity].push(error);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Group errors by name
    const groupedByName = errors.reduce(
      (acc, error) => {
        if (!acc[error.name]) {
          acc[error.name] = [];
        }
        acc[error.name].push(error);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Calculate statistics
    const stats = {
      total: errors.length,
      bySeverity: Object.entries(groupedErrors).reduce(
        (acc, [severity, errorList]) => {
          acc[severity] = (errorList as any[]).length;
          return acc;
        },
        {} as Record<string, number>
      ),
      byName: Object.entries(groupedByName).reduce(
        (acc, [name, errorList]) => {
          acc[name] = (errorList as any[]).length;
          return acc;
        },
        {} as Record<string, number>
      ),
      recent: errors.slice(0, 10).map(error => ({
        id: error.id,
        name: error.name,
        message: error.message,
        severity: error.severity,
        timestamp: error.timestamp,
      })),
    };

    return new Response(
      JSON.stringify({
        errors,
        grouped: {
          bySeverity: groupedErrors,
          byName: groupedByName,
        },
        stats,
        count: errors.length,
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
