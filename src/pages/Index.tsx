import { useEffect, useState } from "react";
import { Play, Flame, TrendingUp, Package, Users, ArrowRight, Sparkles, Box, Loader2, Download, Newspaper, ExternalLink, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/launcher/Layout";
import { ModDetailDialog } from "@/components/launcher/ModDetailDialog";
import { searchProjects, type ModrinthHit } from "@/lib/modrinth";
import { useTheme, THEME_PRESETS } from "@/lib/launchSettings";
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

  const { theme } = useTheme();
  const currentThemeName = theme.name.split(" ")[0];
  const isElectron = !!(window as any).electronAPI?.isElectron;

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
              Тема {currentThemeName} · обновление 0.3
            </div>

            <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
              Твой <span className="gradient-text">агрессивный</span> лаунчер.
              <br />
              Один клик — и ты в игре.
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl">
              Тысячи модов, готовые сборки, шейдеры и текстур-паки прямо из Modrinth.
              Серверы, новости и профиль в стиле Steam — всё в одном кастомном интерфейсе.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg" className="rounded-full">
                <Link to="/instances">
                  <Layers className="w-4 h-4 mr-2" />
                  Мои сборки
                </Link>
              </Button>
              
              {!isElectron && (
                <Button asChild variant="outline" size="lg" className="rounded-full bg-secondary/40 border-border hover:bg-secondary">
                  <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes/releases/latest" target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Скачать лаунчер
                  </a>
                </Button>
              )}

              <Button asChild variant="outline" size="lg" className="rounded-full bg-secondary/40 border-border hover:bg-secondary">
                <Link to="/modpacks">
                  Сборки сообщества
                  <ArrowRight className="w-4 h-4 ml-2" />
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

      {/* NEWS + COMPACT MODPACKS GRID */}
      <section className="mt-12 grid lg:grid-cols-[1fr_360px] gap-6">
        {/* News column */}
        <div>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-2xl md:text-3xl flex items-center gap-2">
                <Newspaper className="w-7 h-7 text-primary" />
                Новости Minecraft
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Свежие истории сообщества и обновления</p>
            </div>
            <Link to="/news" className="text-sm font-medium text-primary hover:text-primary-glow transition-colors flex items-center gap-1">
              Все новости <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingNews ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm rounded-2xl border border-border bg-card">
              Не удалось загрузить новости.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {news.map((n, i) => (
                <a
                  key={n.link + i}
                  href={n.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all flex flex-col"
                >
                  <div className="aspect-video bg-secondary border-b border-border overflow-hidden">
                    {n.image ? (
                      <img
                        src={n.image}
                        alt={n.title}
                        loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = heroBg; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <img src={heroBg} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px]">{n.source}</Badge>
                      {n.pubDate && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.pubDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    <div className="font-display font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
                      {n.title}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-auto">{n.description}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Compact modpacks sidebar */}
        <aside>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-xl flex items-center gap-2">
                <Box className="w-5 h-5 text-primary" />
                Сборки
              </h2>
              <p className="text-muted-foreground text-xs mt-1">Топ Modrinth</p>
            </div>
            <Link to="/modpacks" className="text-xs font-medium text-primary hover:text-primary-glow transition-colors flex items-center gap-1">
              Все <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loadingPacks ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {popularPacks.map(pack => (
                <button
                  key={pack.project_id}
                  onClick={() => setSelected(pack)}
                  className="group text-left rounded-xl border border-border bg-card p-3 hover:border-primary/50 hover:-translate-y-0.5 transition-all flex gap-3"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
                    {pack.icon_url
                      ? <img src={pack.icon_url} alt={pack.title} className="w-full h-full object-cover" loading="lazy" />
                      : <Box className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-sm truncate group-hover:text-primary transition-colors">{pack.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{pack.author}</div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Download className="w-3 h-3" />{formatNumber(pack.downloads)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>
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
