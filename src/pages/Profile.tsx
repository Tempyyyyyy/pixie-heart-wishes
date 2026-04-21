import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Save, LogIn, Heart, Package, Trophy, Loader2, Search } from "lucide-react";
import { searchMods, type ModrinthHit } from "@/lib/modrinth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthDialog } from "@/components/launcher/AuthDialog";
import { Link } from "react-router-dom";

type Profile = {
  display_name: string | null;
  avatar_url: string | null;
  favorite_mod_id: string | null;
  favorite_mod_name: string | null;
  favorite_mod_icon: string | null;
};

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ModrinthHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, avatar_url, favorite_mod_id, favorite_mod_name, favorite_mod_icon").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setName(data.display_name ?? "");
        }
      });
  }, [user]);

  useEffect(() => {
    if (!pickerOpen || !search.trim()) return;
    const t = setTimeout(() => {
      setSearching(true);
      searchMods({ query: search, limit: 10 }).then(d => setSearchResults(d.hits)).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, pickerOpen]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 3 * 1024 * 1024) return toast({ title: "Файл больше 3 МБ", variant: "destructive" });
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); return toast({ title: "Ошибка загрузки", description: upErr.message, variant: "destructive" }); }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: profErr } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setUploading(false);
    if (profErr) return toast({ title: "Ошибка", description: profErr.message, variant: "destructive" });
    setProfile(p => p ? { ...p, avatar_url: publicUrl } : p);
    toast({ title: "Аватарка обновлена" });
  };

  const saveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
    setSaving(false);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setProfile(p => p ? { ...p, display_name: name } : p);
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

  if (authLoading) return <Layout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;

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
      {/* Hero card */}
      <section className="relative rounded-3xl border border-border bg-card overflow-hidden mb-8 animate-fade-in">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-primary/40 shadow-[0_0_40px_hsl(var(--primary)/0.4)]">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? ""} />}
              <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="font-display font-bold text-3xl md:text-4xl mb-1">{profile?.display_name || "Без имени"}</h1>
            <p className="text-muted-foreground text-sm mb-3">{user.email}</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge className="bg-primary/20 text-primary border-primary/30"><Trophy className="w-3 h-3 mr-1" />Игрок</Badge>
              <Badge variant="secondary">с {new Date(user.created_at).toLocaleDateString("ru")}</Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6 pb-6">
        {/* Edit profile */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-bold text-xl mb-4">Профиль</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="display-name">Никнейм</Label>
              <div className="flex gap-2 mt-2">
                <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={32} />
                <Button onClick={saveName} disabled={saving || name === (profile?.display_name ?? "")}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <Camera className="w-4 h-4 mr-1" />Сменить аватарку
            </Button>
          </div>
        </section>

        {/* Favorite mod */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />Любимый мод
          </h2>
          {profile?.favorite_mod_id ? (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border mb-4">
              <div className="w-16 h-16 rounded-xl bg-secondary border border-border overflow-hidden flex items-center justify-center">
                {profile.favorite_mod_icon
                  ? <img src={profile.favorite_mod_icon} alt={profile.favorite_mod_name ?? ""} className="w-full h-full object-cover" />
                  : <Package className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold truncate">{profile.favorite_mod_name}</div>
                <div className="text-xs text-muted-foreground">Сохранено в твоём профиле</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mb-4 p-4 rounded-xl bg-secondary/30 border border-dashed border-border text-center">
              Ещё не выбран. Открой каталог и нажми «В любимые».
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="hero" className="flex-1" onClick={() => setPickerOpen(true)}>
              <Search className="w-4 h-4 mr-1" />Выбрать мод
            </Button>
            <Button variant="outline" asChild>
              <Link to="/library">Каталог</Link>
            </Button>
          </div>
        </section>
      </div>

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
    </Layout>
  );
};

export default ProfilePage;
