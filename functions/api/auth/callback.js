import { signJwt } from '../../lib/jwt.js';
import { getCookie } from '../../lib/auth.js';

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
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

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, JWT_SECRET } = context.env;

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
    return Response.redirect(`${frontendUrl}?error=token_exchange_failed`, 302);
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

  // Check allowed emails if configured
  const authConfig = await context.env.START_PAGE_DATA.get("authConfig", { type: "json" });
  if (authConfig) {
    const allowList = (authConfig.allowedEmails || []).map(e => e.toLowerCase());
    if (allowList.length && !allowList.includes(profile.email.toLowerCase())) {
      return Response.redirect(`${frontendUrl}?error=unauthorized_email`, 302);
    }
  }

  // Sign our own JWT
  const jwt = await signJwt(
    { email: profile.email, name: profile.name, picture: profile.picture },
    JWT_SECRET,
    7
  );

  // Set httpOnly cookie, clear state cookie, and redirect home
  const headers = new Headers({ Location: frontendUrl });
  headers.append('Set-Cookie', [
    `token=${jwt}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=604800',
  ].join('; '));
  headers.append('Set-Cookie', [
    'oauth_state=',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/api/auth/callback',
    'Max-Age=0',
  ].join('; '));

  return new Response(null, { status: 302, headers });
}
