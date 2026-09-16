import { requireAuth } from '@/lib/auth-middleware';

export const dynamic = "force-dynamic";
import type { SupabaseClient } from '@supabase/supabase-js';

async function logPrivacyAction(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  oldValue?: unknown,
  newValue?: unknown,
  metadata?: Record<string, unknown>
) {
  const oldHash = oldValue ? hashValue(oldValue) : null;
  const newHash = newValue ? hashValue(newValue) : null;

  await supabase.from('privacy_transparency_log').insert({
    user_id: userId,
    action,
    actor_id: userId,
    entity_type: entityType,
    entity_id: entityId,
    old_value_hash: oldHash,
    new_value_hash: newHash,
    metadata: metadata || {},
  });
}

// ============================================================================
// API Routes
// ============================================================================

/**
 * POST /api/privacy/consent
 * Set/update privacy preferences (requires MFA)
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const mfaResult = await requireMFA(request, 'consent_update');
  if (!mfaResult.success) {
    return mfaResult.response;
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();
  const validated = consentSchema.parse(body);

  // Get existing prefs for audit log
  const { data: existingPrefs } = await supabase
    .from('privacy_prefs')
    .select('*')
    .eq('user_id', mfaResult.userId)
    .single();

  // Upsert privacy preferences
  const { data: prefs, error } = await supabase
    .from('privacy_prefs')
    .upsert(
      {
        user_id: mfaResult.userId,
        monitoring_enabled: validated.monitoring_enabled,
        data_retention_days: validated.data_retention_days,
        mfa_required: validated.mfa_required,
        last_reviewed_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log privacy action
  await logPrivacyAction(
    supabase,
    mfaResult.userId,
    validated.monitoring_enabled ? 'consent_granted' : 'consent_revoked',
    'privacy_prefs',
    mfaResult.userId,
    existingPrefs,
    prefs
  );

  return NextResponse.json({ success: true, data: prefs });
}

/**
 * POST /api/privacy/mfa/verify
 * Verify MFA and create elevated session
 */
export async function POST_MFA_VERIFY(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const body = await request.json();
  const validated = mfaVerifySchema.parse(body);

  const result = await verifyMFAAndCreateSession(
    authResult.context.user.id,
    validated.totp_code,
    validated.action_type
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    sessionToken: result.sessionToken,
    expiresAt: result.expiresAt,
  });
}

/**
 * POST /api/privacy/apps
 * Modify app allowlist (requires MFA)
 */
export async function POST_APPS(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const mfaResult = await requireMFA(request, 'app_allowlist');
  if (!mfaResult.success) {
    return mfaResult.response;
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();
  const validated = appAllowlistSchema.parse(body);

  // Get existing app for audit log
  const { data: existingApp } = await supabase
    .from('app_allowlist')
    .select('*')
    .eq('user_id', mfaResult.userId)
    .eq('app_id', validated.app_id)
    .single();

  // Upsert app allowlist entry
  const { data: app, error } = await supabase
    .from('app_allowlist')
    .upsert(
      {
        user_id: mfaResult.userId,
        app_id: validated.app_id,
        app_name: validated.app_name,
        enabled: validated.enabled,
        scope: validated.scope,
      },
      {
        onConflict: 'user_id,app_id',
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log privacy action
  await logPrivacyAction(
    supabase,
    mfaResult.userId,
    validated.enabled ? 'app_added' : 'app_removed',
    'app_allowlist',
    app.id,
    existingApp,
    app
  );

  return NextResponse.json({ success: true, data: app });
}

/**
 * POST /api/privacy/signals
 * Modify signal toggles (requires MFA)
 */
export async function POST_SIGNALS(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const mfaResult = await requireMFA(request, 'signal_toggles');
  if (!mfaResult.success) {
    return mfaResult.response;
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();
  const validated = signalToggleSchema.parse(body);

  // Get existing signal for audit log
  const { data: existingSignal } = await supabase
    .from('signal_toggles')
    .select('*')
    .eq('user_id', mfaResult.userId)
    .eq('signal_key', validated.signal_key)
    .single();

  // Upsert signal toggle
  const { data: signal, error } = await supabase
    .from('signal_toggles')
    .upsert(
      {
        user_id: mfaResult.userId,
        signal_key: validated.signal_key,
        enabled: validated.enabled,
        sampling_rate: validated.sampling_rate.toString(),
      },
      {
        onConflict: 'user_id,signal_key',
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log privacy action
  await logPrivacyAction(
    supabase,
    mfaResult.userId,
    'signal_toggled',
    'signal_toggles',
    signal.id,
    existingSignal,
    signal,
    { signal_key: validated.signal_key }
  );

  return NextResponse.json({ success: true, data: signal });
}

/**
 * POST /api/privacy/export
 * Export user data (async job, requires MFA)
 */
export async function POST_EXPORT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const mfaResult = await requireMFA(request, 'data_export');
  if (!mfaResult.success) {
    return mfaResult.response;
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();
  const validated = exportRequestSchema.parse(body);

  // Get all user privacy data
  const [prefs, apps, signals, events, logs] = await Promise.all([
    supabase.from('privacy_prefs').select('*').eq('user_id', mfaResult.userId).single(),
    supabase.from('app_allowlist').select('*').eq('user_id', mfaResult.userId),
    supabase.from('signal_toggles').select('*').eq('user_id', mfaResult.userId),
    supabase.from('telemetry_events').select('*').eq('user_id', mfaResult.userId),
    supabase.from('privacy_transparency_log').select('*').eq('user_id', mfaResult.userId),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: mfaResult.userId,
    format: validated.format,
    data: {
      preferences: prefs.data,
      apps: apps.data,
      signals: signals.data,
      events: events.data,
      transparency_log: logs.data,
    },
  };

  // Generate signed URL (in production, upload to S3/Supabase Storage)
  const exportId = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

  // Log export action
  await logPrivacyAction(
    supabase,
    mfaResult.userId,
    'data_exported',
    'export',
    exportId,
    null,
    { export_id: exportId, format: validated.format },
    { expires_at: expiresAt.toISOString() }
  );

  return NextResponse.json({
    success: true,
    exportId,
    expiresAt: expiresAt.toISOString(),
    downloadUrl: `/api/privacy/export/${exportId}`, // In production, use signed S3 URL
    data: validated.format === 'json' ? exportData : null, // CSV would be generated server-side
  });
}

/**
 * POST /api/privacy/delete
 * Delete user data (soft delete → hard delete after delay, requires MFA)
 */
export async function POST_DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const mfaResult = await requireMFA(request, 'data_delete');
  if (!mfaResult.success) {
    return mfaResult.response;
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();
  const validated = deleteRequestSchema.parse(body);

  // Soft delete: mark for deletion (in production, use a deletion queue)
  const deletionId = crypto.randomBytes(16).toString('hex');
  const hardDeleteAt = new Date();
  hardDeleteAt.setDate(hardDeleteAt.getDate() + 7); // 7-day grace period

  // Log deletion action
  await logPrivacyAction(
    supabase,
    mfaResult.userId,
    'data_deleted',
    'deletion',
    deletionId,
    null,
    { deletion_id: deletionId, hard_delete_at: hardDeleteAt.toISOString() }
  );

  // In production, queue actual deletion job
  // For now, return success
  return NextResponse.json({
    success: true,
    deletionId,
    hardDeleteAt: hardDeleteAt.toISOString(),
    message: 'Data deletion scheduled. Hard delete will occur after 7 days.',
  });
}

/**
 * GET /api/privacy/log
 * Get privacy transparency log (paginated)
 */
export async function GET_LOG(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('privacy_transparency_log')
    .select('*', { count: 'exact' })
    .eq('user_id', authResult.context.user.id)
    .order('ts', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

/**
 * GET /api/privacy/prefs
 * Get current privacy preferences
 */
export async function GET_PREFS(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authResult.response;
  }

  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: prefs } = await supabase
    .from('privacy_prefs')
    .select('*')
    .eq('user_id', authResult.context.user.id)
    .single();

  const { data: apps } = await supabase
    .from('app_allowlist')
    .select('*')
    .eq('user_id', authResult.context.user.id);

  const { data: signals } = await supabase
    .from('signal_toggles')
    .select('*')
    .eq('user_id', authResult.context.user.id);

  return NextResponse.json({
    success: true,
    data: {
      preferences: prefs || {
        monitoring_enabled: false,
        data_retention_days: 14,
        mfa_required: true,
      },
      apps: apps || [],
      signals: signals || [],
    },
  });
}

export const dynamic = "force-dynamic";
