import { useEffect, useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Download, Shirt, ExternalLink, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SkinHit = {
  id: string;
  image: string;
  url: string;
};

type ProfileHit = {
  username: string;
  uuid?: string;
  skinUrl: string;
};

const PERIODS = [
  { id: "daily", label: "За день" },
  { id: "weekly", label: "За неделю" },
  { id: "monthly", label: "За месяц" },
  { id: "top", label: "Лучшие" },
] as const;

const NAMEMC_FN = "https://iykuoicwycnmhkygqeqb.supabase.co/functions/v1/namemc";

const Skins = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("weekly");
  const [page, setPage] = useState(1);
  const [skins, setSkins] = useState<SkinHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<SkinHit | null>(null);

  // Поиск по нику
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [profile, setProfile] = useState<ProfileHit | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${NAMEMC_FN}?action=skins&period=${period}&page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setSkins(d.skins ?? []);
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Не удалось загрузить скины", variant: "destructive" });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period, page, toast]);

  const doSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    setProfile(null);
    try {
      const r = await fetch(`${NAMEMC_FN}?action=profile&username=${encodeURIComponent(q)}`);
      const d = await r.json();
      if (d.profile) {
        setProfile(d.profile);
      } else {
        toast({ title: "Игрок не найден", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка поиска", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const downloadSkin = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast({ title: "Скачивание", description: filename });
  };

  return (
    <Layout>
      <header className="mb-6 animate-fade-in text-center">
        <h1 className="font-display font-bold text-4xl md:text-5xl mb-2">Скины</h1>
        <p className="text-muted-foreground">Топ скинов с NameMC + поиск по нику игрока.</p>
      </header>

      {/* Поиск по нику */}
      <div className="max-w-xl mx-auto mb-8 animate-fade-in">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="Введи никнейм Minecraft (например, Notch)…"
              className="h-12 pl-11 rounded-xl bg-secondary/60"
            />
          </div>
          <Button variant="hero" onClick={doSearch} disabled={searching || !search.trim()} className="h-12">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
            Найти
          </Button>
        </div>

        {profile && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row items-center gap-5">
            <img
              src={`https://mc-heads.net/body/${encodeURIComponent(profile.username)}/256`}
              alt={profile.username}
              className="h-48 object-contain"
              style={{ imageRendering: "pixelated" }}
            />
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Найден игрок</div>
              <div className="font-display font-bold text-2xl mb-2">{profile.username}</div>
              {profile.uuid && (
                <div className="text-[11px] font-mono text-muted-foreground break-all mb-3">UUID: {profile.uuid}</div>
              )}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Button onClick={() => downloadSkin(profile.skinUrl, `${profile.username}.png`)}>
                  <Download className="w-4 h-4 mr-1" />Скачать скин
                </Button>
                <Button variant="outline" asChild>
                  <a href={`https://namemc.com/profile/${profile.username}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />NameMC
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Период */}
      <div className="flex justify-center flex-wrap gap-2 mb-5">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPeriod(p.id);
              setPage(1);
            }}
            className={cn(
              "px-4 h-9 rounded-full text-xs font-semibold border transition-all",
              period === p.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/40",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mb-6">
        <Button size="icon" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="px-4 h-9 inline-flex items-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
          Страница {page}
        </span>
        <Button size="icon" variant="outline" onClick={() => setPage((p) => p + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Сетка скинов */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Загружаем скины…
        </div>
      ) : skins.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shirt className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Скины не найдены
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-6">
          {skins.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setOpen(s)}
              className="group rounded-2xl border border-border bg-card p-3 hover:border-primary/50 hover:-translate-y-1 transition-all flex flex-col items-center"
            >
              <div className="text-[10px] text-muted-foreground self-start">#{(page - 1) * 60 + idx + 1}</div>
              <div className="aspect-[3/5] w-full flex items-center justify-center bg-gradient-to-b from-secondary/40 to-transparent rounded-xl overflow-hidden">
                <img
                  src={s.image}
                  alt={`Skin ${s.id}`}
                  className="h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Превью */}
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Скин с NameMC</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center py-4 bg-gradient-to-b from-primary/10 to-transparent rounded-xl">
                <img
                  src={open.image}
                  alt={open.id}
                  className="h-72 object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <div className="text-[11px] font-mono text-muted-foreground break-all">ID: {open.id}</div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="hero"
                  className="flex-1"
                  onClick={() => downloadSkin(`https://s.namemc.com/i/${open.id}.png`, `${open.id}.png`)}
                >
                  <Download className="w-4 h-4 mr-1" />Скачать .png
                </Button>
                <Button variant="outline" asChild>
                  <a href={open.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />NameMC
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Skins;
