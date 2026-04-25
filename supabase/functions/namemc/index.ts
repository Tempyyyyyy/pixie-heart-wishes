// NameMC scraping proxy: top servers + top/search skins.
// HTML-парсинг очень хрупок, но NameMC не имеет официального API.
// Возвращаем данные с CORS-заголовками, кэшируем по 10 минут.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() - v.at > TTL) {
    cache.delete(key);
    return null;
  }
  return v.data as T;
}
function setCached(key: string, data: unknown) {
  cache.set(key, { at: Date.now(), data });
}

async function fetchHtml(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      "user-agent": UA,
      "accept-language": "ru,en;q=0.9",
      accept: "text/html,application/xhtml+xml",
    },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return await r.text();
}

// ----- SERVERS -----

type ServerHit = {
  rank: number;
  name: string;
  address: string;
  votes: number;
  country?: string;
  motd?: string;
  icon?: string;
  version?: string;
};

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(s: string): string {
  return decode(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function parseServers(html: string): ServerHit[] {
  // NameMC server cards live in <a href="/server/<addr>"> blocks
  const out: ServerHit[] = [];
  const cardRegex =
    /<a[^>]+href="\/server\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  let rank = 0;
  const seen = new Set<string>();
  while ((m = cardRegex.exec(html)) !== null) {
    const addr = decode(m[1]).trim();
    if (!addr || seen.has(addr)) continue;
    const inner = m[2];
    // Skip if it looks like just an icon reference (no card body)
    if (inner.length < 30) continue;
    rank++;
    seen.add(addr);
    const iconMatch = inner.match(/<img[^>]+src="([^"]+)"/);
    const motd = stripTags(inner).slice(0, 140);
    out.push({
      rank,
      name: addr.split(".")[0],
      address: addr,
      votes: 0,
      icon: iconMatch ? iconMatch[1] : undefined,
      motd,
    });
    if (out.length >= 30) break;
  }
  return out;
}

async function getTopServers(): Promise<ServerHit[]> {
  const cached = getCached<ServerHit[]>("servers");
  if (cached) return cached;
  const html = await fetchHtml("https://namemc.com/minecraft-servers");
  const data = parseServers(html);
  setCached("servers", data);
  return data;
}

// ----- SKINS -----

type SkinHit = {
  id: string; // skin hash on NameMC
  name?: string;
  image: string;
  url: string;
};

function parseSkins(html: string): SkinHit[] {
  // NameMC skin tiles: <a href="/skin/<id>"> with <img src="https://s.namemc.com/i/<id>.png">
  const out: SkinHit[] = [];
  const seen = new Set<string>();
  const regex =
    /<a[^>]+href="\/skin\/([a-f0-9]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      image: decode(m[2]),
      url: `https://namemc.com/skin/${id}`,
    });
    if (out.length >= 60) break;
  }
  return out;
}

async function getTopSkins(period: string, page: number): Promise<SkinHit[]> {
  const key = `skins:${period}:${page}`;
  const cached = getCached<SkinHit[]>(key);
  if (cached) return cached;
  const url = `https://namemc.com/minecraft-skins/trending/${period}?page=${page}`;
  const html = await fetchHtml(url);
  const data = parseSkins(html);
  setCached(key, data);
  return data;
}

async function searchProfile(username: string): Promise<{
  username: string;
  uuid?: string;
  skinUrl: string;
  skinId?: string;
  capes?: { id: string; name: string; image: string }[];
} | null> {
  const key = `profile:${username.toLowerCase()}`;
  const cached = getCached<any>(key);
  if (cached) return cached;
  // Use Mojang API for UUID + name correctness
  let uuid: string | undefined;
  let trueName = username;
  try {
    const r = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
    );
    if (r.ok) {
      const j = await r.json();
      uuid = j.id;
      trueName = j.name;
    }
  } catch { /* ignore */ }

  const result = {
    username: trueName,
    uuid,
    skinUrl: `https://mc-heads.net/skin/${encodeURIComponent(trueName)}`,
  };
  setCached(key, result);
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "servers";

    if (action === "servers") {
      const data = await getTopServers();
      return new Response(JSON.stringify({ servers: data }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    if (action === "skins") {
      const period = url.searchParams.get("period") ?? "weekly";
      const page = parseInt(url.searchParams.get("page") ?? "1", 10);
      const data = await getTopSkins(period, page);
      return new Response(JSON.stringify({ skins: data }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    if (action === "profile") {
      const username = url.searchParams.get("username") ?? "";
      if (!username.trim()) {
        return new Response(JSON.stringify({ error: "username required" }), {
          status: 400,
          headers: { ...corsHeaders, "content-type": "application/json" },
        });
      }
      const data = await searchProfile(username.trim());
      return new Response(JSON.stringify({ profile: data }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("namemc error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
