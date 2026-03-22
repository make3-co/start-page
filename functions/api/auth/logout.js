import { buildSetCookie } from '../../lib/cookies.js';

export async function onRequestPost(context) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append(
    'Set-Cookie',
    buildSetCookie(context.request, [
      'token=',
      'HttpOnly',
      'SameSite=Lax',
      'Path=/',
      'Max-Age=0',
    ])
  );

  return new Response(JSON.stringify({ success: true }), { headers });
}
