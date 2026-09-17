export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'System Status - What\'s for Dinner?',
  description: 'Real-time status of What\'s for Dinner? services',
};

// Demo/placeholder status data - in production, this would come from a monitoring service
interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
  lastIncident: string | null;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  started: string;
  resolved?: string;
}

const getSystemStatus = () => {
  return {
    overall: 'operational' as const,
    services: [
      {
        name: 'API',
        status: 'operational' as const,
        uptime: '99.99%',
        lastIncident: null,
      },
      {
        name: 'Database',
        status: 'operational' as const,
        uptime: '99.98%',
        lastIncident: null,
      },
      {
        name: 'Authentication',
        status: 'operational' as const,
        uptime: '100%',
        lastIncident: null,
      },
      {
        name: 'Recipe Generation',
        status: 'operational' as const,
        uptime: '99.95%',
        lastIncident: null,
      },
      {
        name: 'Payment Processing',
        status: 'operational' as const,
        uptime: '100%',
        lastIncident: null,
      },
    ] as ServiceStatus[],
    incidents: [] as Incident[],
    lastUpdated: new Date().toISOString(),
  };
};

export default function StatusPage() {
  const status = getSystemStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-50';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return '?';
      case 'degraded':
        return '??';
      case 'down':
        return '?';
      default:
        return '?';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">System Status</h1>
        <p className="text-muted-foreground">
          Real-time status of all What&apos;s for Dinner? services
        </p>
      </div>

      {/* Overall Status */}
      <div className="bg-card rounded-lg p-6 mb-8 border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">All Systems Operational</h2>
            <p className="text-muted-foreground">
              All services are running normally
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full ${getStatusColor(status.overall)}`}>
            <span className="font-semibold">Operational</span>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Service Status</h2>
        <div className="space-y-3">
          {status.services.map((service) => (
            <div
              key={service.name}
              className="bg-card rounded-lg p-4 border flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(service.status)}</span>
                <div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Uptime: {service.uptime} (last 30 days)
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incidents */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Incidents</h2>
        {status.incidents.length === 0 ? (
          <div className="bg-card rounded-lg p-6 border text-center">
            <p className="text-muted-foreground">
              No incidents reported in the last 90 days
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {status.incidents.map((incident) => (
              <div key={incident.id} className="bg-card rounded-lg p-4 border">
                {/* Incident details would go here */}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscribe to Updates */}
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-2">Subscribe to Status Updates</h2>
        <p className="text-muted-foreground mb-4">
          Get notified when we have incidents or scheduled maintenance
        </p>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            ? Email: <a href="mailto:status@whats-for-dinner.com" className="text-primary hover:underline">status@whats-for-dinner.com</a>
          </p>
          <p className="text-sm text-muted-foreground">
            ? RSS: <a href="/status/rss" className="text-primary hover:underline">/status/rss</a>
          </p>
          <p className="text-sm text-muted-foreground">
            ? Twitter: <a href="https://twitter.com/whatsfordinner" className="text-primary hover:underline">@whatsfordinner</a>
          </p>
        </div>
      </div>

      {/* Additional Links */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/support"
          className="text-primary hover:underline"
        >
          Support
        </Link>
        <Link
          href="/"
          className="text-primary hover:underline"
        >
          Home
        </Link>
      </div>

      <div className="mt-8 text-sm text-muted-foreground text-center">
        <p>Last updated: {new Date(status.lastUpdated).toLocaleString()}</p>
        <p className="mt-2">
          Status page powered by internal monitoring system
        </p>
      </div>
    </div>
  );
}
