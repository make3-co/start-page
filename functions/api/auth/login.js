import { buildSetCookie } from '../../lib/cookies.js';
import { getGoogleOAuthCredentials } from '../../lib/oauth_env.js';

export async function onRequestGet(context) {
  const { request } = context;
  const { clientId: GOOGLE_CLIENT_ID, redirectUri: GOOGLE_REDIRECT_URI } =
    await getGoogleOAuthCredentials(context);

  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    return new Response("Google OAuth not configured", { status: 500 });
  }

  // Generate random state for CSRF protection
  const stateBytes = new Uint8Array(16);
  crypto.getRandomValues(stateBytes);
  const state = Array.from(stateBytes, b => b.toString(16).padStart(2, '0')).join('');

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  });

  const headers = new Headers({
    Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  });
  headers.append(
    'Set-Cookie',
    buildSetCookie(request, [
      `oauth_state=${state}`,
      'HttpOnly',
      'SameSite=Lax',
      'Path=/api/auth/callback',
      'Max-Age=600',
    ])
  );

  return new Response(null, { status: 302, headers });
}
