import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const MODRINTH_PROXY = `${SUPABASE_URL}/functions/v1/modrinth`;

export type ProjectType = "mod" | "modpack" | "resourcepack" | "shader" | "plugin" | "datapack";

export type ModrinthHit = {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  categories: string[];
  display_categories?: string[];
  client_side: string;
  server_side: string;
  project_type: ProjectType;
  downloads: number;
  follows: number;
  icon_url: string | null;
  author: string;
  versions: string[];
  latest_version?: string;
  license?: string;
  gallery?: string[];
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

export type SortIndex = "relevance" | "downloads" | "follows" | "newest" | "updated";

export async function searchProjects(opts: {
  query?: string;
  projectType: ProjectType;
  loader?: string;
  gameVersion?: string;
  category?: string;
  sort?: SortIndex;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (opts.query) params.set("query", opts.query);
  params.set("limit", String(opts.limit ?? 20));
  params.set("offset", String(opts.offset ?? 0));
  params.set("index", opts.sort ?? "relevance");

  const facets: string[][] = [[`project_type:${opts.projectType}`]];
  if (opts.loader) facets.push([`categories:'${opts.loader}'`]);
  if (opts.gameVersion) facets.push([`versions:${opts.gameVersion}`]);
  if (opts.category) facets.push([`categories:'${opts.category}'`]);
  params.set("facets", JSON.stringify(facets));

  return get<{ hits: ModrinthHit[]; total_hits: number; offset: number; limit: number }>(`search?${params}`);
}

export async function getProject(idOrSlug: string) {
  return get<ModrinthProject>(`project/${idOrSlug}`);
}

export async function getProjectVersions(idOrSlug: string) {
  return get<ModrinthVersion[]>(`project/${idOrSlug}/version`);
}

export function modrinthUrl(slug: string, projectType: ProjectType = "mod") {
  const seg = projectType === "modpack" ? "modpack"
    : projectType === "resourcepack" ? "resourcepack"
    : projectType === "shader" ? "shader"
    : projectType === "plugin" ? "plugin"
    : projectType === "datapack" ? "datapack"
    : "mod";
  return `https://modrinth.com/${seg}/${slug}`;
}

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

// Common loaders per project type for filter UI
export const LOADERS_BY_TYPE: Record<ProjectType, string[]> = {
  mod: ["fabric", "forge", "neoforge", "quilt"],
  modpack: ["fabric", "forge", "neoforge", "quilt"],
  plugin: ["bukkit", "spigot", "paper", "purpur", "folia", "velocity", "bungeecord"],
  resourcepack: ["minecraft"],
  shader: ["iris", "optifine", "vanilla"],
  datapack: ["datapack"],
};

export const COMMON_GAME_VERSIONS = [
  "1.21.4", "1.21.1", "1.21", "1.20.6", "1.20.4", "1.20.1", "1.19.4", "1.19.2", "1.18.2", "1.16.5", "1.12.2", "1.8.9",
];

// Backwards-compat helper used by older callers (Profile, Instances picker).
// Just searches mods only.
export async function searchMods(opts: {
  query?: string;
  loader?: string;
  limit?: number;
  offset?: number;
}) {
  return searchProjects({
    query: opts.query,
    projectType: "mod",
    loader: opts.loader,
    limit: opts.limit,
    offset: opts.offset,
  });
}
