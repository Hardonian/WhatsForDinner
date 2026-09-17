'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, ShieldIcon, LockIcon } from 'lucide-react';

interface ConsentWizardProps {
  onComplete?: () => void;
}

const SIGNAL_OPTIONS = [
  { key: 'window_titles', label: 'Window Titles', description: 'Track which applications are open' },
  { key: 'durations', label: 'Durations', description: 'Track how long you spend in each app' },
  { key: 'focus_switches', label: 'Focus Switches', description: 'Track when you switch between apps' },
  { key: 'interactions', label: 'Interactions', description: 'Track basic interaction patterns' },
];

export function ConsentOnboardingWizard({ onComplete }: ConsentWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Purpose & Benefits
  const [purposeAccepted, setPurposeAccepted] = useState(false);

  // Step 2: Choose Apps
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [appSearch, setAppSearch] = useState('');

  // Step 3: Choose Signals
  const [selectedSignals, setSelectedSignals] = useState<string[]>(['window_titles', 'durations']);
  const [samplingRates, setSamplingRates] = useState<Record<string, number>>({
    window_titles: 1.0,
    durations: 1.0,
    focus_switches: 0.5,
    interactions: 0.3,
  });

  // Step 4: Data Retention
  const [retentionDays, setRetentionDays] = useState(14);

  // Step 5: MFA Setup
  const [mfaRequired, setMfaRequired] = useState(true);

  const handleNext = () => {
    if (step === 1 && !purposeAccepted) {
      setError('Please read and accept the purpose statement to continue.');
      return;
    }
    if (step === 2 && selectedApps.length === 0) {
      setError('Please select at least one app to monitor.');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Set consent preferences
      const consentRes = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mfa-session-token': '', // Will be set after MFA verification
        },
        body: JSON.stringify({
          monitoring_enabled: true,
          data_retention_days: retentionDays,
          mfa_required: mfaRequired,
        }),
      });

      if (!consentRes.ok) {
        const errorData = await consentRes.json();
        if (errorData.requiresMFA) {
          // Prompt for MFA
          const totpCode = prompt('MFA required. Enter your TOTP code:');
          if (!totpCode) {
            setError('MFA verification required to proceed.');
            setLoading(false);
            return;
          }

          const mfaRes = await fetch('/api/privacy/mfa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              totp_code: totpCode,
              action_type: 'consent_update',
            }),
          });

          if (!mfaRes.ok) {
            setError('MFA verification failed. Please try again.');
            setLoading(false);
            return;
          }

          const { sessionToken } = await mfaRes.json();

          // Retry consent with MFA session
          const retryRes = await fetch('/api/privacy/consent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-mfa-session-token': sessionToken,
            },
            body: JSON.stringify({
              monitoring_enabled: true,
              data_retention_days: retentionDays,
              mfa_required: mfaRequired,
            }),
          });

          if (!retryRes.ok) {
            throw new Error('Failed to save consent preferences');
          }
        } else {
          throw new Error(errorData.error || 'Failed to save consent preferences');
        }
      }

      // Step 2: Add apps
      for (const appId of selectedApps) {
        await fetch('/api/privacy/apps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-mfa-session-token': '', // Use session from previous step
          },
          body: JSON.stringify({
            app_id: appId,
            app_name: appId, // In production, use actual app names
            enabled: true,
            scope: 'metadata_only',
          }),
        });
      }

      // Step 3: Set signal toggles
      for (const signalKey of selectedSignals) {
        await fetch('/api/privacy/signals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-mfa-session-token': '', // Use session from previous step
          },
          body: JSON.stringify({
            signal_key: signalKey,
            enabled: true,
            sampling_rate: samplingRates[signalKey] || 1.0,
          }),
        });
      }

      onComplete?.();
      router.push('/settings/privacy');
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / 5) * 100;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Privacy-First Monitoring Setup</CardTitle>
          <CardDescription>
            Step {step} of 5: Set up optional workflow monitoring
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Purpose & Benefits */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Purpose & Benefits</h3>
                <p className="text-sm text-muted-foreground">
                  We offer optional, privacy-first monitoring to help you improve daily workflows.
                  It analyzes only the signals you explicitly enable to surface patterns and suggestions.
                  Monitoring is OFF by default.
                </p>
              </div>

              <Alert>
                <ShieldIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>Your Data, Your Rules:</strong> You control what is collected, how long it's stored,
                  and who can access it. No staff or administrators can view your telemetry.
                </AlertDescription>
              </Alert>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="purpose-accept"
                  checked={purposeAccepted}
                  onCheckedChange={(checked) => setPurposeAccepted(checked === true)}
                />
                <Label htmlFor="purpose-accept" className="text-sm">
                  I understand that monitoring is optional and requires my explicit consent. I can turn it off
                  anytime.
                </Label>
              </div>
            </div>
          )}

          {/* Step 2: Choose Apps */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Choose Apps to Monitor</h3>
                <p className="text-sm text-muted-foreground">
                  Select which applications you want to include in monitoring. You can change this anytime.
                </p>
              </div>

              <Input
                placeholder="Search apps..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
              />

              <div className="space-y-2">
                {['Chrome', 'VS Code', 'Terminal', 'Slack', 'Email'].map((app) => (
                  <div key={app} className="flex items-center space-x-2">
                    <Checkbox
                      id={`app-${app}`}
                      checked={selectedApps.includes(app)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedApps([...selectedApps, app]);
                        } else {
                          setSelectedApps(selectedApps.filter((a) => a !== app));
                        }
                      }}
                    />
                    <Label htmlFor={`app-${app}`}>{app}</Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Choose Signals */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Choose Signals</h3>
                <p className="text-sm text-muted-foreground">
                  Select which telemetry signals to collect. You can adjust sampling rates for each signal.
                </p>
              </div>

              <div className="space-y-4">
                {SIGNAL_OPTIONS.map((signal) => (
                  <div key={signal.key} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`signal-${signal.key}`}
                        checked={selectedSignals.includes(signal.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSignals([...selectedSignals, signal.key]);
                          } else {
                            setSelectedSignals(selectedSignals.filter((s) => s !== signal.key));
                          }
                        }}
                      />
                      <Label htmlFor={`signal-${signal.key}`} className="font-medium">
                        {signal.label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">{signal.description}</p>
                    {selectedSignals.includes(signal.key) && (
                      <div className="ml-6 space-y-2">
                        <Label className="text-xs">Sampling Rate: {Math.round(samplingRates[signal.key] * 100)}%</Label>
                        <Input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={samplingRates[signal.key] || 1.0}
                          onChange={(e) =>
                            setSamplingRates({
                              ...samplingRates,
                              [signal.key]: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Data Retention */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Data Retention</h3>
                <p className="text-sm text-muted-foreground">
                  Choose how long to keep your data. Older data is automatically deleted.
                </p>
              </div>

              <RadioGroup value={retentionDays.toString()} onValueChange={(v) => setRetentionDays(parseInt(v))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="7" id="retention-7" />
                  <Label htmlFor="retention-7">7 days (minimum)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="14" id="retention-14" />
                  <Label htmlFor="retention-14">14 days (recommended)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30" id="retention-30" />
                  <Label htmlFor="retention-30">30 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="90" id="retention-90" />
                  <Label htmlFor="retention-90">90 days</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 5: MFA Setup */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Multi-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  MFA is required for sensitive privacy actions like enabling monitoring, exporting data,
                  or deleting data.
                </p>
              </div>

              <Alert>
                <LockIcon className="h-4 w-4" />
                <AlertDescription>
                  <strong>MFA Required:</strong> Multi-factor authentication is required to proceed.
                  This ensures only you can make changes to your privacy settings.
                </AlertDescription>
              </Alert>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="mfa-required"
                  checked={mfaRequired}
                  onCheckedChange={(checked) => setMfaRequired(checked === true)}
                />
                <Label htmlFor="mfa-required" className="text-sm">
                  Require MFA for sensitive privacy actions
                </Label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
              Back
            </Button>
            {step < 5 ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? 'Saving...' : 'Start Monitoring'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConsentOnboardingWizard;
