export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const q = url.searchParams.get('q');

  if (!q) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`
    );
    const data = await res.json();
    // Firefox client returns [query, [suggestions]]
    const suggestions = Array.isArray(data[1]) ? data[1].slice(0, 6) : [];
    return new Response(JSON.stringify(suggestions), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
