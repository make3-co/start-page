export async function onRequestPost(context) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', [
    'token=',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
  ].join('; '));

  return new Response(JSON.stringify({ success: true }), { headers });
}
