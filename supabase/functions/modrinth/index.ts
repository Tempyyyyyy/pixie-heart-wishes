// Proxy to Modrinth API. Avoids CORS issues from the browser and lets us add
// a friendly User-Agent. No auth required — public catalog data.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const MODRINTH_BASE = "https://api.modrinth.com/v2";
const UA = "PixiestapeLauncher/0.2.0 (lovable.dev)";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Path after /modrinth/  e.g.  search, project/<id>, project/<id>/version
    const subPath = url.pathname.replace(/^\/+functions\/v1\/modrinth\/?/, "")
      .replace(/^\/+modrinth\/?/, "");

    if (!subPath) {
      return new Response(
        JSON.stringify({ error: "missing path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const target = `${MODRINTH_BASE}/${subPath}${url.search}`;
    const res = await fetch(target, {
      headers: { "User-Agent": UA, "Accept": "application/json" },
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        ...corsHeaders,
        "Content-Type": res.headers.get("content-type") ?? "application/json",
        "Cache-Control": "public, max-age=120",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
