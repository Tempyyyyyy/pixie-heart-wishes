import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/launcher/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Download, Heart, FileBox } from "lucide-react";
import { searchMods, type ModrinthHit, CATEGORY_PRESETS } from "@/lib/modrinth";
import { ModDetailDialog } from "@/components/launcher/ModDetailDialog";
import { cn } from "@/lib/utils";

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "visual", label: "Визуал" },
  { key: "shaders", label: "Шейдеры" },
  { key: "resourcepacks", label: "Текстуры" },
  { key: "ui", label: "Интерфейс" },
  { key: "server", label: "Для сервера" },
  { key: "performance", label: "Производительность" },
  { key: "adventure", label: "Приключения" },
  { key: "magic", label: "Магия" },
  { key: "tech", label: "Техно" },
];

const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);

const Library = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);
  const [category, setCategory] = useState<string>("all");
  const [loader, setLoader] = useState<string | null>(null);
  const [hits, setHits] = useState<ModrinthHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ModrinthHit | null>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (initialQ) setSearchParams({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchMods({ query: debounced, category, loader: loader ?? undefined, limit: 30 })
      .then((data) => { if (!cancelled) setHits(data.hits); })
      .catch(() => { if (!cancelled) setHits([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, category, loader]);

  return (
    <Layout>
      <header className="mb-6 animate-fade-in">
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Каталог Modrinth</h1>
        <p className="text-muted-foreground">Тысячи модов, шейдеров и ресурспаков. Скачивай прямо в браузер.</p>
      </header>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найди мод: Sodium, Iris, JEI…"
          className="h-12 pl-11 rounded-xl bg-secondary/60 border-border"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={cn(
              "px-4 h-9 rounded-full text-xs font-semibold border transition-all",
              category === c.key
                ? "bg-primary text-primary-foreground border-primary shadow-[0_4px_16px_hsl(var(--primary)/0.4)]"
                : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <span className="text-xs text-muted-foreground self-center mr-1">Лоадер:</span>
        {[null, "fabric", "forge", "neoforge", "quilt"].map(l => (
          <button
            key={l ?? "any"}
            onClick={() => setLoader(l)}
            className={cn(
              "px-3 h-7 rounded-md text-[11px] font-semibold border transition-all uppercase tracking-wide",
              loader === l
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-transparent border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {l ?? "Любой"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && hits.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          Ничего не найдено. Попробуй изменить запрос.
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

      <ModDetailDialog mod={selected} onOpenChange={(v) => !v && setSelected(null)} />
    </Layout>
  );
};

export default Library;
