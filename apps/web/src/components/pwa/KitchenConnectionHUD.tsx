'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';

export function KitchenConnectionHUD() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none select-none">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-amber-500/90 dark:bg-amber-600/90 text-amber-950 dark:text-white backdrop-blur-md shadow-lg border border-amber-400/30 text-xs font-semibold pointer-events-auto"
          >
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span>Kitchen Offline Mode (Cached Recipes & Timers Active)</span>
          </motion.div>
        )}

        {showReconnected && isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-500/90 dark:bg-emerald-600/90 text-white backdrop-blur-md shadow-lg border border-emerald-400/30 text-xs font-semibold pointer-events-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Connection Restored • Cloud Synced</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
