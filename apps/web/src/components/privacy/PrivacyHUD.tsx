'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('privacyhud');



import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShieldIcon, ClockIcon, InfoIcon, PauseIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PrivacyHUDProps {
  className?: string;
}

export function PrivacyHUD({ className }: PrivacyHUDProps) {
  const router = useRouter();
  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [appsCount, setAppsCount] = useState(0);
  const [pausedUntil, setPausedUntil] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrivacyStatus();
  }, []);

  const fetchPrivacyStatus = async () => {
    try {
      const res = await fetch('/api/privacy/prefs');
      const data = await res.json();
      if (data.success) {
        setMonitoringEnabled(data.data.preferences.monitoring_enabled);
        setAppsCount(data.data.apps.filter((a: any) => a.enabled).length);
        setPausedUntil(
          data.data.preferences.paused_until ? new Date(data.data.preferences.paused_until) : null
        );
      }
    } catch (err) {
      _logger.error('Failed to fetch privacy status', { err });
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (minutes: number) => {
    try {
      const pauseUntil = new Date();
      pauseUntil.setMinutes(pauseUntil.getMinutes() + minutes);

      const res = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monitoring_enabled: true,
          data_retention_days: 14,
          mfa_required: true,
          paused_until: pauseUntil.toISOString(),
        }),
      });

      if (res.ok) {
        setPausedUntil(pauseUntil);
      }
    } catch (err) {
      _logger.error('Failed to pause monitoring', { err });
    }
  };

  const handleResume = async () => {
    try {
      const res = await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monitoring_enabled: true,
          data_retention_days: 14,
          mfa_required: true,
          paused_until: null,
        }),
      });

      if (res.ok) {
        setPausedUntil(null);
      }
    } catch (err) {
      _logger.error('Failed to resume monitoring', { err });
    }
  };

  if (loading || !monitoringEnabled) {
    return null; // Don't show HUD when monitoring is off
  }

  const isPaused = pausedUntil && pausedUntil > new Date();

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background p-2 shadow-lg ${className}`}
      role="status"
      aria-live="polite"
    >
      <ShieldIcon className="h-4 w-4 text-primary" />
      <Badge variant={isPaused ? 'secondary' : 'default'}>
        {isPaused ? 'Paused' : 'Monitoring'}
      </Badge>
      <span className="text-sm text-muted-foreground">{appsCount} apps</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <PauseIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isPaused ? (
            <DropdownMenuItem onClick={handleResume}>Resume</DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => handlePause(15)}>Pause 15m</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePause(60)}>Pause 1h</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePause(24 * 60)}>
                Pause until tomorrow
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/settings/privacy')}
        aria-label="Open privacy settings"
      >
        <InfoIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default PrivacyHUD;
