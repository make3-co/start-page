export async function onRequestGet(context) {
  try {
    // Get appData and authConfig
    const [appDataStr, authConfig] = await Promise.all([
      context.env.START_PAGE_DATA.get("appData"),
      context.env.START_PAGE_DATA.get("authConfig", { type: "json" })
    ]);
    
    let appData = appDataStr ? JSON.parse(appDataStr) : null;

    // Inject Client ID into appData (but NOT allowedEmail)
    if (appData && authConfig) {
        if (!appData.authConfig) appData.authConfig = {};
        appData.authConfig.clientId = authConfig.clientId;
        // Do not expose allowedEmail
        delete appData.authConfig.allowedEmail;
    } else if (appData && !appData.authConfig) {
        // Ensure structure
        appData.authConfig = { clientId: "" };
    }

    if (!appData) {
      return new Response(null, { status: 404 });
    }

    return new Response(JSON.stringify(appData), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response("Error fetching data: " + err.message, { status: 500 });
  }
}

export async function onRequestPut(context) {
  try {
    const data = await context.request.json();
    const authHeader = context.request.headers.get("Authorization");
    
    // Get Auth Config
    const authConfig = await context.env.START_PAGE_DATA.get("authConfig", { type: "json" });
    
    // Security Check
    if (authConfig && authConfig.clientId) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
             return new Response("Unauthorized: Sign in required", { status: 401 });
        }
        
        const token = authHeader.split(" ")[1];
        
        // Verify token with Google
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (!tokenRes.ok) {
             return new Response("Invalid Token", { status: 403 });
        }
        
        const payload = await tokenRes.json();
        
        // Check Audience (Client ID)
        if (payload.aud !== authConfig.clientId) {
            return new Response("Invalid Token Client", { status: 403 });
        }

        // Check Email (if restricted)
        if (authConfig.allowedEmail && 
            payload.email.toLowerCase() !== authConfig.allowedEmail.toLowerCase()) {
             return new Response("Unauthorized Email", { status: 403 });
        }
    }
    
    // Clean data before saving (Don't save authConfig in the general blob)
    // We want to keep the `appData` clean of the actual secrets, relying on `onRequestGet` to inject the public ID.
    if (data.authConfig) {
        delete data.authConfig; // Remove from blob
    }

    // Save to KV
    await context.env.START_PAGE_DATA.put("appData", JSON.stringify(data));
    
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