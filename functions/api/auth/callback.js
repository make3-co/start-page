import { signJwt } from '../../lib/jwt.js';
import { getCookie } from '../../lib/auth.js';
import { buildSetCookie } from '../../lib/cookies.js';
import { getGoogleOAuthCredentials, getJwtSecret } from '../../lib/oauth_env.js';
import { getStartPageKv } from '../../lib/kv.js';

export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const frontendUrl = url.origin;

  if (!code) {
    return Response.redirect(`${frontendUrl}?error=missing_code`, 302);
  }

  // Verify CSRF state
  const storedState = getCookie(context.request, 'oauth_state');
  if (!state || !storedState || state !== storedState) {
    return Response.redirect(`${frontendUrl}?error=invalid_state`, 302);
  }

  const { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, redirectUri: GOOGLE_REDIRECT_URI } =
    await getGoogleOAuthCredentials(context);
  const JWT_SECRET = await getJwtSecret(context.env);

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI || !JWT_SECRET) {
    return Response.redirect(`${frontendUrl}?error=oauth_not_configured`, 302);
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const redirectUriEncoded = encodeURIComponent(GOOGLE_REDIRECT_URI);
    return Response.redirect(`${frontendUrl}?error=token_exchange_failed&redirect_uri=${redirectUriEncoded}`, 302);
  }

  const tokens = await tokenRes.json();

  // Fetch user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return Response.redirect(`${frontendUrl}?error=userinfo_failed`, 302);
  }

  const profile = await userRes.json();

  // Check allowed emails — auto-lock to first sign-in if not configured
  const kv = getStartPageKv(context.env);
  const authConfig = kv ? await kv.get('authConfig', { type: 'json' }) : null;
  if (authConfig && authConfig.allowedEmails && authConfig.allowedEmails.length) {
    const allowList = authConfig.allowedEmails.map(e => e.toLowerCase());
    if (!allowList.includes(profile.email.toLowerCase())) {
      return Response.redirect(`${frontendUrl}?error=unauthorized_email`, 302);
    }
  } else if (kv) {
    // First Google sign-in — auto-lock to this email
    await kv.put('authConfig', JSON.stringify({
      allowedEmails: [profile.email.toLowerCase()]
    }));
  }

  // Sign our own JWT
  const jwt = await signJwt(
    { email: profile.email, name: profile.name, picture: profile.picture },
    JWT_SECRET,
    7
  );

  // Set httpOnly cookie, clear state cookie, and redirect home
  const headers = new Headers({ Location: frontendUrl });
  headers.append(
    'Set-Cookie',
    buildSetCookie(request, [
      `token=${jwt}`,
      'HttpOnly',
      'SameSite=Lax',
      'Path=/',
      'Max-Age=604800',
    ])
  );
  headers.append(
    'Set-Cookie',
    buildSetCookie(request, [
      'oauth_state=',
      'HttpOnly',
      'SameSite=Lax',
      'Path=/api/auth/callback',
      'Max-Age=0',
    ])
  );

  return new Response(null, { status: 302, headers });
}
