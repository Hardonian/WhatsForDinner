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

  const mfaResult = await requireMFA(request, 'app_allowlist');
  if (!mfaResult.success) {
    return mfaResult.response;
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();
  const validated = appAllowlistSchema.parse(body);

  const { data: existingApp } = await supabase
    .from('app_allowlist')
    .select('*')
    .eq('user_id', mfaResult.userId)
    .eq('app_id', validated.app_id)
    .single();

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
      { onConflict: 'user_id,app_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

export const dynamic = "force-dynamic";
