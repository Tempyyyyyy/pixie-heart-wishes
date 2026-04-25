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
  Shirt, Upload, X, Search,
} from "lucide-react";
import { SkinViewer3D } from "@/components/launcher/SkinViewer3D";

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

// Built-in capes (текстуры из vanilla/MineCon — публичные URL minecraft.net)
const CAPES = [
  { id: "minecon2011", name: "MineCon 2011",  url: "https://textures.minecraft.net/texture/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6" },
  { id: "minecon2012", name: "MineCon 2012",  url: "https://textures.minecraft.net/texture/a2e8d97ec79100e90a75d369d1b3ba81273c4f82bc1b737e934eed4a854be1b6" },
  { id: "minecon2013", name: "MineCon 2013",  url: "https://textures.minecraft.net/texture/153b1a0dfcbae953cdeb6f2c2bf6bf79943239b1372780da44bcbb29273131da" },
  { id: "minecon2015", name: "MineCon 2015",  url: "https://textures.minecraft.net/texture/b0cc08840700447322d953a02b965f1d65a13a603bf64b17c803c21446fe1635" },
  { id: "minecon2016", name: "MineCon 2016",  url: "https://textures.minecraft.net/texture/298ae017a64b67f59ce7ebcdc8a12bf7daed0784feb4e4b0dad8b424a6a47e4b" },
  { id: "mojang",      name: "Mojang Classic",url: "https://textures.minecraft.net/texture/5786fe99be377dfb6858859f926c4dbc995751e91cee373468c5fbf4865e7151" },
  { id: "vanilla",     name: "Vanilla",       url: "https://textures.minecraft.net/texture/2340c0e03dd24a11b15a8b33c2a7e9e32abb2051b2481d0ba7defd635ca7a933" },
  { id: "migrator",    name: "Migrator",      url: "https://textures.minecraft.net/texture/2dd3a9a5494e1a2eb50fc4356a6d09cda2ce3a55aabf0667ecf90ad6e1442f6e" },
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
  const [uploadingCape, setUploadingCape] = useState(false);
  const capeInputRef = useRef<HTMLInputElement>(null);
  // Импорт плащей с лиц. ника (для оффлайн-аккаунтов)
  const [importNick, setImportNick] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedCapes, setImportedCapes] = useState<{ id: string; name: string; image: string }[]>([]);

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

  const onSkinFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user || !skinDialog) return;
    if (!/\.png$/i.test(file.name)) {
      return toast({ title: "Только PNG", description: "Скины Minecraft — это .png 64×64 или 64×32", variant: "destructive" });
    }
    if (file.size > 1024 * 1024) {
      return toast({ title: "Файл слишком большой", description: "Максимум 1 МБ", variant: "destructive" });
    }
    setUploadingSkin(true);
    const path = `${user.id}/${skinDialog.id}-${Date.now()}.png`;
    const { error: upErr } = await supabase.storage.from("skins").upload(path, file, { upsert: true, contentType: "image/png" });
    if (upErr) {
      setUploadingSkin(false);
      return toast({ title: "Ошибка загрузки", description: upErr.message, variant: "destructive" });
    }
    const { data: { publicUrl } } = supabase.storage.from("skins").getPublicUrl(path);
    const { error: updErr } = await supabase.from("minecraft_accounts").update({ skin_url: publicUrl }).eq("id", skinDialog.id);
    setUploadingSkin(false);
    if (updErr) return toast({ title: "Ошибка БД", description: updErr.message, variant: "destructive" });
    setSkinDialog(prev => prev ? { ...prev, skin_url: publicUrl } : prev);
    toast({ title: "Скин загружен", description: "Будет применён при следующем запуске оффлайн-аккаунта" });
    load();
  };

  const setSkinModel = async (acc: McAccount, model: "classic" | "slim") => {
    const { error } = await supabase.from("minecraft_accounts").update({ skin_model: model }).eq("id", acc.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setSkinDialog(prev => prev ? { ...prev, skin_model: model } : prev);
    load();
  };

  const setCape = async (acc: McAccount, capeUrl: string | null) => {
    const { error } = await supabase.from("minecraft_accounts").update({ cape_url: capeUrl }).eq("id", acc.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setSkinDialog(prev => prev ? { ...prev, cape_url: capeUrl } : prev);
    toast({ title: capeUrl ? "Плащ выбран" : "Плащ снят" });
    load();
  };

  const removeSkin = async (acc: McAccount) => {
    const { error } = await supabase.from("minecraft_accounts").update({ skin_url: null }).eq("id", acc.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setSkinDialog(prev => prev ? { ...prev, skin_url: null } : prev);
    toast({ title: "Скин сброшен" });
    load();
  };

  const onCapeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user || !skinDialog) return;
    if (!/\.png$/i.test(file.name)) {
      return toast({ title: "Только PNG", description: "Плащи Minecraft — это .png 64×32", variant: "destructive" });
    }
    if (file.size > 1024 * 1024) {
      return toast({ title: "Файл слишком большой", description: "Максимум 1 МБ", variant: "destructive" });
    }
    setUploadingCape(true);
    const path = `${user.id}/${skinDialog.id}-cape-${Date.now()}.png`;
    const { error: upErr } = await supabase.storage.from("skins").upload(path, file, { upsert: true, contentType: "image/png" });
    if (upErr) {
      setUploadingCape(false);
      return toast({ title: "Ошибка загрузки", description: upErr.message, variant: "destructive" });
    }
    const { data: { publicUrl } } = supabase.storage.from("skins").getPublicUrl(path);
    const { error: updErr } = await supabase.from("minecraft_accounts").update({ cape_url: publicUrl }).eq("id", skinDialog.id);
    setUploadingCape(false);
    if (updErr) return toast({ title: "Ошибка БД", description: updErr.message, variant: "destructive" });
    setSkinDialog(prev => prev ? { ...prev, cape_url: publicUrl } : prev);
    toast({ title: "Плащ загружен", description: "Будет применён при следующем запуске" });
    load();
  };

  const removeCape = async (acc: McAccount) => {
    const { error } = await supabase.from("minecraft_accounts").update({ cape_url: null }).eq("id", acc.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setSkinDialog(prev => prev ? { ...prev, cape_url: null } : prev);
    toast({ title: "Плащ сброшен" });
    load();
  };

  // Импорт плащей с лицензионного аккаунта по нику (через capes.dev)
  const importCapes = async () => {
    const nick = importNick.trim();
    if (!nick) return;
    setImporting(true);
    try {
      const r = await fetch(
        `https://iykuoicwycnmhkygqeqb.supabase.co/functions/v1/namemc?action=profile&username=${encodeURIComponent(nick)}`,
      );
      const d = await r.json();
      const capes = d?.profile?.capes ?? [];
      if (capes.length === 0) {
        toast({ title: "Плащи не найдены", description: `У ${nick} нет плащей или ник не найден` });
      } else {
        setImportedCapes(capes);
        toast({ title: `Загружено плащей: ${capes.length}`, description: `Игрок ${d.profile.username}` });
      }
    } catch {
      toast({ title: "Ошибка импорта", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  // Сброс импорта при смене аккаунта
  useEffect(() => {
    if (!skinDialog) {
      setImportedCapes([]);
      setImportNick("");
    }
  }, [skinDialog?.id]);

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
            {accounts.map(acc => {
              const previewSrc = acc.skin_url
                ? `https://mc-heads.net/avatar/${encodeURIComponent(acc.skin_url)}/64`
                : `https://mc-heads.net/avatar/${encodeURIComponent(acc.username)}/64`;
              return (
              <div
                key={acc.id}
                className={`rounded-xl border p-4 transition-all ${
                  acc.is_active
                    ? "border-primary/60 bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border bg-secondary/30 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary border border-border overflow-hidden shrink-0 image-render-pixel">
                    <img
                      src={previewSrc}
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
                      {acc.skin_url && " · кастом-скин"}
                      {acc.cape_url && " · плащ"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {!acc.is_active && (
                    <Button size="sm" variant="outline" className="flex-1 min-w-0" onClick={() => setActive(acc)}>
                      Активный
                    </Button>
                  )}
                  {acc.is_active && (
                    <span className="flex-1 min-w-0 text-xs text-center py-1.5 px-2 rounded-md bg-primary/15 text-primary font-medium">
                      Активен
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 min-w-0"
                    onClick={() => setSkinDialog(acc)}
                  >
                    <Shirt className="w-3.5 h-3.5 mr-1" />Скин
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => remove(acc)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              );
            })}
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

      {/* SKIN / CAPE DIALOG */}
      <Dialog open={!!skinDialog} onOpenChange={(v) => !v && setSkinDialog(null)}>
        <DialogContent className="max-w-2xl">
          {skinDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-primary" />
                  Скин и плащ — {skinDialog.username}
                </DialogTitle>
                <DialogDescription>
                  {skinDialog.account_type === "microsoft"
                    ? "Это лицензионный аккаунт — скин и плащ управляются Mojang. Здесь только просмотр."
                    : "Загрузи свой PNG (64×64), выбери модель и плащ. Применяется к оффлайн-аккаунту при запуске."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid md:grid-cols-[260px_1fr] gap-5 py-2">
                {/* 3D Preview — крутится мышью */}
                <div className="rounded-xl border border-border bg-secondary/30 p-3 flex flex-col items-center justify-center">
                  <SkinViewer3D
                    skinUrl={
                      skinDialog.skin_url ||
                      `https://mc-heads.net/skin/${encodeURIComponent(skinDialog.username)}`
                    }
                    capeUrl={skinDialog.cape_url}
                    model={skinDialog.skin_model === "slim" ? "slim" : "default"}
                    width={220}
                    height={300}
                    rotate
                  />
                  <div className="text-[11px] text-muted-foreground mt-1 text-center">
                    {skinDialog.skin_url ? "Кастомный скин" : "Скин по нику"} · перетащи для вращения
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                  {/* Upload skin — для всех аккаунтов */}
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Свой скин (PNG)</Label>
                    <input ref={skinInputRef} type="file" accept="image/png" className="hidden" onChange={onSkinFile} />
                    <div className="flex gap-2 mt-1.5">
                      <Button
                        size="sm"
                        variant="hero"
                        className="flex-1"
                        disabled={uploadingSkin}
                        onClick={() => skinInputRef.current?.click()}
                      >
                        {uploadingSkin ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                        Загрузить
                      </Button>
                      {skinDialog.skin_url && (
                        <Button size="sm" variant="outline" onClick={() => removeSkin(skinDialog)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Skin model — только оффлайн */}
                  {skinDialog.account_type === "offline" && (
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Модель</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Button
                          size="sm"
                          variant={skinDialog.skin_model === "classic" ? "hero" : "outline"}
                          className="flex-1"
                          onClick={() => setSkinModel(skinDialog, "classic")}
                        >
                          Steve (4px)
                        </Button>
                        <Button
                          size="sm"
                          variant={skinDialog.skin_model === "slim" ? "hero" : "outline"}
                          className="flex-1"
                          onClick={() => setSkinModel(skinDialog, "slim")}
                        >
                          Alex (3px)
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Cape — только для Microsoft аккаунтов */}
                  {skinDialog.account_type === "microsoft" && (
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Свой плащ (PNG)</Label>
                      <input ref={capeInputRef} type="file" accept="image/png" className="hidden" onChange={onCapeFile} />
                      <div className="flex gap-2 mt-1.5">
                        <Button
                          size="sm"
                          variant="hero"
                          className="flex-1"
                          disabled={uploadingCape}
                          onClick={() => capeInputRef.current?.click()}
                        >
                          {uploadingCape ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                          Загрузить
                        </Button>
                        {skinDialog.cape_url && (
                          <Button size="sm" variant="outline" onClick={() => removeCape(skinDialog)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground bg-secondary/40 rounded-lg p-3 border border-border">
                💡 <b>Скины</b> можно загружать для всех аккаунтов. <b>Плащи</b> доступны только для лицензионных Microsoft-аккаунтов.
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AccountPage;
