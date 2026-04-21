// Curated list of well-known public Minecraft servers. Icons via Google's
// favicon service so we always get something rather than a broken link.

export type ServerEntry = {
  id: string;
  name: string;
  address: string;
  description: string;
  category: "survival" | "minigames" | "anarchy" | "smp" | "creative" | "rpg" | "tech";
  version: string;
  website: string;
  players?: string;
  tags: string[];
};

export const SERVERS: ServerEntry[] = [
  { id: "1", name: "Hypixel", address: "mc.hypixel.net", description: "Крупнейший мини-игровой сервер: Bedwars, Skyblock, Skywars и десятки других режимов.", category: "minigames", version: "1.8 - 1.21", website: "hypixel.net", players: "60k+", tags: ["bedwars", "skyblock"] },
  { id: "2", name: "Mineplex", address: "us.mineplex.com", description: "Один из старейших мини-игровых серверов с уникальными режимами.", category: "minigames", version: "1.8+", website: "mineplex.com", players: "5k+", tags: ["minigames"] },
  { id: "3", name: "2b2t", address: "2b2t.org", description: "Самый известный анархия-сервер. Никаких правил, без вайпов с 2010 года.", category: "anarchy", version: "1.21", website: "2b2t.org", players: "1k+", tags: ["анархия", "хардкор"] },
  { id: "4", name: "Wynncraft", address: "play.wynncraft.com", description: "MMORPG-сервер с огромным открытым миром и уникальной системой классов.", category: "rpg", version: "1.20+", website: "wynncraft.com", players: "2k+", tags: ["mmorpg"] },
  { id: "5", name: "CubeCraft", address: "play.cubecraft.net", description: "Мини-игры с упором на качество: SkyWars, EggWars, Lucky Islands.", category: "minigames", version: "1.8+", website: "cubecraft.net", players: "8k+", tags: ["minigames"] },
  { id: "6", name: "PikaNetwork", address: "play.pika-network.net", description: "Европейский сервер с Bedwars, Skyblock, KitPvP и Practice.", category: "minigames", version: "1.8 - 1.21", website: "pika-network.net", players: "5k+", tags: ["bedwars"] },
  { id: "7", name: "Manacube", address: "play.manacube.com", description: "Уютный сервер с парком, скайблоком, кубкрафтом и креативом.", category: "creative", version: "1.8+", website: "manacube.com", players: "1k+", tags: ["parkour"] },
  { id: "8", name: "BlocksMC", address: "play.blocksmc.com", description: "Мини-игры на cracked сервере, доступ для пиратки.", category: "minigames", version: "1.8 - 1.21", website: "blocksmc.com", players: "3k+", tags: ["cracked"] },
  { id: "9", name: "Cosmic SMP", address: "play.cosmicsmp.net", description: "Сезонный SMP с экономикой и тимами.", category: "smp", version: "1.21", website: "cosmicsmp.net", players: "500+", tags: ["smp"] },
  { id: "10", name: "Origin Realms", address: "play.originrealms.com", description: "SMP с кастомными мобами и системой крафта в стиле adventure.", category: "smp", version: "1.21", website: "originrealms.com", players: "300+", tags: ["adventure"] },
  { id: "11", name: "Loyisa", address: "play.loyisa.cn", description: "Китайский Bedwars/мини-игровой сервер с быстрым геймплеем.", category: "minigames", version: "1.8+", website: "loyisa.cn", players: "10k+", tags: ["bedwars"] },
  { id: "12", name: "Vanilla Realms", address: "play.vanillarealms.com", description: "Чистая ваниль с проверкой никнейма, без читеров.", category: "survival", version: "1.21", website: "vanillarealms.com", players: "200+", tags: ["vanilla"] },
  { id: "13", name: "Constantiam", address: "constantiam.net", description: "Анархия с сообществом, мягче чем 2b2t.", category: "anarchy", version: "1.21", website: "constantiam.net", players: "300+", tags: ["анархия"] },
  { id: "14", name: "OPBlocks", address: "play.opblocks.com", description: "Скайблок и пыточные с уникальными механиками.", category: "survival", version: "1.8+", website: "opblocks.com", players: "1k+", tags: ["skyblock"] },
  { id: "15", name: "Complex Gaming", address: "hub.mc-complex.com", description: "Мульти-сервер: Pixelmon, Skyblock, Survival, Prison.", category: "minigames", version: "1.8 - 1.21", website: "mc-complex.com", players: "2k+", tags: ["pixelmon"] },
  { id: "16", name: "Pixelmon Harmony", address: "play.pixelmonharmony.com", description: "Лучший Pixelmon-сервер с раз в неделю турнирами.", category: "rpg", version: "1.16", website: "pixelmonharmony.com", players: "500+", tags: ["pixelmon"] },
  { id: "17", name: "Galaxite", address: "play.galaxite.net", description: "Bedrock мини-игры от бывших разработчиков Mineplex.", category: "minigames", version: "Bedrock", website: "galaxite.net", players: "3k+", tags: ["bedrock"] },
  { id: "18", name: "AppleMC", address: "applemc.fun", description: "Русскоязычный сервер: Bedwars, SkyWars, OneBlock, EggWars.", category: "minigames", version: "1.8 - 1.21", website: "applemc.fun", players: "2k+", tags: ["ru", "bedwars"] },
  { id: "19", name: "ReallyWorld", address: "play.reallyworld.ru", description: "Русский survival с экономикой, кланами и арендой территорий.", category: "survival", version: "1.20", website: "reallyworld.ru", players: "500+", tags: ["ru"] },
  { id: "20", name: "FunnyMC", address: "play.funnymc.ru", description: "Российский мини-игровой сервер с Bedwars и SkyPvP.", category: "minigames", version: "1.8 - 1.21", website: "funnymc.ru", players: "1k+", tags: ["ru"] },
  { id: "21", name: "MineBlaze", address: "play.mineblaze.net", description: "SkyBlock и SMP сервер с экономикой и аукционом.", category: "survival", version: "1.21", website: "mineblaze.net", players: "300+", tags: ["skyblock"] },
  { id: "22", name: "Purple Prison", address: "purpleprison.org", description: "Самый длинный prison-сервер с уникальными рангами.", category: "tech", version: "1.8+", website: "purpleprison.org", players: "200+", tags: ["prison"] },
  { id: "23", name: "TulipSurvival", address: "tulipsurvival.com", description: "Ванильный SMP с экономикой и без гриферства.", category: "survival", version: "1.21", website: "tulipsurvival.com", players: "150+", tags: ["smp"] },
  { id: "24", name: "Earth MC", address: "play.earthmc.net", description: "Towny-сервер с картой реальной Земли в масштабе 1:3000.", category: "smp", version: "1.21", website: "earthmc.net", players: "500+", tags: ["towny", "earth"] },
];

export const SERVER_CATEGORIES = [
  { id: "all", label: "Все" },
  { id: "minigames", label: "Мини-игры" },
  { id: "survival", label: "Выживание" },
  { id: "smp", label: "SMP" },
  { id: "anarchy", label: "Анархия" },
  { id: "rpg", label: "RPG" },
  { id: "creative", label: "Креатив" },
  { id: "tech", label: "Прочее" },
] as const;

// Use Google's S2 favicon service — very high availability
export const serverIconUrl = (website: string, size = 128) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(website)}&sz=${size}`;
