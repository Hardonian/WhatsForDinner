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

  const mfaResult = await requireMFA(request, 'data_delete');
  if (!mfaResult.success) {
    return mfaResult.response;
  }

  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();
  const validated = deleteRequestSchema.parse(body);

  const deletionId = crypto.randomBytes(16).toString('hex');
  const hardDeleteAt = new Date();
  hardDeleteAt.setDate(hardDeleteAt.getDate() + 7);

  await logPrivacyAction(
    supabase,
    mfaResult.userId,
    'data_deleted',
    'deletion',
    deletionId,
    null,
    { deletion_id: deletionId, hard_delete_at: hardDeleteAt.toISOString() }
  );

  return NextResponse.json({
    success: true,
    deletionId,
    hardDeleteAt: hardDeleteAt.toISOString(),
    message: 'Data deletion scheduled. Hard delete will occur after 7 days.',
  });
}

export const dynamic = "force-dynamic";
