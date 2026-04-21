import { Play, Flame, TrendingUp, Package, Users, ArrowRight, Sparkles, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/launcher/Layout";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { icon: TrendingUp, value: "1 247", label: "Часов в игре" },
  { icon: Package, value: "84", label: "Установлено модов" },
  { icon: Users, value: "12", label: "Друзей онлайн" },
];

const instances = [
  { name: "Better Vanilla+", version: "1.20.4", loader: "Fabric", mods: 47 },
  { name: "Tech Empire", version: "1.19.2", loader: "Forge", mods: 132 },
  { name: "Skyblock Reborn", version: "1.20.1", loader: "Fabric", mods: 28 },
];

const sections = [
  { to: "/library", icon: Package, title: "Каталог Modrinth", desc: "Тысячи модов, плагинов и ресурспаков" },
  { to: "/profile", icon: Users, title: "Твой профиль", desc: "Статистика, любимые моды, витрина" },
  { to: "/news", icon: Sparkles, title: "Новости", desc: "Свежие обновления Minecraft" },
];

const Index = () => {
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
              Сезон Crimson · обновление 0.1
            </div>

            <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-6">
              Твой <span className="gradient-text">агрессивный</span> лаунчер.
              <br />
              Один клик — и ты в игре.
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl">
              Моды Modrinth, профиль в стиле Steam, скины NameMC и живые новости — всё, что нужно для Minecraft, в одном тёмно-красном интерфейсе.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg" className="rounded-full">
                <Link to="/instances">
                  <Play className="w-4 h-4 mr-1 fill-current" />
                  Открыть мои сборки
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full bg-secondary/40 border-border hover:bg-secondary">
                <Link to="/library">
                  Открыть каталог
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

      {/* INSTANCES */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl">Твои сборки</h2>
            <p className="text-muted-foreground text-sm mt-1">Запускай мгновенно или редактируй конфигурацию</p>
          </div>
          <Link
            to="/instances"
            className="text-sm font-medium text-primary hover:text-primary-glow transition-colors flex items-center gap-1"
          >
            Все сборки <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {instances.map((inst) => (
            <article
              key={inst.name}
              className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all hover:-translate-y-1"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--gradient-glow)" }} />
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-display font-bold text-lg">{inst.name}</h3>
                  <span className="px-2 py-1 rounded-md bg-primary/15 text-primary text-xs font-semibold">
                    {inst.mods} модов
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-5">
                  {inst.version} · {inst.loader}
                </div>
                <Button variant="play" className="w-full rounded-xl">
                  <Flame className="w-4 h-4 mr-1" />
                  Играть
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECTIONS */}
      <section className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
        {sections.map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/50 hover:-translate-y-1 transition-all"
          >
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{desc}</p>
            <div className="text-sm font-medium text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Перейти <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </section>
    </Layout>
  );
};

export default Index;
