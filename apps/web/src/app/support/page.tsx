export const dynamic = 'force-dynamic';

/**
 * Support Center Page
 * Ticketing system and support resources
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState } from 'react';
import { MessageCircle, BookOpen, Mail, Search, Send, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

export default function SupportPage() {
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    message: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm),
      });

      if (response.ok) {
        alert('Support ticket created! We\'ll respond within 24 hours.');
        setTicketForm({ subject: '', category: '', message: '', email: '' });
      } else {
        alert('Failed to create ticket. Please try again.');
      }
    } catch (error) {
      _logger.error('Ticket creation error:', { error: error instanceof Error ? error.message : String(error) });
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Support Center</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We're here to help. Find answers, get support, or contact our team.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
          <Link href="/wiki">
            <CardHeader>
              <BookOpen className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Browse our comprehensive help articles and guides
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
          <Link href="/wiki">
            <CardHeader>
              <MessageCircle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Get instant answers from our AI chat bot
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Mail className="w-8 h-8 text-primary mb-2" />
            <CardTitle>Email Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-2">
              support@whatsfordinner.com
            </p>
            <p className="text-xs text-muted-foreground">
              Response time: 24 hours (Monday-Friday)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Support Ticket Form */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Create Support Ticket</CardTitle>
          <CardDescription>
            Can't find what you're looking for? Create a ticket and we'll help you out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  required
                  value={ticketForm.email}
                  onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  required
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select category...</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="technical">Technical Issue</option>
                  <option value="feature">Feature Request</option>
                  <option value="account">Account Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Input
                required
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                placeholder="Brief description of your issue"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message</label>
              <Textarea
                required
                value={ticketForm.message}
                onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                placeholder="Describe your issue in detail..."
                className="min-h-[150px]"
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Ticket
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              {
                q: 'How do I cancel my subscription?',
                a: 'You can cancel anytime from your billing settings. Your subscription will remain active until the end of your billing period.',
                link: '/settings/billing'
              },
              {
                q: 'How do I request a refund?',
                a: 'Request a refund within 30 days of purchase from your billing settings or contact support.',
                link: '/refund-policy'
              },
              {
                q: 'How do I export my data?',
                a: 'Go to Account Settings → Export Data to download all your data in JSON or CSV format.',
                link: '/account/export'
              },
              {
                q: 'Is my data secure?',
                a: 'Yes! We use end-to-end encryption and follow industry best practices. See our Privacy Policy for details.',
                link: '/privacy-policy'
              }
            ].map((faq, idx) => (
              <div key={idx}>
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm mb-2">{faq.a}</p>
                {faq.link && (
                  <Link href={faq.link} className="text-primary text-sm hover:underline">
                    Learn more →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
