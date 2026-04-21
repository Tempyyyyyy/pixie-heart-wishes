// Curated list of well-known public Minecraft servers. Icons via Google's
// favicon service so we always get something rather than a broken link.

export type ServerEntry = {
  id: string;
  name: string;
  address: string;
  description: string;
  category: "survival" | "minigames" | "anarchy" | "smp" | "creative" | "rpg" | "tech" | "pvp" | "skyblock" | "prison";
  version: string;
  website: string;
  players?: string;
  tags: string[];
};

export const SERVERS: ServerEntry[] = [
  // === MEGA-popular ===
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
  { id: "14", name: "OPBlocks", address: "play.opblocks.com", description: "Скайблок и пыточные с уникальными механиками.", category: "skyblock", version: "1.8+", website: "opblocks.com", players: "1k+", tags: ["skyblock"] },
  { id: "15", name: "Complex Gaming", address: "hub.mc-complex.com", description: "Мульти-сервер: Pixelmon, Skyblock, Survival, Prison.", category: "minigames", version: "1.8 - 1.21", website: "mc-complex.com", players: "2k+", tags: ["pixelmon"] },
  { id: "16", name: "Pixelmon Harmony", address: "play.pixelmonharmony.com", description: "Лучший Pixelmon-сервер с турнирами раз в неделю.", category: "rpg", version: "1.16", website: "pixelmonharmony.com", players: "500+", tags: ["pixelmon"] },
  { id: "17", name: "Galaxite", address: "play.galaxite.net", description: "Bedrock мини-игры от бывших разработчиков Mineplex.", category: "minigames", version: "Bedrock", website: "galaxite.net", players: "3k+", tags: ["bedrock"] },
  { id: "18", name: "AppleMC", address: "applemc.fun", description: "Русскоязычный сервер: Bedwars, SkyWars, OneBlock, EggWars.", category: "minigames", version: "1.8 - 1.21", website: "applemc.fun", players: "2k+", tags: ["ru", "bedwars"] },
  { id: "19", name: "ReallyWorld", address: "play.reallyworld.ru", description: "Русский survival с экономикой, кланами и арендой территорий.", category: "survival", version: "1.20", website: "reallyworld.ru", players: "500+", tags: ["ru"] },
  { id: "20", name: "FunnyMC", address: "play.funnymc.ru", description: "Российский мини-игровой сервер с Bedwars и SkyPvP.", category: "minigames", version: "1.8 - 1.21", website: "funnymc.ru", players: "1k+", tags: ["ru"] },

  // === Survival / SMP ===
  { id: "21", name: "MineBlaze", address: "play.mineblaze.net", description: "SkyBlock и SMP сервер с экономикой и аукционом.", category: "skyblock", version: "1.21", website: "mineblaze.net", players: "300+", tags: ["skyblock"] },
  { id: "22", name: "Purple Prison", address: "purpleprison.org", description: "Самый длинный prison-сервер с уникальными рангами.", category: "prison", version: "1.8+", website: "purpleprison.org", players: "200+", tags: ["prison"] },
  { id: "23", name: "TulipSurvival", address: "tulipsurvival.com", description: "Ванильный SMP с экономикой и без гриферства.", category: "survival", version: "1.21", website: "tulipsurvival.com", players: "150+", tags: ["smp"] },
  { id: "24", name: "Earth MC", address: "play.earthmc.net", description: "Towny-сервер с картой реальной Земли в масштабе 1:3000.", category: "smp", version: "1.21", website: "earthmc.net", players: "500+", tags: ["towny", "earth"] },
  { id: "25", name: "MineHeroes", address: "play.mineheroes.net", description: "Skyblock, Factions, Prison с агрессивной экономикой.", category: "survival", version: "1.8+", website: "mineheroes.net", players: "400+", tags: ["factions"] },
  { id: "26", name: "Datblock", address: "play.datblock.com", description: "Скайблок с уникальными квестами и постоянными ивентами.", category: "skyblock", version: "1.21", website: "datblock.com", players: "200+", tags: ["skyblock"] },
  { id: "27", name: "Snapcraft", address: "play.snapcraft.net", description: "Survival с парком развлечений и большим хабом.", category: "survival", version: "1.20", website: "snapcraft.net", players: "300+", tags: ["survival"] },
  { id: "28", name: "PvPWars", address: "play.pvpwars.net", description: "Factions и KitPvP, 24/7 война гильдий.", category: "pvp", version: "1.8+", website: "pvpwars.net", players: "200+", tags: ["pvp", "factions"] },
  { id: "29", name: "Vortex Network", address: "play.vortexnetwork.net", description: "Skyblock и Prison с активным комьюнити Северной Америки.", category: "skyblock", version: "1.8+", website: "vortexnetwork.net", players: "300+", tags: ["skyblock"] },
  { id: "30", name: "JartexNetwork", address: "jartexnetwork.com", description: "Practice PvP, Bedwars и Skywars европейский сервер.", category: "pvp", version: "1.8+", website: "jartexnetwork.com", players: "1k+", tags: ["practice", "pvp"] },

  // === Russian / CIS ===
  { id: "31", name: "MasterMine", address: "play.mastermine.ru", description: "Большой русский survival с Bedwars и креативом.", category: "minigames", version: "1.8 - 1.20", website: "mastermine.ru", players: "1k+", tags: ["ru"] },
  { id: "32", name: "MineLand", address: "play.mineland.net", description: "Топ российский сервер: BedWars, FFA, Speed Builders, Skyblock.", category: "minigames", version: "1.8 - 1.21", website: "mineland.net", players: "5k+", tags: ["ru", "bedwars"] },
  { id: "33", name: "MineSuper", address: "play.minesuper.ru", description: "Российский игровой проект с десятками миров.", category: "minigames", version: "1.8 - 1.21", website: "minesuper.ru", players: "800+", tags: ["ru"] },
  { id: "34", name: "MineLaB", address: "minelab.fun", description: "Уютный русский survival с экономикой и кланами.", category: "survival", version: "1.20", website: "minelab.fun", players: "200+", tags: ["ru", "survival"] },
  { id: "35", name: "Hi-Tech Mine", address: "hi-tech.mine.fun", description: "Технический survival с большим количеством плагинов.", category: "tech", version: "1.20", website: "hi-tech.fun", players: "300+", tags: ["ru", "tech"] },
  { id: "36", name: "RimMC", address: "rimmc.ru", description: "Российский mini-games сервер с Bedwars и SkyWars.", category: "minigames", version: "1.8+", website: "rimmc.ru", players: "500+", tags: ["ru"] },
  { id: "37", name: "Holyworld", address: "play.holyworld.ru", description: "Российский игровой проект, BedWars + Survival.", category: "minigames", version: "1.8+", website: "holyworld.ru", players: "1k+", tags: ["ru"] },
  { id: "38", name: "MineBlaze RU", address: "ru.mineblaze.net", description: "Русский Skyblock с системой питомцев и квестами.", category: "skyblock", version: "1.20", website: "mineblaze.ru", players: "300+", tags: ["ru", "skyblock"] },

  // === Modded / Tech ===
  { id: "39", name: "DimensionalDoors", address: "play.dimensional.zone", description: "Modded SMP с All The Mods 9.", category: "tech", version: "1.20.1", website: "dimensional.zone", players: "150+", tags: ["modded", "atm9"] },
  { id: "40", name: "Cubed Realms", address: "play.cubedrealms.net", description: "Modded SMP сервер с большой техно-сборкой.", category: "tech", version: "1.20", website: "cubedrealms.net", players: "100+", tags: ["modded"] },
  { id: "41", name: "Volcano Block", address: "vb.volcanoblock.net", description: "Skyblock на ATM Volcano Block.", category: "tech", version: "1.18", website: "volcanoblock.net", players: "80+", tags: ["modded", "skyblock"] },

  // === Creative / Building ===
  { id: "42", name: "BuildersRefuge", address: "play.buildersrefuge.com", description: "Только для строителей: WorldEdit, плагины и галерея.", category: "creative", version: "1.21", website: "buildersrefuge.com", players: "100+", tags: ["build"] },
  { id: "43", name: "MCC Island", address: "play.mccisland.net", description: "Сервер от создателей Minecraft Championship.", category: "minigames", version: "Bedrock+Java", website: "mccisland.net", players: "2k+", tags: ["mcc", "minigames"] },

  // === Adventure / RPG ===
  { id: "44", name: "Hyperium", address: "play.hyperium.gg", description: "RPG-сервер с кастомными классами и подземельями.", category: "rpg", version: "1.20", website: "hyperium.gg", players: "200+", tags: ["rpg"] },
  { id: "45", name: "Loka", address: "loka.com", description: "Civilization-style сервер с городами и войнами.", category: "smp", version: "1.21", website: "loka.com", players: "300+", tags: ["civ"] },
  { id: "46", name: "Empire Minecraft", address: "play.emc.gs", description: "Олдскульный survival с дружелюбным сообществом с 2012 года.", category: "survival", version: "1.21", website: "emc.gs", players: "150+", tags: ["smp"] },

  // === International ===
  { id: "47", name: "Hylex Network", address: "play.hylex.net", description: "Французский мини-игровой сервер.", category: "minigames", version: "1.8+", website: "hylex.net", players: "500+", tags: ["fr"] },
  { id: "48", name: "GommeHD", address: "gommehd.net", description: "Немецкий PvP и мини-игровой сервер.", category: "pvp", version: "1.8+", website: "gommehd.net", players: "1k+", tags: ["de", "pvp"] },
  { id: "49", name: "Universocraft", address: "mc.universocraft.com", description: "Латиноамериканский мини-игровой сервер.", category: "minigames", version: "1.8+", website: "universocraft.com", players: "2k+", tags: ["es"] },
  { id: "50", name: "MultiPlay", address: "play.multiplay.com.tr", description: "Турецкий PvP и SkyWars.", category: "pvp", version: "1.8+", website: "multiplay.com.tr", players: "500+", tags: ["tr"] },
  { id: "51", name: "MewMc", address: "play.mewmc.cn", description: "Китайский Skyblock и Survival.", category: "skyblock", version: "1.20", website: "mewmc.cn", players: "1k+", tags: ["cn"] },

  // === More Survival / Niche ===
  { id: "52", name: "Vanilla Europa", address: "vanillaeuropa.com", description: "Европейский ванильный сервер 18+.", category: "survival", version: "1.21", website: "vanillaeuropa.com", players: "100+", tags: ["vanilla", "18+"] },
  { id: "53", name: "Civ Wars", address: "civwars.com", description: "Хардкорный civ-сервер с физикой и реалистичной экономикой.", category: "smp", version: "1.21", website: "civwars.com", players: "200+", tags: ["civ"] },
  { id: "54", name: "ImperialMC", address: "play.imperialmc.com", description: "Skyblock и Towny с агрессивной экономикой.", category: "smp", version: "1.20", website: "imperialmc.com", players: "150+", tags: ["towny"] },
  { id: "55", name: "ExtremeCraft", address: "play.extremecraft.net", description: "Cracked мини-игровой сервер с Bedwars и SkyWars.", category: "minigames", version: "1.8+", website: "extremecraft.net", players: "1k+", tags: ["cracked"] },
  { id: "56", name: "VeltPvP", address: "veltpvp.com", description: "HCF и Practice PvP, элита PvP-сцены.", category: "pvp", version: "1.7+", website: "veltpvp.com", players: "500+", tags: ["hcf", "practice"] },
  { id: "57", name: "Archon", address: "play.archonhq.net", description: "Factions, Skyblock, Prison с большой экономикой.", category: "pvp", version: "1.8+", website: "archonhq.net", players: "300+", tags: ["factions"] },
  { id: "58", name: "Cosmic Network", address: "play.cosmicpvp.com", description: "OP Factions и OP Skyblock, экстремальная экономика.", category: "pvp", version: "1.8+", website: "cosmicpvp.com", players: "500+", tags: ["factions"] },
  { id: "59", name: "Arkham Network", address: "play.arkhamnetwork.org", description: "Faction PvP сервер для хардкорщиков.", category: "pvp", version: "1.7+", website: "arkhamnetwork.org", players: "200+", tags: ["pvp"] },
  { id: "60", name: "MunchyMC", address: "play.munchymc.com", description: "Cops & Crims, Hide & Seek, мини-игры.", category: "minigames", version: "1.8+", website: "munchymc.com", players: "300+", tags: ["minigames"] },
  { id: "61", name: "Lemon Cloud", address: "lemoncloud.net", description: "Французский SMP с экономикой.", category: "smp", version: "1.20", website: "lemoncloud.net", players: "200+", tags: ["fr", "smp"] },
  { id: "62", name: "Skykingdoms", address: "play.skykingdoms.net", description: "Skyblock с уникальной системой королевств.", category: "skyblock", version: "1.20", website: "skykingdoms.net", players: "400+", tags: ["skyblock"] },
  { id: "63", name: "OneBlockMC", address: "play.oneblockmc.com", description: "OneBlock с прокачкой и экономикой.", category: "skyblock", version: "1.20", website: "oneblockmc.com", players: "500+", tags: ["oneblock"] },
  { id: "64", name: "OldHaven", address: "play.oldhaven.network", description: "Олдскульный survival с экономикой.", category: "survival", version: "1.20", website: "oldhaven.network", players: "100+", tags: ["smp"] },
];

export const SERVER_CATEGORIES = [
  { id: "all", label: "Все" },
  { id: "minigames", label: "Мини-игры" },
  { id: "survival", label: "Выживание" },
  { id: "smp", label: "SMP" },
  { id: "skyblock", label: "Skyblock" },
  { id: "pvp", label: "PvP" },
  { id: "anarchy", label: "Анархия" },
  { id: "rpg", label: "RPG" },
  { id: "creative", label: "Креатив" },
  { id: "prison", label: "Prison" },
  { id: "tech", label: "Modded" },
] as const;

// Use Google's S2 favicon service — very high availability
export const serverIconUrl = (website: string, size = 128) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(website)}&sz=${size}`;
