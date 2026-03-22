import { getAuthUser } from '../../lib/auth.js';

export async function onRequestGet(context) {
  const user = await getAuthUser(context);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    email: user.email,
    name: user.name,
    picture: user.picture,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
