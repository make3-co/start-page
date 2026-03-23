// Import all route handlers
import { onRequestGet as authLoginGet } from '../functions/api/auth/login.js';
import { onRequestGet as authCallbackGet } from '../functions/api/auth/callback.js';
import { onRequestGet as authMeGet } from '../functions/api/auth/me.js';
import { onRequestPost as authLogoutPost } from '../functions/api/auth/logout.js';
import { onRequestGet as authConfigGet } from '../functions/api/auth/config.js';
import { onRequestPost_setup as passwordSetupPost } from '../functions/api/auth/password.js';
import { onRequestPost_login as passwordLoginPost } from '../functions/api/auth/password.js';
import { onRequestGet as dataGet, onRequestPut as dataPut } from '../functions/api/data.js';
import { onRequestPut as authSetupPut } from '../functions/api/auth_setup.js';
import { onRequestGet as suggestGet } from '../functions/api/suggest.js';
import { onRequestGet as brandfetchConfigGet } from '../functions/api/brandfetch_config.js';
import { onRequestGet as setupStatusGet } from '../functions/api/setup_status.js';

// Build a Pages-compatible context from the Worker request and env
function buildContext(request, env, ctx) {
  return { request, env, waitUntil: ctx.waitUntil.bind(ctx) };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const context = buildContext(request, env, ctx);

    // Route API requests
    if (path.startsWith('/api/')) {
      // Auth routes
      if (path === '/api/auth/login' && method === 'GET') return authLoginGet(context);
      if (path === '/api/auth/callback' && method === 'GET') return authCallbackGet(context);
      if (path === '/api/auth/me' && method === 'GET') return authMeGet(context);
      if (path === '/api/auth/logout' && method === 'POST') return authLogoutPost(context);
      if (path === '/api/auth/config' && method === 'GET') return authConfigGet(context);

      // Password auth
      if (path === '/api/auth/password-setup' && method === 'POST') return passwordSetupPost(context);
      if (path === '/api/auth/password-login' && method === 'POST') return passwordLoginPost(context);

      // Data routes
      if (path === '/api/data' && method === 'GET') return dataGet(context);
      if (path === '/api/data' && method === 'PUT') return dataPut(context);

      // Auth setup
      if (path === '/api/auth_setup' && method === 'PUT') return authSetupPut(context);

      // Setup status
      if (path === '/api/setup/status' && method === 'GET') return setupStatusGet(context);

      // Suggest (Google autocomplete proxy)
      if (path === '/api/suggest' && method === 'GET') return suggestGet(context);

      // Brandfetch config (legacy)
      if (path === '/api/brandfetch_config' && method === 'GET') return brandfetchConfigGet(context);

      // Unknown API route
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Everything else: serve static assets via ASSETS binding
    return env.ASSETS.fetch(request);
  },
};
