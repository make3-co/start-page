import { getStartPageKv } from '../lib/kv.js';

/**
 * GET /api/setup/status — Returns what's configured so the frontend
 * can decide whether to show the setup wizard.
 */
export async function onRequestGet(context) {
  const env = context.env;
  const kv = getStartPageKv(env);

  const hasGoogleClientId = !!String(env.GOOGLE_CLIENT_ID ?? '').trim();
  const hasGoogleClientSecret = !!String(env.GOOGLE_CLIENT_SECRET ?? '').trim();
  const googleConfigured = hasGoogleClientId && hasGoogleClientSecret;

  let passwordConfigured = false;
  let hasData = false;
  if (kv) {
    const passwordHash = await kv.get('_password_hash');
    passwordConfigured = !!passwordHash;
    const data = await kv.get('appData');
    hasData = !!data;
  }

  // Derive the callback URL for Google OAuth setup instructions
  const url = new URL(context.request.url);
  const callbackUrl = `${url.origin}/api/auth/callback`;

  return new Response(JSON.stringify({
    googleConfigured,
    passwordConfigured,
    hasData,
    needsSetup: !googleConfigured && !passwordConfigured,
    callbackUrl,
    origin: url.origin,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
