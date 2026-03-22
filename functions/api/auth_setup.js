import { verifyJwt } from '../lib/jwt.js';

function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${name}=`));
  return match ? match.substring(name.length + 1) : null;
}

export async function onRequestPut(context) {
  try {
    const { allowedEmails: rawEmails } = await context.request.json();

    // Normalize allowed emails
    let allowedEmails = [];
    if (Array.isArray(rawEmails)) {
      allowedEmails = rawEmails.filter(Boolean).map(e => e.trim().toLowerCase());
    }

    // If auth is already configured, require valid JWT
    const currentConfig = await context.env.START_PAGE_DATA.get("authConfig", { type: "json" });

    if (currentConfig && currentConfig.allowedEmails && currentConfig.allowedEmails.length) {
      const token = getCookie(context.request, 'token');
      if (!token) {
        return new Response("Unauthorized: Auth config already set", { status: 401 });
      }

      const user = await verifyJwt(token, context.env.JWT_SECRET);
      if (!user) {
        return new Response("Invalid Token", { status: 403 });
      }

      const currentAllowed = currentConfig.allowedEmails.map(e => e.toLowerCase());
      if (!currentAllowed.includes(user.email.toLowerCase())) {
        return new Response("Unauthorized Email", { status: 403 });
      }
    }

    const config = { allowedEmails };
    await context.env.START_PAGE_DATA.put("authConfig", JSON.stringify(config));

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
