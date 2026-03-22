import { getAuthUser } from '../lib/auth.js';

export async function onRequestPut(context) {
  try {
    const { allowedEmails: rawEmails } = await context.request.json();

    // Normalize allowed emails
    let allowedEmails = [];
    if (Array.isArray(rawEmails)) {
      allowedEmails = rawEmails.filter(Boolean).map(e => e.trim().toLowerCase());
    }

    const currentConfig = await context.env.START_PAGE_DATA.get("authConfig", { type: "json" });

    if (currentConfig && currentConfig.allowedEmails && currentConfig.allowedEmails.length) {
      // Auth already configured — require valid JWT from an allowed user
      const user = await getAuthUser(context);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const currentAllowed = currentConfig.allowedEmails.map(e => e.toLowerCase());
      if (!currentAllowed.includes(user.email.toLowerCase())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
    } else {
      // First-time setup — require valid JWT (must be signed in, but no email check)
      const user = await getAuthUser(context);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Sign in before configuring auth' }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    const config = { allowedEmails };
    await context.env.START_PAGE_DATA.put("authConfig", JSON.stringify(config));

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
