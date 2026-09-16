import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { handleApiError, getCorrelationId } from '@whats-for-dinner/utils';
import { createComponentLogger } from '@whats-for-dinner/utils';
import { ExpirationService } from '@/lib/expiration-service';

const _logger = createComponentLogger('expiration-alerts-api');

/**
 * GET /api/expiration/alerts
 * Get expiration alerts for the current user
 */
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

    const daysAhead = parseInt(request.nextUrl.searchParams.get('days') || '7', 10);
    
    const alerts = await ExpirationService.getExpiringItems(user.id, daysAhead);
    
    // Get recipe suggestions for urgent items
    const urgentItemIds = alerts
      .filter(a => a.severity === 'urgent' || a.severity === 'expired')
      .map(a => a.itemId);
    
    const recipeSuggestions = urgentItemIds.length > 0
      ? await ExpirationService.getRecipeSuggestionsForExpiring(user.id, urgentItemIds)
      : [];

    return NextResponse.json({
      alerts,
      recipeSuggestions,
      summary: {
        total: alerts.length,
        expired: alerts.filter(a => a.severity === 'expired').length,
        urgent: alerts.filter(a => a.severity === 'urgent').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      component: 'expiration-alerts-api',
      context: { correlationId: getCorrelationId(request) },
    });
  }
}
