/**
 * Normalize OAuth-related bindings. Trims whitespace/BOM issues from .dev.vars / secrets.
 *
 * Before server-side OAuth (commit 66ce769), the SPA used Google Identity Services with
 * client_id from KV authConfig.clientId. That field is no longer written by auth_setup, but
 * older KV records may still have it — use as fallback only when GOOGLE_CLIENT_ID is unset.
 */
export async function getGoogleOAuthCredentials(context) {
  const env = context.env;
  let clientId = String(env.GOOGLE_CLIENT_ID ?? '').trim();
  const clientSecret = String(env.GOOGLE_CLIENT_SECRET ?? '').trim();
  const redirectUri = String(env.GOOGLE_REDIRECT_URI ?? '').trim();

  if (!clientId && env.START_PAGE_DATA) {
    try {
      const kv = await env.START_PAGE_DATA.get('authConfig', { type: 'json' });
      if (kv?.clientId) {
        clientId = String(kv.clientId).trim();
      }
    } catch {
      /* ignore */
    }
  }

  return { clientId, clientSecret, redirectUri };
}

export function getJwtSecret(env) {
  return String(env.JWT_SECRET ?? '').trim();
}
