import { getGoogleOAuthCredentials } from '../../lib/oauth_env.js';
import { getStartPageKv } from '../../lib/kv.js';

/**
 * Tells the client what auth methods are available.
 */
export async function onRequestGet(context) {
  const { clientId } = await getGoogleOAuthCredentials(context);
  const googleOAuthEnabled = !!clientId;

  // Check if password auth is configured
  const kv = getStartPageKv(context.env);
  let passwordAuthEnabled = false;
  let setupComplete = false;
  if (kv) {
    const passwordHash = await kv.get('_password_hash');
    passwordAuthEnabled = !!passwordHash;
    const authConfig = await kv.get('authConfig', { type: 'json' });
    setupComplete = passwordAuthEnabled || googleOAuthEnabled || !!(authConfig && authConfig.allowedEmails && authConfig.allowedEmails.length);
  }

  return new Response(JSON.stringify({
    googleOAuthEnabled,
    passwordAuthEnabled,
    setupComplete,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
