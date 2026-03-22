import { getGoogleOAuthCredentials } from '../../lib/oauth_env.js';

/**
 * Tells the client whether Google OAuth is wired up (so the sign-in button can show
 * even when KV authConfig / appData.authConfig.configured is still false).
 */
export async function onRequestGet(context) {
  const { clientId, redirectUri } = await getGoogleOAuthCredentials(context);
  const googleOAuthEnabled = !!(clientId && redirectUri);

  const url = new URL(context.request.url);
  const isLocal =
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.endsWith('.localhost');

  /** Compare to Google Console: substring is easy to misread as obbpsirc vs obbpsirc */
  const body = { googleOAuthEnabled };
  if (isLocal && clientId) {
    body.clientIdLength = clientId.length;
    // Right after "549539146743-pggtplp" — easy to confuse obbpsirc vs obbpsirc when typing
    body.clientIdAfterPggtplp = clientId.slice(20, 28);
  }

  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
