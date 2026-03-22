import { verifyJwt } from '../../lib/jwt.js';

function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${name}=`));
  return match ? match.substring(name.length + 1) : null;
}

export async function onRequestGet(context) {
  const token = getCookie(context.request, 'token');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await verifyJwt(token, context.env.JWT_SECRET);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
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
