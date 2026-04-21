import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const MODRINTH_PROXY = `${SUPABASE_URL}/functions/v1/modrinth`;

export type ModrinthHit = {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  categories: string[];
  display_categories?: string[];
  client_side: string;
  server_side: string;
  project_type: string;
  downloads: number;
  follows: number;
  icon_url: string | null;
  author: string;
  versions: string[];
  latest_version?: string;
  license?: string;
};

export type ModrinthProject = ModrinthHit & {
  body: string;
  source_url?: string | null;
  issues_url?: string | null;
  wiki_url?: string | null;
  discord_url?: string | null;
  game_versions: string[];
  loaders: string[];
};

export type ModrinthFile = {
  url: string;
  filename: string;
  primary: boolean;
  size: number;
};

export type ModrinthVersion = {
  id: string;
  project_id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  date_published: string;
  downloads: number;
  files: ModrinthFile[];
  changelog?: string;
  version_type: "release" | "beta" | "alpha";
};

const cache = new Map<string, { ts: number; data: unknown }>();
const TTL = 1000 * 60 * 5;

async function get<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached && Date.now() - cached.ts < TTL) return cached.data as T;

  const res = await fetch(`${MODRINTH_PROXY}/${path}`);
  if (!res.ok) throw new Error(`Modrinth ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as T;
  cache.set(path, { ts: Date.now(), data });
  return data;
}

// Map our UI categories to Modrinth facets.
type FacetGroup = readonly string[];
type Preset = { label: string; facets: readonly FacetGroup[] };

export const CATEGORY_PRESETS: Record<string, Preset> = {
  all: { label: "Все", facets: [] },
  visual: {
    label: "Визуал",
    facets: [["categories:'optimization'", "categories:'utility'"], ["project_type:shader"]],
  },
  shaders: { label: "Шейдеры", facets: [["project_type:shader"]] },
  resourcepacks: { label: "Текстур-паки", facets: [["project_type:resourcepack"]] },
  ui: { label: "Интерфейс", facets: [["categories:'utility'", "categories:'cursed'"]] },
  server: { label: "Для сервера", facets: [["server_side:required", "server_side:optional"]] },
  performance: { label: "Производительность", facets: [["categories:'optimization'"]] },
  adventure: { label: "Приключения", facets: [["categories:'adventure'"]] },
  magic: { label: "Магия", facets: [["categories:'magic'"]] },
  tech: { label: "Техно", facets: [["categories:'technology'"]] },
};

export type CategoryKey = string;

export async function searchMods(opts: {
  query?: string;
  category?: CategoryKey;
  loader?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (opts.query) params.set("query", opts.query);
  params.set("limit", String(opts.limit ?? 20));
  params.set("offset", String(opts.offset ?? 0));
  params.set("index", "relevance");

  const facets: string[][] = [];
  if (opts.category && opts.category !== "all") {
    for (const group of CATEGORY_PRESETS[opts.category].facets) {
      facets.push([...group]);
    }
  }
  if (opts.loader) facets.push([`categories:'${opts.loader}'`]);
  // Always include actual mods/shaders/resourcepacks
  if (!facets.some(g => g.some(f => f.startsWith("project_type:")))) {
    facets.push(["project_type:mod", "project_type:resourcepack", "project_type:shader"]);
  }
  if (facets.length) params.set("facets", JSON.stringify(facets));

  const data = await get<{ hits: ModrinthHit[]; total_hits: number }>(`search?${params}`);
  return data;
}

export async function getProject(idOrSlug: string) {
  return get<ModrinthProject>(`project/${idOrSlug}`);
}

export async function getProjectVersions(idOrSlug: string) {
  return get<ModrinthVersion[]>(`project/${idOrSlug}/version`);
}

export function modrinthUrl(slug: string) {
  return `https://modrinth.com/mod/${slug}`;
}

// Direct download — uses the proxy so the browser does not need CORS on cdn.modrinth.com
export function downloadFile(file: ModrinthFile) {
  const a = document.createElement("a");
  a.href = file.url;
  a.download = file.filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
