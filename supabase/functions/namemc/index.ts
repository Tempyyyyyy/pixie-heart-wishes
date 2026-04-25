// NameMC + mcsrvstat proxy.
// - servers: курируемый список топ-IP + живой статус через api.mcsrvstat.us (иконка, MOTD, онлайн)
// - skins: парсинг трендовых скинов с NameMC (улучшенный regex)
// - profile: Mojang UUID + плащи через capes.dev

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
// Курируемый топ публичных серверов (международные + RU/CIS).
// Статус (иконка/MOTD/онлайн) подгружается с api.mcsrvstat.us — публичный, без ключа.
const TOP_SERVERS: { name: string; address: string; tags: string[] }[] = [
  { name: "Hypixel",        address: "mc.hypixel.net",       tags: ["minigames", "popular"] },
  { name: "Mineplex",       address: "us.mineplex.com",      tags: ["minigames"] },
  { name: "CubeCraft",      address: "play.cubecraft.net",   tags: ["minigames", "bedwars"] },
  { name: "PikaNetwork",    address: "play.pika-network.net",tags: ["survival", "skyblock"] },
  { name: "Hoplite",        address: "hoplite.gg",           tags: ["pvp", "duels"] },
  { name: "FlowPvP",        address: "flowpvp.gg",           tags: ["pvp"] },
  { name: "CatPvP",         address: "eu.catpvp.xyz",        tags: ["pvp", "duels"] },
  { name: "LifeSteal SMP",  address: "nm.lifestealsmp.com",  tags: ["smp", "lifesteal"] },
  { name: "CavePvP",        address: "cavepvp.com",          tags: ["pvp"] },
  { name: "OG Network",     address: "og-network.net",       tags: ["smp", "rpg"] },
  { name: "EnchantedMC",    address: "enchantedmc.net",      tags: ["smp"] },
  { name: "FullWin",        address: "fullwin.gg",           tags: ["pvp"] },
  { name: "Sunrealms",      address: "vote.sunrealms.net",   tags: ["smp"] },
  { name: "ManaCube",       address: "play.manacube.com",    tags: ["minigames", "skyblock"] },
  { name: "Wynncraft",      address: "play.wynncraft.com",   tags: ["mmo", "rpg"] },
  { name: "Hive",           address: "geo.hivebedrock.network", tags: ["bedrock", "minigames"] },
  { name: "ExtremeCraft",   address: "extremecraft.net",     tags: ["minigames"] },
  { name: "Lemoncloud",     address: "lemoncloud.net",       tags: ["smp"] },
  { name: "MunchyMC",       address: "play.munchymc.com",    tags: ["minigames"] },
  { name: "Origin Realms",  address: "play.originrealms.com",tags: ["smp", "vanilla+"] },
  { name: "Donut SMP",      address: "donutsmp.net",         tags: ["smp", "lifesteal"] },
  { name: "Loyisa",         address: "loyisa.cn",            tags: ["minigames"] },
  { name: "Hub MC",         address: "hub.mcs.gg",           tags: ["network"] },
  { name: "VimeWorld",      address: "vimeworld.com",        tags: ["ru", "minigames"] },
  { name: "FunnyMC",        address: "mc.funnymc.fun",       tags: ["ru", "skyblock"] },
  { name: "ReallyWorld",    address: "play.reallyworld.net", tags: ["ru", "minigames"] },
  { name: "MineLittlePony", address: "mlp.mineplex.com",     tags: ["roleplay"] },
  { name: "Purple Prison",  address: "purpleprison.org",     tags: ["prison"] },
  { name: "MOX MC",         address: "play.moxmc.net",       tags: ["prison"] },
  { name: "Complex",        address: "hub.mc-complex.com",   tags: ["minigames", "skyblock"] },
  { name: "Applecraft",     address: "play.applecraft.org",  tags: ["smp"] },
  { name: "EarthMC",        address: "play.earthmc.net",     tags: ["towny"] },
  { name: "Constantiam",    address: "constantiam.net",      tags: ["anarchy"] },
  { name: "2b2t",           address: "2b2t.org",             tags: ["anarchy"] },
  { name: "FunCraft",       address: "play.funcraft.net",    tags: ["minigames"] },
  { name: "BlocksMC",       address: "play.blocksmc.com",    tags: ["minigames"] },
  { name: "ZedarMC",        address: "play.zedarmc.com",     tags: ["minigames"] },
  { name: "BedWars Practice", address: "bwp.gg",             tags: ["bedwars", "practice"] },
  { name: "MineSuperior",   address: "play.minesuperior.com",tags: ["smp", "skyblock"] },
  { name: "AkumaMC",        address: "akumamc.net",          tags: ["pvp"] },
  { name: "Vortex Network", address: "play.vortexnetwork.net", tags: ["minigames"] },
  { name: "Vanity MC",      address: "play.vanitymc.co",     tags: ["minigames"] },
  { name: "Datblock",       address: "datblock.com",         tags: ["smp"] },
  { name: "Towny Earth",    address: "play.skyblock.net",    tags: ["skyblock"] },
  { name: "Snapcraft",      address: "play.snapcraft.net",   tags: ["smp", "skyblock"] },
  { name: "Mineverse",      address: "play.mineverse.com",   tags: ["smp"] },
];

type ServerHit = {
  rank: number;
  name: string;
  address: string;
  icon?: string;
  motd?: string;
  online?: number;
  max?: number;
  version?: string;
  tags: string[];
};

async function fetchStatus(addr: string) {
  try {
    const r = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(addr)}`, {
      headers: { "user-agent": UA },
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j?.online) return null;
    return {
      icon: j.icon as string | undefined, // data:image/png;base64,...
      motd: Array.isArray(j.motd?.clean) ? j.motd.clean.join(" ").trim() : undefined,
      online: j.players?.online as number | undefined,
      max: j.players?.max as number | undefined,
      version: j.version as string | undefined,
    };
  } catch {
    return null;
  }
}

async function getTopServers(): Promise<ServerHit[]> {
  const cached = getCached<ServerHit[]>("servers-v2");
  if (cached) return cached;
  // Параллельно тянем статус для всех серверов с лимитом 8
  const results: ServerHit[] = [];
  const queue = [...TOP_SERVERS];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      const status = await fetchStatus(item.address);
      results.push({
        rank: 0,
        name: item.name,
        address: item.address,
        tags: item.tags,
        icon: status?.icon,
        motd: status?.motd,
        online: status?.online,
        max: status?.max,
        version: status?.version,
      });
    }
  });
  await Promise.all(workers);
  // Сортировка: онлайн-серверы по числу игроков, потом остальные в исходном порядке
  results.sort((a, b) => (b.online ?? -1) - (a.online ?? -1));
  results.forEach((s, i) => (s.rank = i + 1));
  setCached("servers-v2", results);
  return results;
}

// ----- SKINS -----

type SkinHit = {
  id: string;
  image: string;
  url: string;
};

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function parseSkins(html: string): SkinHit[] {
  const out: SkinHit[] = [];
  const seen = new Set<string>();
  // Несколько вариантов разметки
  const patterns = [
    /<a[^>]+href="\/skin\/([a-f0-9]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/g,
    /href="\/skin\/([a-f0-9]+)"[\s\S]{0,300}?data-src="([^"]+)"/g,
    /\/skin\/([a-f0-9]{8,})[\s\S]{0,500}?(https:\/\/s\.namemc\.com\/[^"'\s]+\.png)/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const id = m[1];
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        image: decode(m[2]),
        url: `https://namemc.com/skin/${id}`,
      });
    }
  }
  // Резервный: только id из ссылок, картинку строим сами через s.namemc.com
  if (out.length < 10) {
    const re = /href="\/skin\/([a-f0-9]{8,})"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const id = m[1];
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        id,
        image: `https://s.namemc.com/3d/skin/body/${id}.png?width=256`,
        url: `https://namemc.com/skin/${id}`,
      });
    }
  }
  return out.slice(0, 60);
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

// ----- PROFILE + CAPES -----

async function fetchCapes(uuid: string) {
  // capes.dev возвращает плащи Mojang/Optifine/LabyMod/MinecraftCapes
  try {
    const r = await fetch(`https://api.capes.dev/load/${uuid}`, {
      headers: { "user-agent": UA },
    });
    if (!r.ok) return [];
    const j = await r.json();
    const caps: { id: string; name: string; image: string; type: string }[] = [];
    for (const [type, info] of Object.entries<any>(j)) {
      if (info?.imageUrl) {
        caps.push({
          id: `${type}-${info.id ?? ""}`,
          name: info.capeName || type,
          image: info.imageUrl,
          type,
        });
      }
    }
    return caps;
  } catch {
    return [];
  }
}

async function searchProfile(username: string) {
  const key = `profile:${username.toLowerCase()}`;
  const cached = getCached<any>(key);
  if (cached) return cached;
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

  const capes = uuid ? await fetchCapes(uuid) : [];

  const result = {
    username: trueName,
    uuid,
    skinUrl: `https://mc-heads.net/skin/${encodeURIComponent(trueName)}`,
    capes,
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
