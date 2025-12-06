export async function onRequestGet(context) {
  try {
    // Get data from KV
    // Assuming binding name is START_PAGE_DATA
    const value = await context.env.START_PAGE_DATA.get("appData");
    
    if (!value) {
      return new Response(null, { status: 404 });
    }

    return new Response(value, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response("Error fetching data", { status: 500 });
  }
}

export async function onRequestPut(context) {
  try {
    const data = await context.request.json();
    
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

