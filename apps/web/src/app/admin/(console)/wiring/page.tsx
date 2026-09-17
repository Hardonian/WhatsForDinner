'use client';

export const dynamic = 'force-dynamic';
/**
 * Developer Dashboard: Connectivity Matrix
 * 
 * Renders Connectivity Matrix, last run, failing checks, quick links to PRs/logs.
 */


import { useEffect, useState } from 'react';

interface CheckResult {
  status: 'pass' | 'fail' | 'degraded' | 'skip';
  latency?: number;
  evidence?: string[];
  error?: string;
  fixPr?: string;
  nextAction?: string;
}

interface ConnectivityCheck {
  category: string;
  subsystem: string;
  result: CheckResult;
}

interface ConnectivityMatrix {
  timestamp: string;
  version: string;
  environment: string;
  checks: ConnectivityCheck[];
  summary: {
    total: number;
    pass: number;
    fail: number;
    degraded: number;
    skip: number;
  };
}

export default function WiringDashboard() {
  const [matrix, setMatrix] = useState<ConnectivityMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch connectivity matrix
    fetch('/wiring-status.json')
      .then(res => res.json())
      .then((data: ConnectivityMatrix) => {
        setMatrix(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8">Loading connectivity matrix...</div>;
  }

  if (error || !matrix) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Connectivity Matrix</h1>
        <p className="text-red-600">
          {error || 'No connectivity data available. Run `pnpm wiring:run` to generate.'}
        </p>
      </div>
    );
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return '✓';
      case 'fail':
        return '✗';
      case 'degraded':
        return '⚠️';
      case 'skip':
        return '⏭️';
      default:
        return '•';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'skip':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const failures = matrix.checks.filter(c => c.result.status === 'fail');
  const degraded = matrix.checks.filter(c => c.result.status === 'degraded');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">🔌 Connectivity Matrix</h1>
      
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-card p-4 rounded shadow border">
          <div className="text-2xl font-bold text-green-600">{matrix.summary.pass}</div>
          <div className="text-sm text-muted-foreground">✓ Pass</div>
        </div>
        <div className="bg-white dark:bg-card p-4 rounded shadow border">
          <div className="text-2xl font-bold text-red-600">{matrix.summary.fail}</div>
          <div className="text-sm text-muted-foreground">✗ Fail</div>
        </div>
        <div className="bg-white dark:bg-card p-4 rounded shadow border">
          <div className="text-2xl font-bold text-yellow-600">{matrix.summary.degraded}</div>
          <div className="text-sm text-muted-foreground">⚠️ Degraded</div>
        </div>
        <div className="bg-white dark:bg-card p-4 rounded shadow border">
          <div className="text-2xl font-bold text-muted-foreground">{matrix.summary.skip}</div>
          <div className="text-sm text-muted-foreground">⏭️ Skip</div>
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        Last run: {new Date(matrix.timestamp).toLocaleString()}
        <br />
        Version: {matrix.version} | Environment: {matrix.environment}
      </div>

      {failures.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-4">
          <h2 className="font-bold text-red-800 dark:text-red-400 mb-2">✗ Failures ({failures.length})</h2>
          <ul className="list-disc list-inside space-y-1">
            {failures.map((check, idx) => (
              <li key={idx} className="text-sm">
                <strong>{check.category} - {check.subsystem}</strong>: {check.result.error}
                {check.result.nextAction && (
                  <span className="text-muted-foreground"> → {check.result.nextAction}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {degraded.length > 0 && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded p-4">
          <h2 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2">⚠️ Degraded ({degraded.length})</h2>
          <ul className="list-disc list-inside space-y-1">
            {degraded.map((check, idx) => (
              <li key={idx} className="text-sm">
                <strong>{check.category} - {check.subsystem}</strong>
                {check.result.nextAction && (
                  <span className="text-muted-foreground"> → {check.result.nextAction}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full bg-white dark:bg-card">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Category</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Subsystem</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Latency</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Error</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {matrix.checks.map((check, idx) => (
              <tr key={idx} className="border-b hover:bg-muted/30">
                <td className="px-4 py-2 text-sm">{check.category}</td>
                <td className="px-4 py-2 text-sm font-medium">{check.subsystem}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(check.result.status)}`}>
                    {statusIcon(check.result.status)} {check.result.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  {check.result.latency ? `${check.result.latency}ms` : '-'}
                </td>
                <td className="px-4 py-2 text-sm text-red-600">
                  {check.result.error || '-'}
                </td>
                <td className="px-4 py-2 text-sm">
                  {check.result.fixPr ? (
                    <a href={check.result.fixPr} className="text-blue-600 hover:underline">
                      View PR
                    </a>
                  ) : check.result.nextAction ? (
                    <span className="text-muted-foreground">{check.result.nextAction}</span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-3">
        <a
          href="/reports/connectivity/wiring_report.md"
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90"
        >
          View Full Markdown Report
        </a>
        <a
          href="/wiring-status.json"
          className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded hover:bg-secondary/90 border"
        >
          Raw JSON Matrix
        </a>
      </div>
    </div>
  );
}