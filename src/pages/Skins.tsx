import { useEffect, useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Download, Shirt, ExternalLink, Loader2, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SkinViewer3D } from "@/components/launcher/SkinViewer3D";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type SkinHit = {
  id: string;
  image: string;
  url: string;
};

type CapeInfo = { id: string; name: string; image: string; type: string };

type ProfileHit = {
  username: string;
  uuid?: string;
  skinUrl: string;
  capes?: CapeInfo[];
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
  const { user } = useAuth();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("weekly");
  const [page, setPage] = useState(1);
  const [skins, setSkins] = useState<SkinHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<SkinHit | null>(null);
  const [applying, setApplying] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

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

  // Load offline accounts for applying skins
  useEffect(() => {
    if (!user) return;
    supabase
      .from("minecraft_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("account_type", "offline")
      .then(({ data }) => setAccounts(data ?? []));
  }, [user]);

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

  const applySkinToAccount = async (accountId: string, skinUrl: string) => {
    if (!user) return;
    setApplying(true);
    try {
      // Download skin as blob
      const response = await fetch(skinUrl);
      const blob = await response.blob();
      const file = new File([blob], "skin.png", { type: "image/png" });

      // Upload to Supabase storage
      const path = `${user.id}/${accountId}-${Date.now()}.png`;
      const { error: upErr } = await supabase.storage.from("skins").upload(path, file, { upsert: true, contentType: "image/png" });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("skins").getPublicUrl(path);
      const { error: updErr } = await supabase.from("minecraft_accounts").update({ skin_url: publicUrl }).eq("id", accountId);
      if (updErr) throw updErr;

      toast({ title: "Скин применён", description: "Будет активен при следующем запуске игры" });
      setOpen(null);
    } catch (err: any) {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  return (
    <Layout>
      <header className="mb-6 animate-fade-in text-center">
        <h1 className="font-display font-bold text-4xl md:text-5xl mb-2">Скины</h1>
        <p className="text-muted-foreground">Тренды NameMC + 3D-просмотр.</p>
      </header>

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
                  src={`https://crafatar.com/renders/body/${s.id}?scale=4`}
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

      {/* Превью с 3D-вращением */}
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Скин с NameMC</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center py-4 bg-gradient-to-b from-primary/10 to-transparent rounded-xl">
                <SkinViewer3D
                  skinUrl={`https://s.namemc.com/i/${open.id}.png`}
                  width={240}
                  height={320}
                  rotate
                />
              </div>
              <p className="text-[11px] text-center text-muted-foreground">
                💡 Перетаскивай мышью — скин крутится. Колесико — зум.
              </p>
              <div className="text-[11px] font-mono text-muted-foreground break-all">ID: {open.id}</div>

              {/* Apply to account section */}
              {user && accounts.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Применить к оффлайн-аккаунту
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {accounts.map((acc) => (
                      <Button
                        key={acc.id}
                        size="sm"
                        variant={acc.is_active ? "hero" : "outline"}
                        onClick={() => applySkinToAccount(acc.id, `https://s.namemc.com/i/${open.id}.png`)}
                        disabled={applying}
                        className="flex items-center gap-2"
                      >
                        <UserRound className="w-3.5 h-3.5" />
                        {acc.username}
                        {acc.is_active && <span className="text-[10px] opacity-70">(активен)</span>}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : user ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Нет оффлайн-аккаунтов. Создай один на странице <a href="/account" className="text-primary underline">Аккаунты</a>.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    <a href="/account" className="text-primary underline">Войди</a>, чтобы применять скины к аккаунтам.
                  </p>
                </div>
              )}

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
