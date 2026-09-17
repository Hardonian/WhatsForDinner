'use client';

export const dynamic = 'force-dynamic';


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ShieldIcon,
  LockIcon,
  DownloadIcon,
  TrashIcon,
  EyeIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AppAllowlist, SignalToggle, PrivacyTransparencyLog } from '@/types/privacy';

export default function PrivacySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<unknown>(null);
  const [apps, setApps] = useState<AppAllowlist[]>([]);
  const [signals, setSignals] = useState<SignalToggle[]>([]);
  const [logs, setLogs] = useState<PrivacyTransparencyLog[]>([]);
  const [mfaSessionToken, setMfaSessionToken] = useState<string | null>(null);

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  const fetchPrivacyData = async () => {
    try {
      const res = await fetch('/api/privacy/prefs');
      const data = await res.json();
      if (data.success) {
        setPrefs(data.data.preferences);
        setApps(data.data.apps);
        setSignals(data.data.signals);
      }

      const logRes = await fetch('/api/privacy/log?limit=50');
      const logData = await logRes.json();
      if (logData.success) {
        setLogs(logData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch privacy data');
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerify = async (actionType: string) => {
    const totpCode = prompt('MFA required. Enter your TOTP code:');
    if (!totpCode) return;

    try {
      const res = await fetch('/api/privacy/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totp_code: totpCode, action_type: actionType }),
      });

      const data = await res.json();
      if (data.success) {
        setMfaSessionToken(data.sessionToken);
        return true;
      } else {
        setError('MFA verification failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch privacy data');
      return false;
    }
  };

  const handleExport = async () => {
    if (!mfaSessionToken) {
      const verified = await handleMFAVerify('data_export');
      if (!verified) return;
    }

    try {
      const res = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mfa-session-token': mfaSessionToken || '',
        },
        body: JSON.stringify({ format: 'json' }),
      });

      const data = await res.json();
      if (data.success) {
        // Download file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `privacy-export-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch privacy data');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete all your privacy data? This cannot be undone.')) {
      return;
    }

    if (!mfaSessionToken) {
      const verified = await handleMFAVerify('data_delete');
      if (!verified) return;
    }

    try {
      const res = await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mfa-session-token': mfaSessionToken || '',
        },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Data deletion scheduled. Hard delete will occur after 7 days.');
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch privacy data');
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Manage your privacy preferences and monitoring settings</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="apps">Apps & Scopes</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="data">Data & Retention</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="transparency">Transparency Log</TabsTrigger>
              <TabsTrigger value="export">Export/Delete</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Monitoring Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {prefs?.monitoring_enabled ? 'Monitoring is enabled' : 'Monitoring is disabled'}
                    </p>
                  </div>
                  <Badge variant={prefs?.monitoring_enabled ? 'default' : 'secondary'}>
                    {prefs?.monitoring_enabled ? 'ON' : 'OFF'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Apps Monitored</p>
                    <p className="text-2xl font-bold">{apps.filter((a) => a.enabled).length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data Retention</p>
                    <p className="text-2xl font-bold">{prefs?.data_retention_days || 14} days</p>
                  </div>
                </div>

                <Alert>
                  <ShieldIcon className="h-4 w-4" />
                  <AlertDescription>
                    Your data is visible only to you. Staff and administrators cannot access it.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            {/* Apps & Scopes Tab */}
            <TabsContent value="apps" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>App</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>{app.app_name}</TableCell>
                      <TableCell>
                        <Badge variant={app.enabled ? 'default' : 'secondary'}>
                          {app.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.scope}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!mfaSessionToken) {
                              const verified = await handleMFAVerify('app_allowlist');
                              if (!verified) return;
                            }

                            await fetch('/api/privacy/apps', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-mfa-session-token': mfaSessionToken || '',
                              },
                              body: JSON.stringify({
                                ...app,
                                enabled: !app.enabled,
                              }),
                            });

                            fetchPrivacyData();
                          }}
                        >
                          {app.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Signals Tab */}
            <TabsContent value="signals" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sampling Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signals.map((signal) => (
                    <TableRow key={signal.id}>
                      <TableCell>{signal.signal_key}</TableCell>
                      <TableCell>
                        <Badge variant={signal.enabled ? 'default' : 'secondary'}>
                          {signal.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>{Math.round(parseFloat(signal.sampling_rate) * 100)}%</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!mfaSessionToken) {
                              const verified = await handleMFAVerify('signal_toggles');
                              if (!verified) return;
                            }

                            await fetch('/api/privacy/signals', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-mfa-session-token': mfaSessionToken || '',
                              },
                              body: JSON.stringify({
                                ...signal,
                                enabled: !signal.enabled,
                              }),
                            });

                            fetchPrivacyData();
                          }}
                        >
                          {signal.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Data & Retention Tab */}
            <TabsContent value="data" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Data Retention (days)</Label>
                  <Input
                    type="number"
                    value={prefs?.data_retention_days || 14}
                    min={1}
                    max={365}
                    onChange={(e) => {
                      setPrefs({ ...prefs, data_retention_days: parseInt(e.target.value) });
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Data older than this will be automatically deleted
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Alert>
                <LockIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>MFA Required:</strong> Multi-factor authentication is required for sensitive
                  privacy actions.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mfa-required"
                  checked={prefs?.mfa_required ?? true}
                  onCheckedChange={(checked) => {
                    setPrefs({ ...prefs, mfa_required: checked });
                  }}
                />
                <Label htmlFor="mfa-required">Require MFA for sensitive actions</Label>
              </div>
            </TabsContent>

            {/* Transparency Log Tab */}
            <TabsContent value="transparency" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.ts).toLocaleString()}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <pre className="text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Export/Delete Tab */}
            <TabsContent value="export" className="space-y-4">
              <Alert>
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>MFA Required:</strong> Multi-factor authentication is required to proceed.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button onClick={handleExport} variant="outline">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export My Data
                </Button>
                <Button onClick={handleDelete} variant="destructive">
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete My Data
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
