'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('capacitorinit');



import { useEffect } from 'react';
import { initializeCapacitor } from '@/lib/capacitor/init';

export function CapacitorInit() {
  useEffect(() => {
    // Initialize Capacitor on client side only
    initializeCapacitor().catch(console.error);
  }, []);

  return null; // This component doesn't render anything
}
