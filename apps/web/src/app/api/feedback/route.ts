import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { handleApiError, getCorrelationId } from '@whats-for-dinner/utils';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('feedback-api');

const FeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
  category: z.enum(['bug', 'feature', 'ux', 'performance', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const feedback = FeedbackSchema.parse(body);

    // Save feedback to database
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        user_id: user.id,
        rating: feedback.rating,
        comment: feedback.comment,
        category: feedback.category,
        priority: feedback.priority,
        source: 'beta_user',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      _logger.error('Error saving feedback', {
        error: error.message,
        userId: user.id,
        correlationId: getCorrelationId(request),
      });
      return handleApiError(error, {
        component: 'feedback-api',
        context: { userId: user.id, correlationId: getCorrelationId(request) },
      });
    }

    return NextResponse.json({ success: true, feedback: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid feedback data', details: error.errors },
        { status: 400 }
      );
    }

    return handleApiError(error, {
      component: 'feedback-api',
      context: { correlationId: getCorrelationId(request) },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may need to adjust this)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all feedback
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    return handleApiError(error, {
      component: 'feedback-api',
      context: { correlationId: getCorrelationId(request) },
    });
  }
}
