'use client';

export const dynamic = 'force-dynamic';


/**
 * Beta User Feedback Collection System
 * 
 * Collects feedback from beta users via form and survey integration
 */

import { useState } from 'react';
import { Star, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { analytics } from '@/lib/analytics';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('beta-feedback');

interface FeedbackForm {
  rating: number;
  comment: string;
  category: 'bug' | 'feature' | 'ux' | 'performance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function BetaFeedbackPage() {
  const router = useRouter();
  const [form, setForm] = useState<FeedbackForm>({
    rating: 0,
    comment: '',
    category: 'other',
    priority: 'medium',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please sign in to submit feedback');
        return;
      }

      // Save feedback to database
      const { error: dbError } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          rating: form.rating,
          comment: form.comment,
          category: form.category,
          priority: form.priority,
          source: 'beta_user',
          created_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      // Track feedback event
      await analytics.trackEvent('BETA_FEEDBACK_SUBMITTED', {
        rating: form.rating,
        category: form.category,
        priority: form.priority,
        user_id: user.id,
      });

      setSubmitted(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setForm({
          rating: 0,
          comment: '',
          category: 'other',
          priority: 'medium',
        });
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      _logger.error('Failed to submit feedback', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">
              Your feedback has been submitted and will help us improve.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Beta Feedback</CardTitle>
            <CardDescription>
              Help us improve by sharing your experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Overall Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, rating }))}
                      className={`p-2 rounded-lg transition-colors ${
                        form.rating >= rating
                          ? 'text-yellow-500'
                          : 'text-muted-foreground hover:text-yellow-400'
                      }`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          form.rating >= rating ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'bug', label: 'Bug' },
                    { id: 'feature', label: 'Feature Request' },
                    { id: 'ux', label: 'UX Issue' },
                    { id: 'performance', label: 'Performance' },
                    { id: 'other', label: 'Other' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, category: cat.id as FeedbackForm['category'] }))}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        form.category === cat.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'low', label: 'Low', color: 'bg-gray-500' },
                    { id: 'medium', label: 'Medium', color: 'bg-yellow-500' },
                    { id: 'high', label: 'High', color: 'bg-orange-500' },
                    { id: 'critical', label: 'Critical', color: 'bg-red-500' },
                  ].map(pri => (
                    <button
                      key={pri.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, priority: pri.id as FeedbackForm['priority'] }))}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        form.priority === pri.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <Badge className={pri.color}>{pri.label}</Badge>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium mb-2">
                  Feedback
                </label>
                <Textarea
                  id="comment"
                  value={form.comment}
                  onChange={e => setForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Tell us what you think..."
                  rows={6}
                  required
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={submitting || form.rating === 0}
              >
                {submitting ? (
                  <>
                    <Send className="w-4 h-4 mr-2 animate-pulse" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
