import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/launcher/AuthDialog";
import { useLaunchPrefs } from "@/lib/launchSettings";
import {
  Gamepad2, UserPlus, Check, Trash2, Loader2, LogIn, ShieldAlert, UserRound, Sparkles,
  Shirt, Upload, X,
} from "lucide-react";

type McAccount = {
  id: string;
  username: string;
  account_type: "offline" | "microsoft";
  uuid: string | null;
  is_active: boolean;
  created_at: string;
  skin_url: string | null;
  cape_url: string | null;
  skin_model: string;
};

// Built-in capes (текстуры из vanilla/Optifine — публичные изображения)
const CAPES = [
  { id: "mojang",      name: "Mojang",     url: "https://textures.minecraft.net/texture/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6" },
  { id: "minecon2011", name: "MineCon 2011", url: "https://textures.minecraft.net/texture/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6" },
  { id: "minecon2012", name: "MineCon 2012", url: "https://textures.minecraft.net/texture/a2e8d97ec79100e90a75d369d1b3ba81273c4f82bc1b737e934eed4a854be1b6" },
  { id: "minecon2013", name: "MineCon 2013", url: "https://textures.minecraft.net/texture/153b1a0dfcbae953cdeb6f2c2bf6bf79943239b1372780da44bcbb29273131da" },
  { id: "minecon2015", name: "MineCon 2015", url: "https://textures.minecraft.net/texture/b0cc08840700447322d953a02b965f1d65a13a603bf64b17c803c21446fe1635" },
  { id: "minecon2016", name: "MineCon 2016", url: "https://textures.minecraft.net/texture/298ae017a64b67f59ce7ebcdc8a12bf7daed0784feb4e4b0dad8b424a6a47e4b" },
  { id: "vanilla",     name: "Vanilla",    url: "https://textures.minecraft.net/texture/2340c0e03dd24a11b15a8b33c2a7e9e32abb2051b2481d0ba7defd635ca7a933" },
];

// Deterministic offline UUID (Mojang-style "OfflinePlayer:<name>")
const offlineUuid = (name: string) => {
  // simple md5-like hash → uuid v3 fallback (good enough for offline)
  let h = 0;
  const s = `OfflinePlayer:${name}`;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  const hex = Math.abs(h).toString(16).padStart(8, "0");
  return `${hex.slice(0, 8)}-0000-3000-8000-${hex.repeat(2).slice(0, 12)}`;
};

const AccountPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { update: updatePrefs } = useLaunchPrefs();

  const [accounts, setAccounts] = useState<McAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [skinDialog, setSkinDialog] = useState<McAccount | null>(null);
  const [uploadingSkin, setUploadingSkin] = useState(false);
  const skinInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("minecraft_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAccounts((data ?? []) as McAccount[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const addOffline = async () => {
    if (!user) return;
    const name = newName.trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) {
      return toast({
        title: "Некорректный ник",
        description: "3–16 символов: латиница, цифры и _",
        variant: "destructive",
      });
    }
    if (accounts.some(a => a.username.toLowerCase() === name.toLowerCase())) {
      return toast({ title: "Такой аккаунт уже есть", variant: "destructive" });
    }
    setAdding(true);
    const isFirst = accounts.length === 0;
    const { error } = await supabase.from("minecraft_accounts").insert({
      user_id: user.id,
      username: name,
      account_type: "offline",
      uuid: offlineUuid(name),
      is_active: isFirst,
    });
    setAdding(false);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    if (isFirst) updatePrefs({ username: name });
    toast({ title: "Аккаунт добавлен", description: name });
    setNewName("");
    setDialogOpen(false);
    load();
  };

  const setActive = async (acc: McAccount) => {
    if (!user || acc.is_active) return;
    // unset all then set this one (unique partial index requires two-step)
    await supabase.from("minecraft_accounts").update({ is_active: false }).eq("user_id", user.id).eq("is_active", true);
    const { error } = await supabase.from("minecraft_accounts").update({ is_active: true }).eq("id", acc.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    updatePrefs({ username: acc.username, uuid: acc.uuid ?? undefined, accountType: acc.account_type });
    toast({ title: "Активный аккаунт", description: acc.username });
    load();
  };

  const addMicrosoft = async () => {
    if (!user) return;
    const electron = (window as any).electronAPI;
    if (!electron) return toast({ title: "Только в десктопной версии" });

    setAdding(true);
    const res = await electron.loginMicrosoft();
    if (!res.ok) {
      setAdding(false);
      return toast({ title: "Ошибка входа", description: res.error, variant: "destructive" });
    }

    if (accounts.some(a => a.uuid === res.uuid)) {
      setAdding(false);
      return toast({ title: "Этот аккаунт уже добавлен" });
    }

    const isFirst = accounts.length === 0;
    const { error } = await supabase.from("minecraft_accounts").insert({
      user_id: user.id,
      username: res.username,
      account_type: "microsoft",
      uuid: res.uuid,
      is_active: isFirst,
    });

    setAdding(false);
    if (error) return toast({ title: "Ошибка БД", description: error.message, variant: "destructive" });
    
    if (isFirst) updatePrefs({ username: res.username, uuid: res.uuid, accountType: "microsoft" });
    toast({ title: "Аккаунт добавлен", description: res.username });
    load();
  };

  const remove = async (acc: McAccount) => {
    const { error } = await supabase.from("minecraft_accounts").delete().eq("id", acc.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    toast({ title: "Аккаунт удалён" });
    load();
  };

  if (authLoading) {
    return <Layout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto mb-6 flex items-center justify-center glow-shadow">
            <Gamepad2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-3xl mb-3">Войди в лаунчер</h1>
          <p className="text-muted-foreground mb-6">Чтобы привязать Minecraft аккаунты к твоему профилю.</p>
          <Button variant="hero" size="lg" onClick={() => setAuthOpen(true)}>
            <LogIn className="w-4 h-4 mr-1" />Войти / Регистрация
          </Button>
          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* HEADER */}
      <section className="rounded-3xl border border-border bg-card p-6 md:p-8 mb-6 animate-fade-in relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(80% 60% at 80% 20%, hsl(var(--primary) / 0.5), transparent 60%)" }}
        />
        <div className="relative flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center glow-shadow shrink-0">
            <Gamepad2 className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl">Аккаунты Minecraft</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Управляй ник-неймами для входа в игру</p>
          </div>
        </div>
      </section>

      {/* TWO ACTION CARDS */}
      <section className="grid md:grid-cols-2 gap-4 mb-6 animate-fade-in">
        {/* Offline card */}
        <button
          onClick={() => setDialogOpen(true)}
          className="text-left rounded-2xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
              <UserRound className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-lg">Оффлайн аккаунт</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Бесплатно
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Просто выбери ник. Подходит для одиночной игры и пиратских серверов.
              </p>
            </div>
          </div>
        </button>

        {/* Microsoft card */}
        <button
          onClick={addMicrosoft}
          disabled={adding}
          className="text-left rounded-2xl border border-border bg-card p-6 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-lg">Microsoft аккаунт</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Официально
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Вход через официальный Minecraft аккаунт для лицензионных серверов.
              </p>
            </div>
          </div>
        </button>
      </section>

      {/* ACCOUNTS LIST */}
      <section className="rounded-2xl border border-border bg-card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Сохранённые аккаунты</h2>
          <Button size="sm" variant="hero" onClick={() => setDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" />Добавить
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-10">
            <ShieldAlert className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">Пока нет ни одного аккаунта</p>
            <Button onClick={() => setDialogOpen(true)}><UserPlus className="w-4 h-4 mr-1.5" />Добавить первый</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map(acc => (
              <div
                key={acc.id}
                className={`rounded-xl border p-4 transition-all ${
                  acc.is_active
                    ? "border-primary/60 bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border bg-secondary/30 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Minecraft head avatar (Crafatar) */}
                  <div className="w-12 h-12 rounded-lg bg-secondary border border-border overflow-hidden shrink-0 image-render-pixel">
                    <img
                      src={`https://mc-heads.net/avatar/${encodeURIComponent(acc.username)}/64`}
                      alt={acc.username}
                      className="w-full h-full"
                      style={{ imageRendering: "pixelated" as const }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display font-bold truncate">{acc.username}</span>
                      {acc.is_active && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                      {acc.account_type === "offline" ? "Оффлайн" : "Microsoft"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {!acc.is_active && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setActive(acc)}>
                      Сделать активным
                    </Button>
                  )}
                  {acc.is_active && (
                    <span className="flex-1 text-xs text-center py-1.5 px-2 rounded-md bg-primary/15 text-primary font-medium">
                      Активен
                    </span>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(acc)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ADD OFFLINE DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRound className="w-5 h-5 text-primary" />
              Новый оффлайн аккаунт
            </DialogTitle>
            <DialogDescription>
              Введи ник, который будет показан в игре. От 3 до 16 символов: латиница, цифры и _.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="mc-name">Ник Minecraft</Label>
              <Input
                id="mc-name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Steve"
                maxLength={16}
                autoFocus
                onKeyDown={e => e.key === "Enter" && addOffline()}
              />
            </div>
            {newName.trim().length >= 3 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                <img
                  src={`https://mc-heads.net/avatar/${encodeURIComponent(newName.trim())}/48`}
                  alt="preview"
                  className="w-10 h-10 rounded-md"
                  style={{ imageRendering: "pixelated" as const }}
                />
                <div className="text-xs text-muted-foreground">
                  Так будет выглядеть голова в игре
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button variant="hero" onClick={addOffline} disabled={adding || !newName.trim()}>
              {adding ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1.5" />}
              Создать
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AccountPage;
