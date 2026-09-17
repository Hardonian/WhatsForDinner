'use client';

export const dynamic = 'force-dynamic';
/**
 * Billing Settings Page
 * Complete billing management: invoices, refunds, payment methods, cancellation
 */

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import {
  CreditCard,
  Download,
  FileText,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  metadata?: Record<string, any>;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  due_date: string | null;
}

interface Refund {
  id: string;
  amount: number;
  status: string;
  reason: string | null;
  created_at: string;
}

export default function BillingSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('status', 'active')
          .single();

        if (sub) {
          setSubscription(sub);
        }
      }
    } catch (e) {
      // Fallback
    }

    try {
      const invoicesRes = await fetch(`/api/billing/invoice`);
      const invoicesData = await invoicesRes.json();
      if (invoicesData.invoices) {
        setInvoices(invoicesData.invoices);
      }
    } catch (e) {}

    try {
      const refundsRes = await fetch(`/api/billing/refund`);
      const refundsData = await refundsRes.json();
      if (refundsData.refunds) {
        setRefunds(refundsData.refunds);
      }
    } catch (e) {}
  }, [supabase]);

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          metadata: {
            ...subscription.metadata,
            cancellation_reason: cancellationReason,
            cancelled_at: new Date().toISOString(),
          },
        })
        .eq('id', subscription.id);

      setShowCancelDialog(false);
      setCancellationReason('');
      await loadData();
      alert('Subscription will be cancelled at the end of your billing period.');
    } catch (error) {
      _logger.error('Failed to cancel subscription:', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to cancel subscription. Please try again.');
    }
  };

  const handleRefundRequest = async () => {
    if (!subscription) return;

    try {
      const response = await fetch('/api/billing/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscription.id,
          reason: refundReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowRefundDialog(false);
        setRefundReason('');
        await loadData();
        alert('Refund request submitted successfully. We\'ll process it within 5-10 business days.');
      } else {
        alert(data.error || 'Failed to request refund. Please try again.');
      }
    } catch (error) {
      _logger.error('Refund request error:', { error: error instanceof Error ? error.message : String(error) });
      alert('An error occurred. Please contact support.');
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoice?id=${invoiceId}&format=pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
    } catch (error) {
      _logger.error('Failed to download invoice:', { error: error instanceof Error ? error.message : String(error) });
      alert('Failed to download invoice. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
      <p>Please log in to view billing settings.</p>
    </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8">Billing & Subscription</h1>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          {subscription ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl capitalize">{subscription.plan} Plan</CardTitle>
                    <CardDescription>
                      {subscription.cancel_at_period_end
                        ? 'Cancels on ' + new Date(subscription.current_period_end).toLocaleDateString()
                        : 'Active subscription'}
                    </CardDescription>
                  </div>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Current Period</div>
                    <div className="font-semibold">
                      {new Date(subscription.current_period_start).toLocaleDateString()} - {' '}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Next Billing Date</div>
                    <div className="font-semibold">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <X className="w-4 h-4 mr-2" />
                        Cancel Subscription
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Subscription</DialogTitle>
                        <DialogDescription>
                          Your subscription will remain active until the end of your billing period.
                          You can reactivate anytime before then.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Why are you cancelling? (Optional)
                          </label>
                          <textarea
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                            placeholder="Help us improve..."
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                          Keep Subscription
                        </Button>
                        <Button variant="destructive" onClick={handleCancelSubscription}>
                          Cancel Subscription
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" asChild>
                    <a href="/pricing">Change Plan</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Active Subscription</CardTitle>
                <CardDescription>Subscribe to unlock premium features</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <a href="/pricing">View Plans</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View and download your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-muted-foreground">No invoices yet</p>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <div className="font-semibold">{invoice.invoice_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">${invoice.total_amount.toFixed(2)}</div>
                          <Badge variant="outline" className="text-xs">
                            {invoice.status}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadInvoice(invoice.id)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Refund Requests</CardTitle>
              <CardDescription>
                Request a refund within 30 days of purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription && (
                <Button onClick={() => setShowRefundDialog(true)}>
                  Request Refund
                </Button>
              )}

              {refunds.length === 0 ? (
                <p className="text-muted-foreground">No refund requests</p>
              ) : (
                <div className="space-y-4">
                  {refunds.map((refund) => (
                    <div
                      key={refund.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-semibold">${refund.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(refund.created_at).toLocaleDateString()}
                        </div>
                        {refund.reason && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Reason: {refund.reason}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={
                          refund.status === 'processed'
                            ? 'default'
                            : refund.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {refund.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Refund</DialogTitle>
                <DialogDescription>
                  Refunds are processed within 5-10 business days. Full refunds are available within 30 days of purchase.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Reason for Refund (Optional)
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    placeholder="Help us improve..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRefundRequest}>
                  Submit Refund Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Payment methods are managed securely through Stripe. 
                Update your payment method in the Stripe customer portal.
              </p>
              <Button variant="outline" asChild>
                <a href="/api/billing/stripe-portal" target="_blank">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Payment Methods
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}