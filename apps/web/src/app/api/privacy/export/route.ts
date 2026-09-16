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

  const mfaResult = await requireMFA(request, 'signal_toggles');
  if (!mfaResult.success) {
    return mfaResult.response;
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();
  const validated = signalToggleSchema.parse(body);

  const { data: existingSignal } = await supabase
    .from('signal_toggles')
    .select('*')
    .eq('user_id', mfaResult.userId)
    .eq('signal_key', validated.signal_key)
    .single();

  const { data: signal, error } = await supabase
    .from('signal_toggles')
    .upsert(
      {
        user_id: mfaResult.userId,
        signal_key: validated.signal_key,
        enabled: validated.enabled,
        sampling_rate: validated.sampling_rate.toString(),
      },
      { onConflict: 'user_id,signal_key' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

export const dynamic = "force-dynamic";
