import { queue } from '@whats-for-dinner/server/queue';

/**
 * POST /api/privacy/erase
 * Schedule account deletion
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Schedule deletion job (with grace period for recovery)
    await queue.add(
      'privacy-erase',
      {
        userId: auth.userId,
        scheduledAt: new Date(),
        eraseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days grace period
      },
      {
        delay: 30 * 24 * 60 * 60 * 1000, // Process after 30 days
        attempts: 1,
      }
    );

    // Soft delete: Mark account as scheduled for deletion
    await markForDeletion(auth.userId);

    // Send confirmation email
    await sendDeletionConfirmation(auth.userEmail || '');

    let res = NextResponse.json({
      message: 'Account deletion scheduled',
      scheduledDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      canCancel: true,
    }, { status: 200 });

    return addSecurityHeaders(res);
  } catch (error) {
    logger.error({ error }, 'Privacy erasure error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Mark account for deletion
 */
async function markForDeletion(userId: string): Promise<void> {
  // In production, update user record
  // UPDATE users SET deleted_at = NOW() + INTERVAL '30 days', status = 'pending_deletion' WHERE id = $1
  logger.info({ userId }, 'Marked account for deletion');
}

/**
 * Send deletion confirmation email
 */
async function sendDeletionConfirmation(email: string): Promise<void> {
  logger.info({ email }, 'Sending deletion confirmation email');
  // await sendgrid.send({
  //   to: email,
  //   subject: 'Account Deletion Scheduled',
  //   html: 'Your account will be deleted in 30 days...',
  // });
}

export const dynamic = "force-dynamic";
