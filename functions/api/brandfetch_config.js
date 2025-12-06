export async function onRequestGet(context) {
  try {
    const brandfetchKey = context.env.BRANDFETCH_API_KEY;
    const brandfetchClientId = context.env.BRANDFETCH_CLIENT_ID;
    
    // Expose only the values needed by the client; key should still be scoped as a secret in CF.
    return new Response(JSON.stringify({ apiKey: brandfetchKey, clientId: brandfetchClientId }), {
        headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

