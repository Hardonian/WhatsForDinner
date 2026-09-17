'use client';

// [STAKE+TRUST:BEGIN:audit_page]
import { useEffect, useState } from "react";
import Link from "next/link";

interface AuditLogEntry {
  id: number;
  user_id: string;
  action: string;
  meta: Record<string, unknown>;
  ts: string;
}

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuditLog() {
      try {
        const response = await fetch("/api/audit/me");
        if (!response.ok) {
          throw new Error("Failed to fetch audit log");
        }
        const data = await response.json();
        setRows(data.rows || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchAuditLog();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center">
          <p className="text-muted-foreground">Loading audit log...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">
            Return to Home →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">My Audit Log</h1>
        <p className="text-muted-foreground text-lg">
          View your personal activity log. This shows actions you've taken in the service.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-card rounded-lg p-6 border text-center">
          <p className="text-muted-foreground">
            No audit log entries found. Your activity will appear here as you use the service.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((entry) => (
            <div
              key={entry.id}
              className="bg-card rounded-lg p-4 border"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{entry.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.ts).toLocaleString()}
                    </span>
                  </div>
                  {entry.meta && Object.keys(entry.meta).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                        View details
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(entry.meta, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-8 border-t">
        <p className="text-sm text-muted-foreground mb-4">
          Showing last 100 entries. For complete audit log, contact support.
        </p>
        <Link href="/settings" className="text-primary hover:underline">
          ← Back to Settings
        </Link>
      </div>
    </div>
  );
}
// [STAKE+TRUST:END:audit_page]