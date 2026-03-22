import { getAuthUser } from '../lib/auth.js';

export async function onRequestGet(context) {
  try {
    // Require authentication to access API keys
    const user = await getAuthUser(context);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const brandfetchKey = context.env.BRANDFETCH_API_KEY;
    const brandfetchClientId = context.env.BRANDFETCH_CLIENT_ID;

    return new Response(JSON.stringify({ apiKey: brandfetchKey, clientId: brandfetchClientId }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
