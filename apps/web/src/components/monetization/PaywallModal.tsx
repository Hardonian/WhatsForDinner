'use client';

import { useState, useEffect } from 'react';
import { createComponentLogger } from '@whats-for-dinner/utils';
import Link from 'next/link';
import { X } from 'lucide-react';

const _logger = createComponentLogger('PaywallModal');

interface PaywallModalProps {
  strategy: {
    id: string;
    name: string;
    placement: string;
    timing: string;
    design: string;
  };
  onDismiss: () => void;
  onUpgrade: () => void;
}

export default function PaywallModal({ strategy, onDismiss, onUpgrade }: PaywallModalProps) {
  const [closing, setClosing] = useState(false);

  const handleDismiss = () => {
    setClosing(true);
    setTimeout(() => {
      onDismiss();
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl transition-opacity ${
          closing ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">Unlock Premium Features</h2>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Upgrade to Pro</h3>
              <p className="text-gray-700 mb-4">
                Get unlimited access to all premium features and unlock the full potential of What's for Dinner?
              </p>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✓</span>
                <div>
                  <div className="font-semibold">Unlimited Recipes</div>
                  <div className="text-sm text-gray-600">Generate as many recipes as you want</div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✓</span>
                <div>
                  <div className="font-semibold">Advanced Meal Planning</div>
                  <div className="text-sm text-gray-600">AI-powered weekly meal planning</div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✓</span>
                <div>
                  <div className="font-semibold">Nutrition Analysis</div>
                  <div className="text-sm text-gray-600">Detailed macro and micronutrient tracking</div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✓</span>
                <div>
                  <div className="font-semibold">Pantry Intelligence</div>
                  <div className="text-sm text-gray-600">Smart expiration tracking and waste reduction</div>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-3 text-xl">✓</span>
                <div>
                  <div className="font-semibold">Ad-Free Experience</div>
                  <div className="text-sm text-gray-600">Enjoy cooking without interruptions</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onUpgrade}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Upgrade to Pro - $9.99/month
            </button>
            <Link
              href="/pricing"
              className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors text-center"
            >
              View All Plans
            </Link>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              <Link href="/legal/terms" className="underline">
                Terms of Service
              </Link>
              {' • '}
              <Link href="/legal/privacy" className="underline">
                Privacy Policy
              </Link>
            </p>
            <p className="mt-1">Subscriptions auto-renew unless cancelled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
