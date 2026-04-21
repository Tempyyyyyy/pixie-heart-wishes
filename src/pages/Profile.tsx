import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Camera, LogIn, Heart, Package, Trophy, Loader2, Search,
  ImagePlus, Pencil, Share2, Settings, Clock, Download, Layers,
} from "lucide-react";
import { searchMods, type ModrinthHit } from "@/lib/modrinth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthDialog } from "@/components/launcher/AuthDialog";
import { SettingsDialog } from "@/components/launcher/SettingsDialog";
import { Link } from "react-router-dom";

type Profile = {
  display_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  hours_played: number;
  mod_installs: number;
  achievements: number;
  favorite_mod_id: string | null;
  favorite_mod_name: string | null;
  favorite_mod_icon: string | null;
};

type InstanceCard = {
  id: string;
  name: string;
  mc_version: string;
  loader: string;
  banner_url: string | null;
  icon_url: string | null;
};

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [instances, setInstances] = useState<InstanceCard[]>([]);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ModrinthHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("display_name, avatar_url, banner_url, hours_played, mod_installs, achievements, favorite_mod_id, favorite_mod_name, favorite_mod_icon")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data as Profile);
          setName(data.display_name ?? "");
        }
      });
    supabase.from("instances")
      .select("id, name, mc_version, loader, banner_url, icon_url")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setInstances((data as InstanceCard[]) ?? []));
  }, [user]);

  useEffect(() => {
    if (!pickerOpen || !search.trim()) return;
    const t = setTimeout(() => {
      setSearching(true);
      searchMods({ query: search, limit: 10 }).then(d => setSearchResults(d.hits)).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, pickerOpen]);

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 3 * 1024 * 1024) return toast({ title: "Файл больше 3 МБ", variant: "destructive" });
    setUploadingAvatar(true);
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploadingAvatar(false); return toast({ title: "Ошибка загрузки", description: upErr.message, variant: "destructive" }); }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: profErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setUploadingAvatar(false);
    if (profErr) return toast({ title: "Ошибка", description: profErr.message, variant: "destructive" });
    setProfile(p => p ? { ...p, avatar_url: publicUrl } : p);
    toast({ title: "Аватарка обновлена" });
  };

  const onBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) return toast({ title: "Файл больше 5 МБ", variant: "destructive" });
    setUploadingBanner(true);
    const path = `${user.id}/banner-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
    if (upErr) { setUploadingBanner(false); return toast({ title: "Ошибка загрузки", description: upErr.message, variant: "destructive" }); }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    const { error: profErr } = await supabase.from("profiles").update({ banner_url: publicUrl }).eq("id", user.id);
    setUploadingBanner(false);
    if (profErr) return toast({ title: "Ошибка", description: profErr.message, variant: "destructive" });
    setProfile(p => p ? { ...p, banner_url: publicUrl } : p);
    toast({ title: "Баннер обновлён" });
  };

  const saveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", user.id);
    setSavingName(false);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setProfile(p => p ? { ...p, display_name: name.trim() } : p);
    setEditingName(false);
    toast({ title: "Имя сохранено" });
  };

  const setFavorite = async (mod: ModrinthHit) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      favorite_mod_id: mod.project_id,
      favorite_mod_name: mod.title,
      favorite_mod_icon: mod.icon_url ?? null,
    }).eq("id", user.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setProfile(p => p ? { ...p, favorite_mod_id: mod.project_id, favorite_mod_name: mod.title, favorite_mod_icon: mod.icon_url ?? null } : p);
    setPickerOpen(false);
    toast({ title: "Любимый мод обновлён", description: mod.title });
  };

  const onShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Ссылка скопирована" });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  if (authLoading) {
    return <Layout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto mb-6 flex items-center justify-center glow-shadow">
            <LogIn className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-3xl mb-3">Войди, чтобы открыть профиль</h1>
          <p className="text-muted-foreground mb-6">Сохраняй сборки, аватарку и любимый мод в облаке.</p>
          <Button variant="hero" size="lg" onClick={() => setAuthOpen(true)}>
            <LogIn className="w-4 h-4 mr-1" />Войти / Регистрация
          </Button>
          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </div>
      </Layout>
    );
  }

  const initials = (profile?.display_name || "P").slice(0, 2).toUpperCase();

  return (
    <Layout>
      {/* === HERO BANNER === */}
      <section className="relative rounded-3xl border border-border bg-card overflow-hidden mb-6 animate-fade-in">
        {/* Banner image */}
        <div
          className="relative h-44 md:h-56 group"
          style={{
            background: profile?.banner_url
              ? `url(${profile.banner_url}) center/cover`
              : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.6) 100%)",
          }}
        >
          {/* edit banner overlay */}
          <button
            onClick={() => bannerRef.current?.click()}
            disabled={uploadingBanner}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-background/70 backdrop-blur border border-border text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 hover:bg-background"
          >
            {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
            Сменить баннер
          </button>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={onBannerFile} />
        </div>

        {/* Avatar + name + actions */}
        <div className="px-6 md:px-8 pb-6 -mt-14 md:-mt-16 flex flex-col md:flex-row md:items-end gap-4 md:gap-6 relative">
          <div className="relative group/avatar shrink-0">
            <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-card shadow-2xl rounded-2xl">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? ""} className="object-cover" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-display font-bold rounded-2xl">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
            >
              {uploadingAvatar ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatarFile} />
          </div>

          <div className="flex-1 min-w-0 md:pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {editingName ? (
                <div className="flex gap-2 items-center">
                  <Input value={name} onChange={e => setName(e.target.value)} maxLength={32} className="text-2xl font-display font-bold h-10 max-w-xs" autoFocus />
                  <Button size="sm" onClick={saveName} disabled={savingName || !name.trim()}>
                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : "OK"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingName(false); setName(profile?.display_name ?? ""); }}>Отмена</Button>
                </div>
              ) : (
                <>
                  <h1 className="font-display font-bold text-2xl md:text-3xl truncate">{profile?.display_name || "Без имени"}</h1>
                  <button onClick={() => setEditingName(true)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground" aria-label="Изменить">
                    <Pencil className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_hsl(var(--primary))]" />
              Online · {user.email}
            </p>
          </div>

          <div className="flex gap-2 md:pb-2 shrink-0">
            <Button variant="outline" onClick={onShare}><Share2 className="w-4 h-4 mr-1.5" />Поделиться</Button>
            <Button variant="hero" onClick={() => setSettingsOpen(true)}><Settings className="w-4 h-4 mr-1.5" />Настройки</Button>
          </div>
        </div>
      </section>

      {/* === STATS === */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in">
        <StatCard icon={Clock} value={profile?.hours_played ?? 0} label="Часов в игре" />
        <StatCard icon={Download} value={profile?.mod_installs ?? 0} label="Установок модов" />
        <StatCard icon={Layers} value={instances.length} label="Сборок создано" />
        <StatCard icon={Trophy} value={`${profile?.achievements ?? 0}/120`} label="Достижений" />
      </section>

      {/* === FAVORITE MOD + INSTANCES SHOWCASE === */}
      <div className="grid lg:grid-cols-2 gap-5 pb-8 animate-fade-in">
        {/* Favorite mod */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-primary" />Любимый мод
            </span>
            <button onClick={() => setPickerOpen(true)} className="text-xs text-muted-foreground hover:text-foreground">Изменить</button>
          </div>
          {profile?.favorite_mod_id ? (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                {profile.favorite_mod_icon
                  ? <img src={profile.favorite_mod_icon} alt={profile.favorite_mod_name ?? ""} className="w-full h-full object-cover" />
                  : <Package className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-lg truncate">{profile.favorite_mod_name}</div>
                <Link to="/library" className="text-xs text-primary hover:underline">Открыть страницу мода →</Link>
              </div>
            </div>
          ) : (
            <button onClick={() => setPickerOpen(true)} className="w-full p-6 rounded-xl border border-dashed border-border text-center hover:border-primary/50 transition-colors">
              <Search className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Выбрать любимый мод</span>
            </button>
          )}
        </section>

        {/* Instances showcase */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="font-display font-bold text-base">Витрина сборок</span>
            <Link to="/instances" className="text-xs text-primary hover:underline">Управлять →</Link>
          </div>
          {instances.length === 0 ? (
            <Link to="/instances" className="block p-6 rounded-xl border border-dashed border-border text-center hover:border-primary/50 transition-colors">
              <Layers className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Создай первую сборку</span>
            </Link>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {instances.map(inst => (
                <Link
                  key={inst.id}
                  to={`/instances/${inst.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border hover:border-primary/40 transition-colors group"
                >
                  <div
                    className="w-12 h-12 rounded-lg bg-secondary shrink-0 border border-border overflow-hidden"
                    style={inst.banner_url ? { background: `url(${inst.banner_url}) center/cover` } : undefined}
                  >
                    {!inst.banner_url && <div className="w-full h-full gradient-primary opacity-60" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate group-hover:text-primary">{inst.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{inst.mc_version} · {inst.loader}</div>
                  </div>
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">0ч</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Mod picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Выбери любимый мод</DialogTitle></DialogHeader>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск: Sodium, JEI, Iris…" autoFocus />
          <div className="max-h-80 overflow-y-auto space-y-1">
            {searching && <Loader2 className="w-5 h-5 animate-spin mx-auto my-4 text-primary" />}
            {searchResults.map(m => (
              <button
                key={m.project_id}
                onClick={() => setFavorite(m)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                  {m.icon_url
                    ? <img src={m.icon_url} alt={m.title} className="w-full h-full object-cover" />
                    : <Package className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{m.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.description}</div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Layout>
  );
};

const StatCard = ({ icon: Icon, value, label }: { icon: any; value: number | string; label: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
    <Icon className="w-5 h-5 text-primary mb-3" />
    <div className="font-display font-bold text-3xl mb-1">{value}</div>
    <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
  </div>
);

export default ProfilePage;
