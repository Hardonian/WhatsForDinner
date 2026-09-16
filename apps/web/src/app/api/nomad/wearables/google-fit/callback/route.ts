import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('google-fit-callback');

/**
 * Encrypt token using AES-256-GCM
 */
async function encryptToken(token: string): Promise<string> {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || randomBytes(32).toString('hex'), 'hex');
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  // Return IV + AuthTag + Encrypted data (all hex encoded)
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Google Fit OAuth Callback
 * Handles OAuth redirect from Google Fit
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL('/auth?error=unauthorized', request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/nomad/settings?error=${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/nomad/settings?error=no_code', request.url)
      );
    }

    // Exchange code for access token
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_FIT_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET;
    const redirectUri = `${new URL(request.url).origin}/api/nomad/wearables/google-fit/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Store encrypted access token in database
    // In production, encrypt this token before storing
    const { error: syncError } = await supabase
      .from('wearable_sync')
      .upsert({
        user_id: user.id,
        provider: 'google_fit',
        access_token_encrypted: await encryptToken(tokenData.access_token),
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (syncError) {
      _logger.error('Error saving Google Fit sync:', { syncError });
      return NextResponse.redirect(
        new URL('/nomad/settings?error=sync_failed', request.url)
      );
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/nomad/settings?connected=google-fit', request.url)
    );
  } catch (error) {
    // Error handled: Google Fit callback error:
    return NextResponse.redirect(
      new URL('/nomad/settings?error=callback_failed', request.url)
    );
  }
}

export const dynamic = "force-dynamic";
