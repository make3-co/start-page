import { getAuthUser } from '../lib/auth.js';
import { getStartPageKv } from '../lib/kv.js';

export async function onRequestGet(context) {
  try {
    const kv = getStartPageKv(context.env);
    if (!kv) {
      return new Response(null, { status: 404 });
    }

    const [appDataStr, authConfig] = await Promise.all([
      kv.get('appData'),
      kv.get('authConfig', { type: 'json' }),
    ]);

    let appData = appDataStr ? JSON.parse(appDataStr) : null;

    const user = await getAuthUser(context);
    let isAuthorized = false;

    if (user) {
      isAuthorized = true;
      // Check allowed emails if configured
      if (authConfig && authConfig.allowedEmails && authConfig.allowedEmails.length) {
        const allowList = authConfig.allowedEmails.map(e => e.toLowerCase());
        if (!allowList.includes(user.email.toLowerCase())) {
          isAuthorized = false;
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }

    // If privacy is enabled and user is not authorized, return a minimal payload
    if (appData && appData.hideWhenLoggedOut && !isAuthorized) {
      const minimal = {
        authConfig: { configured: !!(authConfig && authConfig.allowedEmails && authConfig.allowedEmails.length) },
        hideWhenLoggedOut: true,
        layoutMode: appData.layoutMode || "masonry",
        enabledGoogleApps: appData.enabledGoogleApps || [],
        groups: []
      };
      return new Response(JSON.stringify(minimal), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (appData && authConfig) {
      if (!appData.authConfig) appData.authConfig = {};
      appData.authConfig.configured = true;
      if (isAuthorized) {
        appData.authConfig.allowedEmails = authConfig.allowedEmails || [];
      }
    } else if (appData && !appData.authConfig) {
      appData.authConfig = { configured: false };
    }

    if (!appData) {
      return new Response(null, { status: 404 });
    }

    return new Response(JSON.stringify(appData), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPut(context) {
  try {
    const kv = getStartPageKv(context.env);
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV binding START_PAGE_DATA is not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await context.request.json();

    const authConfig = await kv.get('authConfig', { type: 'json' });

    // Security Check — require valid JWT cookie if auth is configured
    if (authConfig && authConfig.allowedEmails && authConfig.allowedEmails.length) {
      const user = await getAuthUser(context);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const allowList = authConfig.allowedEmails.map(e => e.toLowerCase());
      if (!allowList.includes(user.email.toLowerCase())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Clean data before saving
    if (data.authConfig) {
      delete data.authConfig;
    }

    await kv.put('appData', JSON.stringify(data));

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
