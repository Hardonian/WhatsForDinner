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

export async function POST(request: NextRequest) {
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

  const exportId = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

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
    downloadUrl: `/api/privacy/export/${exportId}`,
    data: validated.format === 'json' ? exportData : null,
  });
}

export const dynamic = "force-dynamic";
