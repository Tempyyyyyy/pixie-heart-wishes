// RSS proxy — подтягивает новости Minecraft с публичных лент и возвращает JSON.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const FEEDS = [
  { name: "Minecraft.net", url: "https://www.minecraft.net/en-us/feeds/community-content/rss" },
  { name: "PCGamesN", url: "https://www.pcgamesn.com/minecraft/feed" },
];

type NewsItem = {
  title: string;
  link: string;
  description: string;
  image: string | null;
  pubDate: string;
  source: string;
};

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function pick(text: string, re: RegExp): string {
  const m = text.match(re);
  return m ? decodeEntities(m[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim()) : "";
}

function findImage(itemXml: string): string | null {
  const m1 = itemXml.match(/<media:content[^>]+url="([^"]+)"/i)
         || itemXml.match(/<media:thumbnail[^>]+url="([^"]+)"/i)
         || itemXml.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/i);
  if (m1) return m1[1];
  const m2 = itemXml.match(/<img[^>]+src="([^"]+)"/i);
  return m2 ? m2[1] : null;
}

async function parseFeed(url: string, source: string): Promise<NewsItem[]> {
  const res = await fetch(url, { headers: { "User-Agent": "PixiestapeLauncher/1.0" } });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = xml.split(/<item[\s>]/i).slice(1).map(s => s.replace(/<\/item>[\s\S]*$/, ""));
  return items.slice(0, 12).map(i => ({
    title: pick(i, /<title>([\s\S]*?)<\/title>/i),
    link: pick(i, /<link>([\s\S]*?)<\/link>/i),
    description: pick(i, /<description>([\s\S]*?)<\/description>/i).slice(0, 280),
    image: findImage(i),
    pubDate: pick(i, /<pubDate>([\s\S]*?)<\/pubDate>/i),
    source,
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const all = (await Promise.all(FEEDS.map(f => parseFeed(f.url, f.name).catch(() => [])))).flat();
    all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return new Response(JSON.stringify({ items: all.slice(0, 30) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return new Response(JSON.stringify({ error: message, items: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
