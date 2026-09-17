/**
 * Authentication and Authorization Middleware
 * Provides secure JWT-based authentication for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  tenantId?: string | null;
}

export interface AuthContext {
  user: AuthenticatedUser;
  supabase: SupabaseClient;
}

/**
 * Get authenticated user from JWT token
 * Validates the token and returns user context
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ user: AuthenticatedUser; supabase: SupabaseClient } | null> {
  try {
    const supabase = createRouteHandlerClient({ cookies } as any);
    
    // Get user from JWT token (validates the token)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Get user's tenant from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    return {
      user: {
        id: user.id,
        email: user.email,
        tenantId: profile?.tenant_id || null,
      },
      supabase,
    };
  } catch (error) {
    // Error handled: Authentication error:
    return null;
  }
}

/**
 * Require authentication middleware
 * Returns 401 if user is not authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<
  | { success: true; context: AuthContext }
  | { success: false; response: NextResponse }
> {
  const authResult = await getAuthenticatedUser(request);

  if (!authResult) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return {
    success: true,
    context: authResult,
  };
}

/**
 * Require tenant membership validation
 * Ensures user belongs to the specified tenant
 */
export async function requireTenantAccess(
  request: NextRequest,
  tenantId: string
): Promise<
  | { success: true; context: AuthContext }
  | { success: false; response: NextResponse }
> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return authResult;
  }

  const { user, supabase } = authResult.context;

  // If user's tenant matches, allow access
  if (user.tenantId === tenantId) {
    return { success: true, context: authResult.context };
  }

  // Check if user is a member of the tenant (via tenant_memberships)
  const { data: membership } = await supabase
    .from('tenant_memberships')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single();

  if (membership) {
    return { success: true, context: authResult.context };
  }

  return {
    success: false,
    response: NextResponse.json(
      { error: 'Forbidden: Access denied to this tenant' },
      { status: 403 }
    ),
  };
}

/**
 * Extract tenant ID from request, validate access, and return context
 * Supports header, body, or query param, but validates user has access
 */
export async function getTenantContext(
  request: NextRequest
): Promise<
  | { success: true; context: AuthContext; tenantId: string }
  | { success: false; response: NextResponse }
> {
  const authResult = await requireAuth(request);
  
  if (!authResult.success) {
    return { success: false, response: (authResult as any).response };
  }

  const { context } = authResult;
  const { user } = context;

  // Try to get tenant ID from various sources
  let tenantId: string | null = null;

  // From header (for backwards compatibility, but validate access)
  try {
    const headers = await import('next/headers');
    const headersList = await headers.headers();
    const headerTenantId = headersList.get('x-tenant-id');
    if (headerTenantId) {
      tenantId = headerTenantId;
    }
  } catch {
    // Ignore if headers can't be accessed
  }

  // From request body (if POST/PUT/PATCH)
  if (!tenantId && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.json().catch(() => ({}));
      if (body.tenant_id) {
        tenantId = body.tenant_id;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // From query params
  if (!tenantId) {
    try {
      const { searchParams } = new URL(request.url);
      tenantId = searchParams.get('tenant_id');
    } catch {
      // Ignore URL parse errors
    }
  }

  // Default to user's tenant if no tenant specified
  if (!tenantId && user.tenantId) {
    tenantId = user.tenantId;
  }

  if (!tenantId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Tenant information required' },
        { status: 400 }
      ),
    };
  }

  // Validate user has access to this tenant
  const tenantAccess = await requireTenantAccess(request, tenantId);
  
  if (!tenantAccess.success) {
    return { success: false, response: (tenantAccess as any).response };
  }

  return {
    success: true,
    context: tenantAccess.context,
    tenantId,
  };
}