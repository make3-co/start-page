import { verifyJwt } from './jwt.js';
import { getJwtSecret } from './oauth_env.js';

export function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${name}=`));
  return match ? match.substring(name.length + 1) : null;
}

export async function getAuthUser(context) {
  const token = getCookie(context.request, 'token');
  if (!token) return null;
  const secret = await getJwtSecret(context.env);
  if (!secret) return null;
  return verifyJwt(token, secret);
}
