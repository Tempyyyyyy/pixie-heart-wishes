import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Download, Heart, FileBox, ChevronLeft, ChevronRight } from "lucide-react";
import {
  searchProjects,
  type ModrinthHit,
  type ProjectType,
  type SortIndex,
  LOADERS_BY_TYPE,
  COMMON_GAME_VERSIONS,
} from "@/lib/modrinth";
import { ModDetailDialog } from "@/components/launcher/ModDetailDialog";
import { cn } from "@/lib/utils";

const formatNumber = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
  : String(n);

const SORTS: { key: SortIndex; label: string }[] = [
  { key: "relevance", label: "Релевантность" },
  { key: "downloads", label: "Скачивания" },
  { key: "follows", label: "Подписки" },
  { key: "newest", label: "Новые" },
  { key: "updated", label: "Обновлённые" },
];

const PER_PAGE = 24;

type Props = {
  projectType: ProjectType;
  title: string;
  subtitle: string;
  initialQuery?: string;
};

export const ModrinthBrowser = ({ projectType, title, subtitle, initialQuery = "" }: Props) => {
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [loader, setLoader] = useState<string | null>(null);
  const [gameVersion, setGameVersion] = useState<string | null>(null);
  const [sort, setSort] = useState<SortIndex>("relevance");
  const [page, setPage] = useState(0);
  const [hits, setHits] = useState<ModrinthHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ModrinthHit | null>(null);

  // Reset on type change
  useEffect(() => {
    setLoader(null);
    setGameVersion(null);
    setPage(0);
  }, [projectType]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(query); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [loader, gameVersion, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchProjects({
      query: debounced,
      projectType,
      loader: loader ?? undefined,
      gameVersion: gameVersion ?? undefined,
      sort,
      limit: PER_PAGE,
      offset: page * PER_PAGE,
    })
      .then((data) => {
        if (cancelled) return;
        setHits(data.hits);
        setTotal(data.total_hits);
      })
      .catch(() => { if (!cancelled) { setHits([]); setTotal(0); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, projectType, loader, gameVersion, sort, page]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const loaders = LOADERS_BY_TYPE[projectType];

  return (
    <>
      <header className="mb-6 animate-fade-in">
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </header>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию или ключевому слову…"
          className="h-12 pl-11 rounded-xl bg-secondary/60 border-border"
        />
      </div>

      {/* Sort + filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground mr-1">Сортировка:</span>
        {SORTS.map(s => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={cn(
              "px-3 h-8 rounded-full text-xs font-semibold border transition-all",
              sort === s.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loaders.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs text-muted-foreground self-center mr-1">Лоадер:</span>
          <FilterPill active={loader === null} onClick={() => setLoader(null)}>Любой</FilterPill>
          {loaders.map(l => (
            <FilterPill key={l} active={loader === l} onClick={() => setLoader(l)}>
              {l}
            </FilterPill>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs text-muted-foreground self-center mr-1">Версия:</span>
        <FilterPill active={gameVersion === null} onClick={() => setGameVersion(null)}>Любая</FilterPill>
        {COMMON_GAME_VERSIONS.map(v => (
          <FilterPill key={v} active={gameVersion === v} onClick={() => setGameVersion(v)}>
            {v}
          </FilterPill>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && hits.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          Ничего не найдено. Измени фильтры или запрос.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
        {hits.map(mod => (
          <button
            key={mod.project_id}
            onClick={() => setSelected(mod)}
            className="group text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:-translate-y-1 transition-all"
          >
            <div className="flex gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
                {mod.icon_url
                  ? <img src={mod.icon_url} alt={mod.title} className="w-full h-full object-cover" loading="lazy" />
                  : <FileBox className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-base truncate group-hover:text-primary transition-colors">{mod.title}</div>
                <div className="text-xs text-muted-foreground truncate">{mod.author}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">{mod.description}</p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Download className="w-3 h-3" />{formatNumber(mod.downloads)}</span>
              <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(mod.follows)}</span>
              <Badge variant="secondary" className="text-[10px]">{mod.project_type}</Badge>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination */}
      {!loading && total > PER_PAGE && (
        <div className="flex items-center justify-between gap-3 pb-8 pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Найдено: <span className="text-foreground font-semibold">{total.toLocaleString("ru")}</span>
            {" · "}
            Страница <span className="text-foreground font-semibold">{page + 1}</span> из {totalPages.toLocaleString("ru")}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(0)}>« 1</Button>
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
              <ChevronLeft className="w-4 h-4" /> Назад
            </Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
              Далее <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(totalPages - 1)}>
              {totalPages.toLocaleString("ru")} »
            </Button>
          </div>
        </div>
      )}

      <ModDetailDialog mod={selected} onOpenChange={(v) => !v && setSelected(null)} />
    </>
  );
};

const FilterPill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 h-7 rounded-md text-[11px] font-semibold border transition-all uppercase tracking-wide",
      active
        ? "bg-primary/20 text-primary border-primary/40"
        : "bg-transparent border-border text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);
