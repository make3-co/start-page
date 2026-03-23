/**
 * Normalize OAuth-related bindings. Trims whitespace/BOM issues from .dev.vars / secrets.
 *
 * Redirect URI is auto-derived from the request Host header when not explicitly set,
 * eliminating the GOOGLE_REDIRECT_URI secret requirement.
 *
 * JWT_SECRET is auto-generated and stored in KV if not set as an env secret,
 * eliminating manual secret configuration.
 */
export async function getGoogleOAuthCredentials(context) {
  const env = context.env;
  let clientId = String(env.GOOGLE_CLIENT_ID ?? '').trim();
  const clientSecret = String(env.GOOGLE_CLIENT_SECRET ?? '').trim();

  // Validate that credentials look real (not placeholder dots from deploy tools)
  if (clientId && !clientId.includes('.apps.googleusercontent.com')) clientId = '';

  // Auto-derive redirect URI from request if not explicitly set
  let redirectUri = String(env.GOOGLE_REDIRECT_URI ?? '').trim();
  if (!redirectUri && context.request) {
    const url = new URL(context.request.url);
    redirectUri = `${url.origin}/api/auth/callback`;
  }

  // Fallback: check KV for legacy client ID
  if (!clientId && env.START_PAGE_DATA) {
    try {
      const kv = await env.START_PAGE_DATA.get('authConfig', { type: 'json' });
      if (kv?.clientId) {
        clientId = String(kv.clientId).trim();
      }
    } catch {
      /* ignore */
    }
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Get JWT secret. If not set as env var, auto-generate one and store in KV.
 * This eliminates the need for users to manually create and set a JWT_SECRET.
 */
export async function getJwtSecret(env) {
  const envSecret = String(env.JWT_SECRET ?? '').trim();
  if (envSecret) return envSecret;

  // Auto-generate and persist in KV
  const kv = env.START_PAGE_DATA;
  if (!kv) return '';

  const stored = await kv.get('_jwt_secret');
  if (stored) return stored;

  // Generate a random 256-bit secret
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const secret = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  await kv.put('_jwt_secret', secret);
  return secret;
}
