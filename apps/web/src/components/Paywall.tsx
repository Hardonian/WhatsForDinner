'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('paywall');



import { useState, useEffect } from 'react';
import { monetization, Product } from '@/lib/monetization';
import Link from 'next/link';

interface PaywallProps {
  onPurchase?: (productId: string) => void;
  onDismiss?: () => void;
}

export default function Paywall({ onPurchase, onDismiss }: PaywallProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const prods = await monetization.getProducts();
      setProducts(prods);
    } catch (err) {
      _logger.error('Failed to load products:', { err });
      setError('Failed to load subscription options');
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(productId: string) {
    try {
      setPurchasing(productId);
      setError(null);

      const result = await monetization.purchase(productId);

      if (result.success) {
        onPurchase?.(productId);
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase error');
    } finally {
      setPurchasing(null);
    }
  }

  async function handleRestore() {
    try {
      setLoading(true);
      await monetization.restorePurchases();
      // Show success message
      alert('Purchases restored successfully!');
    } catch (err) {
      setError('Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  }

  if (loading && products.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <p className="text-center">Loading subscription options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">Unlock Premium Features</h2>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-700"
              >
                ?
              </button>
            )}
          </div>

          <ul className="space-y-2 mb-6">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">?</span>
              Unlimited meal plans
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">?</span>
              Advanced pantry management
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">?</span>
              Nutritional analysis
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">?</span>
              Ad-free experience
            </li>
          </ul>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3 mb-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handlePurchase(product.id)}
                disabled={purchasing !== null}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm opacity-90">
                      ${product.price.toFixed(2)}/{product.type === 'subscription' ? 'month' : 'once'}
                    </div>
                  </div>
                  {purchasing === product.id ? (
                    <span className="text-sm">Processing...</span>
                  ) : (
                    <span>?</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleRestore}
            disabled={loading}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            Restore Purchases
          </button>

          <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
            <p>
              <Link href="/legal/terms.html" className="underline">
                Terms of Service
              </Link>
              {' ? '}
              <Link href="/legal/privacy.html" className="underline">
                Privacy Policy
              </Link>
            </p>
            <p>Subscriptions auto-renew unless cancelled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
