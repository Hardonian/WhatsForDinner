import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved') === 'true';
    const severity = searchParams.get('severity');
    const limit = searchParams.get('limit');

    const alerts = await monitoringSystem.getAlerts(resolved);

    let filteredAlerts = alerts;

    if (severity) {
      filteredAlerts = filteredAlerts.filter(
        alert => alert.severity === severity
      );
    }

    if (limit) {
      filteredAlerts = filteredAlerts.slice(0, parseInt(limit));
    }

    // Group alerts by severity
    const groupedAlerts = filteredAlerts.reduce(
      (acc, alert) => {
        if (!acc[alert.severity]) {
          acc[alert.severity] = [];
        }
        acc[alert.severity]!.push(alert);
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Calculate statistics
    const stats = {
      total: filteredAlerts.length,
      resolved: filteredAlerts.filter(a => a.resolved).length,
      unresolved: filteredAlerts.filter(a => !a.resolved).length,
      bySeverity: Object.entries(groupedAlerts).reduce(
        (acc, [severity, alerts]) => {
          acc[severity] = alerts.length;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return new Response(
      JSON.stringify({
        alerts: filteredAlerts,
        grouped: groupedAlerts,
        stats,
        count: filteredAlerts.length,
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId || !action) {
      return new Response(
        JSON.stringify({
          error: 'Alert ID and action are required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (action === 'resolve') {
      await monitoringSystem.resolveAlert(alertId);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Alert resolved successfully',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: 'Invalid action. Supported actions: resolve',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
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
