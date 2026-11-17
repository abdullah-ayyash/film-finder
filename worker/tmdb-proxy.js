// Cloudflare Worker that forwards a few read-only TMDB requests and adds your API key server-side.
// Deploy: create a Worker, paste this file, then add secrets/variables:
//   TMDB_KEY       (secret)   your TMDB v3 API key
//   ALLOWED_ORIGIN (variable) e.g. https://your-username.github.io
// Then set proxyUrl in js/config.js to the Worker URL.
const ALLOWED_PATHS = /^(genre\/movie\/list|discover\/movie|movie\/\d+)$/;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    if (env.ALLOWED_ORIGIN && origin && origin !== env.ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, "");
    if (request.method !== "GET" || !ALLOWED_PATHS.test(path)) {
      return new Response("Not found", { status: 404 });
    }
    url.searchParams.set("api_key", env.TMDB_KEY);
    const upstream = await fetch(`https://api.themoviedb.org/3/${path}${url.search}`);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
        "Cache-Control": "public, max-age=600",
      },
    });
  },
};
