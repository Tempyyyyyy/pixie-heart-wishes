import { useEffect, useState } from "react";
import { Play, Flame, TrendingUp, Package, Users, ArrowRight, Sparkles, Box, Loader2, Download, Newspaper, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/launcher/Layout";
import { ModDetailDialog } from "@/components/launcher/ModDetailDialog";
import { searchProjects, type ModrinthHit } from "@/lib/modrinth";
import heroBg from "@/assets/hero-bg.jpg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type NewsItem = {
  title: string;
  link: string;
  description: string;
  image: string | null;
  pubDate: string;
  source: string;
};

const stats = [
  { icon: TrendingUp, value: "1 247", label: "Часов в игре" },
  { icon: Package, value: "84", label: "Установлено модов" },
  { icon: Users, value: "12", label: "Друзей онлайн" },
];

const formatNumber = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
  : String(n);

const Index = () => {
  const [popularPacks, setPopularPacks] = useState<ModrinthHit[]>([]);
  const [popularMods, setPopularMods] = useState<ModrinthHit[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [selected, setSelected] = useState<ModrinthHit | null>(null);

  useEffect(() => {
    Promise.all([
      searchProjects({ projectType: "modpack", sort: "downloads", limit: 4 }),
      searchProjects({ projectType: "mod", sort: "downloads", limit: 6 }),
    ])
      .then(([packs, mods]) => {
        setPopularPacks(packs.hits);
        setPopularMods(mods.hits);
      })
      .catch(() => {})
      .finally(() => setLoadingPacks(false));

    fetch(`${SUPABASE_URL}/functions/v1/news`)
      .then(r => r.json())
      .then(d => setNews((d.items ?? []).slice(0, 6)))
      .catch(() => setNews([]))
      .finally(() => setLoadingNews(false));
  }, []);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border card-shadow animate-fade-in">
        <img
          src={heroBg}
          alt="Minecraft Nether dramatic landscape"
          width={1920}
          height={1088}
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

        <div className="relative grid lg:grid-cols-[1fr_360px] gap-8 p-8 md:p-12">
          <div className="flex flex-col justify-center max-w-2xl">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-xs font-medium text-primary mb-6">
              <Flame className="w-3.5 h-3.5" />
              Сезон Crimson · обновление 0.3
            </div>

            <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
              Твой <span className="gradient-text">агрессивный</span> лаунчер.
              <br />
              Один клик — и ты в игре.
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl">
              Тысячи модов, готовые сборки, шейдеры и текстур-паки прямо из Modrinth.
              Серверы, новости и профиль в стиле Steam — всё в одном тёмно-красном интерфейсе.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg" className="rounded-full">
                <Link to="/instances">
                  <Play className="w-4 h-4 mr-1 fill-current" />
                  Открыть мои сборки
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full bg-secondary/40 border-border hover:bg-secondary">
                <Link to="/modpacks">
                  Сборки сообщества
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats column */}
          <div className="flex flex-col gap-4 justify-center">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-card/70 backdrop-blur-md p-5 hover:border-primary/40 transition-colors"
              >
                <Icon className="w-5 h-5 text-primary mb-3" />
                <div className="font-display font-bold text-3xl mb-1">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR MODPACKS */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl flex items-center gap-2">
              <Box className="w-7 h-7 text-primary" />
              Популярные сборки
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Самые скачиваемые modpacks с Modrinth</p>
          </div>
          <Link to="/modpacks" className="text-sm font-medium text-primary hover:text-primary-glow transition-colors flex items-center gap-1">
            Все сборки <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingPacks ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularPacks.map(pack => (
              <button
                key={pack.project_id}
                onClick={() => setSelected(pack)}
                className="group text-left rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all"
              >
                <div className="aspect-square bg-secondary border-b border-border overflow-hidden flex items-center justify-center">
                  {pack.icon_url
                    ? <img src={pack.icon_url} alt={pack.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    : <Box className="w-12 h-12 text-muted-foreground" />}
                </div>
                <div className="p-4">
                  <div className="font-display font-bold text-base truncate group-hover:text-primary transition-colors mb-1">{pack.title}</div>
                  <div className="text-xs text-muted-foreground truncate mb-3">{pack.author}</div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{formatNumber(pack.downloads)}</span>
                    <Badge variant="secondary" className="text-[10px]">modpack</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* POPULAR MODS */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-primary" />
              Топ модов
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Самые скачиваемые моды сообщества</p>
          </div>
          <Link to="/library" className="text-sm font-medium text-primary hover:text-primary-glow transition-colors flex items-center gap-1">
            Все моды <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularMods.map(mod => (
            <button
              key={mod.project_id}
              onClick={() => setSelected(mod)}
              className="group text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:-translate-y-1 transition-all flex gap-3"
            >
              <div className="w-14 h-14 rounded-xl bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
                {mod.icon_url
                  ? <img src={mod.icon_url} alt={mod.title} className="w-full h-full object-cover" loading="lazy" />
                  : <Package className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-sm truncate group-hover:text-primary transition-colors">{mod.title}</div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 mb-2">{mod.description}</p>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Download className="w-3 h-3" />{formatNumber(mod.downloads)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <ModDetailDialog mod={selected} onOpenChange={(v) => !v && setSelected(null)} />
    </Layout>
  );
};

export default Index;
