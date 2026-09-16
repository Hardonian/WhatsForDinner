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
  const crypto = await import('crypto');
  const hashValue = (value: unknown): string => {
    return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  };
  
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

export async function GET(request: NextRequest) {
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
