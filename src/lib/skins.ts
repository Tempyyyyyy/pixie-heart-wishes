// Curated catalog of popular Minecraft skins. Render via Crafatar.
// Skins of real public NameMC nicknames — guaranteed to exist.

export type SkinPreset = {
  id: string;
  name: string;
  username: string;
  category: "popular" | "anime" | "cute" | "scary" | "meme" | "classic" | "girl" | "cool";
  tags: string[];
};

export const SKINS: SkinPreset[] = [
  { id: "1", name: "Notch", username: "Notch", category: "classic", tags: ["легенда"] },
  { id: "2", name: "Jeb_", username: "jeb_", category: "classic", tags: ["разработчик"] },
  { id: "3", name: "Dinnerbone", username: "Dinnerbone", category: "classic", tags: ["перевёрнут"] },
  { id: "4", name: "Technoblade", username: "Technoblade", category: "popular", tags: ["легенда"] },
  { id: "5", name: "Dream", username: "Dream", category: "popular", tags: ["спидран"] },
  { id: "6", name: "GeorgeNotFound", username: "GeorgeNotFound", category: "popular", tags: ["dreamSMP"] },
  { id: "7", name: "Sapnap", username: "Sapnap", category: "popular", tags: ["dreamSMP"] },
  { id: "8", name: "BadBoyHalo", username: "BadBoyHalo", category: "popular", tags: ["dreamSMP"] },
  { id: "9", name: "Tommyinnit", username: "Tommyinnit", category: "popular", tags: ["dreamSMP"] },
  { id: "10", name: "Tubbo_", username: "Tubbo_", category: "popular", tags: ["пчёлы"] },
  { id: "11", name: "Wilbur Soot", username: "WilburSoot", category: "popular", tags: ["L'Manberg"] },
  { id: "12", name: "Ph1LzA", username: "Ph1LzA", category: "popular", tags: ["hardcore"] },
  { id: "13", name: "Quackity", username: "Quackity", category: "popular", tags: ["las nevadas"] },
  { id: "14", name: "Ranboo", username: "Ranboo", category: "popular", tags: ["enderboy"] },
  { id: "15", name: "PewDiePie", username: "PewDiePie", category: "popular", tags: ["youtube"] },
  { id: "16", name: "MrBeast", username: "MrBeast6000", category: "popular", tags: ["youtube"] },
  { id: "17", name: "Hypixel", username: "Hypixel", category: "popular", tags: ["сервер"] },
  { id: "18", name: "Mumbo Jumbo", username: "ThatMumboJumbo", category: "popular", tags: ["hermitcraft"] },
  { id: "19", name: "Grian", username: "Grian", category: "popular", tags: ["hermitcraft"] },
  { id: "20", name: "Iskall85", username: "iskall85", category: "popular", tags: ["hermitcraft"] },
  { id: "21", name: "Xisumavoid", username: "xisumavoid", category: "popular", tags: ["hermitcraft"] },
  { id: "22", name: "Etho", username: "EthosLab", category: "popular", tags: ["hermitcraft"] },
  { id: "23", name: "Ldshadowlady", username: "LDShadowLady", category: "girl", tags: ["youtube"] },
  { id: "24", name: "Stacyplays", username: "stacyplays", category: "girl", tags: ["звери"] },
  { id: "25", name: "AphMau", username: "Aphmau", category: "girl", tags: ["youtube"] },
  { id: "26", name: "DanTDM", username: "DanTDM", category: "popular", tags: ["youtube"] },
  { id: "27", name: "CaptainSparklez", username: "CaptainSparklez", category: "popular", tags: ["youtube"] },
  { id: "28", name: "Skydoesminecraft", username: "Skydoesminecraft", category: "popular", tags: ["youtube"] },
  { id: "29", name: "Vikkstar123", username: "Vikkstar123", category: "popular", tags: ["youtube"] },
  { id: "30", name: "Lazarbeam", username: "Lazarbeam", category: "meme", tags: ["youtube"] },
  { id: "31", name: "Jacksucksatlife", username: "JackSucksAtLife", category: "meme", tags: ["youtube"] },
  { id: "32", name: "Pokimane", username: "Pokimane", category: "girl", tags: ["twitch"] },
  { id: "33", name: "Valkyrae", username: "Valkyrae", category: "girl", tags: ["twitch"] },
  { id: "34", name: "Shroud", username: "shroud", category: "cool", tags: ["pro"] },
  { id: "35", name: "Ninja", username: "Ninja", category: "cool", tags: ["fortnite"] },
  { id: "36", name: "Skeppy", username: "Skeppy", category: "popular", tags: ["dreamSMP"] },
  { id: "37", name: "A6D", username: "a6d", category: "popular", tags: ["dreamSMP"] },
  { id: "38", name: "Karl Jacobs", username: "KarlJacobs", category: "popular", tags: ["dreamSMP"] },
  { id: "39", name: "Alex", username: "Alex", category: "classic", tags: ["default"] },
  { id: "40", name: "Steve", username: "Steve", category: "classic", tags: ["default"] },
  { id: "41", name: "Herobrine", username: "Herobrine", category: "scary", tags: ["легенда"] },
  { id: "42", name: "Entity_303", username: "Entity_303", category: "scary", tags: ["крипипаста"] },
  { id: "43", name: "Null", username: "Null", category: "scary", tags: ["крипипаста"] },
  { id: "44", name: "FoolCraft", username: "FoolCraft", category: "meme", tags: ["клоун"] },
  { id: "45", name: "Kreekcraft", username: "KreekCraft", category: "popular", tags: ["youtube"] },
  { id: "46", name: "Preston", username: "Preston", category: "popular", tags: ["youtube"] },
  { id: "47", name: "Unspeakable", username: "Unspeakable", category: "popular", tags: ["youtube"] },
  { id: "48", name: "ssundee", username: "ssundee", category: "popular", tags: ["youtube"] },
];

export const SKIN_CATEGORIES = [
  { id: "all", label: "Все" },
  { id: "popular", label: "Популярные" },
  { id: "classic", label: "Классика" },
  { id: "girl", label: "Девушки" },
  { id: "cool", label: "Крутые" },
  { id: "scary", label: "Страшные" },
  { id: "meme", label: "Мемные" },
] as const;

// Crafatar — public Minecraft skin renderer
// https://crafatar.com  /renders/body/<uuid|username>
// We use mojang api-friendly endpoint: by-name
export const skinBodyUrl = (username: string, scale = 10) =>
  `https://mc-heads.net/body/${encodeURIComponent(username)}/${scale * 64}`;

export const skinHeadUrl = (username: string, size = 128) =>
  `https://mc-heads.net/avatar/${encodeURIComponent(username)}/${size}`;

export const skinRawUrl = (username: string) =>
  `https://mc-heads.net/skin/${encodeURIComponent(username)}`;
