import { signJwt } from '../../lib/jwt.js';
import { buildSetCookie } from '../../lib/cookies.js';
import { getJwtSecret } from '../../lib/oauth_env.js';
import { getStartPageKv } from '../../lib/kv.js';

const encoder = new TextEncoder();

async function hashPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * POST /api/auth/password-setup — Set password (first-time only)
 */
export async function onRequestPost_setup(context) {
  const kv = getStartPageKv(context.env);
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }

  // Only allow if no password is set yet
  const existing = await kv.get('_password_hash');
  if (existing) {
    return new Response(JSON.stringify({ error: 'Password already configured' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { password } = await context.request.json();
  if (!password || password.length < 6) {
    return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  // Generate salt and hash
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = Array.from(saltBytes, b => b.toString(16).padStart(2, '0')).join('');
  const hash = await hashPassword(password, salt);

  await kv.put('_password_hash', JSON.stringify({ salt, hash }));

  // Auto-sign in after setup
  const JWT_SECRET = await getJwtSecret(context.env);
  const jwt = await signJwt({ email: 'owner', name: 'Owner' }, JWT_SECRET, 7);

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', buildSetCookie(context.request, [
    `token=${jwt}`, 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=604800',
  ]));

  return new Response(JSON.stringify({ success: true }), { headers });
}

/**
 * POST /api/auth/password-login — Verify password and sign in
 */
export async function onRequestPost_login(context) {
  const kv = getStartPageKv(context.env);
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }

  const stored = await kv.get('_password_hash', { type: 'json' });
  if (!stored) {
    return new Response(JSON.stringify({ error: 'Password auth not configured' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { password } = await context.request.json();
  const hash = await hashPassword(password, stored.salt);

  if (hash !== stored.hash) {
    return new Response(JSON.stringify({ error: 'Invalid password' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const JWT_SECRET = await getJwtSecret(context.env);
  const jwt = await signJwt({ email: 'owner', name: 'Owner' }, JWT_SECRET, 7);

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', buildSetCookie(context.request, [
    `token=${jwt}`, 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=604800',
  ]));

  return new Response(JSON.stringify({ success: true }), { headers });
}
