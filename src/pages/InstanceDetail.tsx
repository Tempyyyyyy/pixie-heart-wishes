import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Layout } from "@/components/launcher/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Loader2, ImagePlus, Pencil, Trash2, Save, Plus, Package, Search,
  Replace, X, Users, Download as DownloadIcon, Calendar, FileBox,
} from "lucide-react";
import { searchMods, type ModrinthHit } from "@/lib/modrinth";
import { LaunchMinecraftButton } from "@/components/launcher/LaunchMinecraftButton";

type ModInInstance = { id: string; name: string; icon: string | null; slug: string };
type Instance = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  mc_version: string;
  loader: string;
  icon_url: string | null;
  banner_url: string | null;
  mrpack_url: string | null;
  modrinth_project_id: string | null;
  mods: ModInInstance[];
  created_at: string;
  updated_at: string;
};

const VERSIONS = ["1.21.1", "1.21", "1.20.6", "1.20.4", "1.20.1", "1.19.4", "1.19.2", "1.18.2", "1.16.5"];
const LOADERS = ["fabric", "forge", "neoforge", "quilt", "vanilla"];

const InstanceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const bannerRef = useRef<HTMLInputElement>(null);

  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Edit dialog
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", mc_version: "1.20.1", loader: "fabric" });

  // Mod picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceModId, setReplaceModId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ModrinthHit[]>([]);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("instances").select("*").eq("id", id).maybeSingle();
    setLoading(false);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    if (!data) return;
    const inst: Instance = { ...data, mods: (data.mods as ModInInstance[]) ?? [] } as Instance;
    setInstance(inst);
    setForm({ name: inst.name, description: inst.description ?? "", mc_version: inst.mc_version, loader: inst.loader });
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    if (!pickerOpen) return;
    const t = setTimeout(() => {
      setSearching(true);
      searchMods({ query: search, limit: 12, loader: instance?.loader }).then(d => setResults(d.hits)).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, pickerOpen, instance?.loader]);

  const isOwner = user && instance && user.id === instance.user_id;

  const onBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !instance) return;
    if (file.size > 5 * 1024 * 1024) return toast({ title: "Файл больше 5 МБ", variant: "destructive" });
    setUploadingBanner(true);
    const path = `${user.id}/instance-${instance.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
    if (upErr) { setUploadingBanner(false); return toast({ title: "Ошибка", description: upErr.message, variant: "destructive" }); }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    const { error: dbErr } = await supabase.from("instances").update({ banner_url: publicUrl }).eq("id", instance.id);
    setUploadingBanner(false);
    if (dbErr) return toast({ title: "Ошибка", description: dbErr.message, variant: "destructive" });
    setInstance(p => p ? { ...p, banner_url: publicUrl } : p);
    toast({ title: "Баннер обновлён" });
  };

  const saveForm = async () => {
    if (!instance) return;
    if (!form.name.trim()) return toast({ title: "Название не может быть пустым" });
    const { error } = await supabase.from("instances").update(form).eq("id", instance.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setInstance(p => p ? { ...p, ...form } : p);
    setEditing(false);
    toast({ title: "Сохранено" });
  };

  const deleteInstance = async () => {
    if (!instance) return;
    if (!confirm(`Удалить сборку «${instance.name}»?`)) return;
    const { error } = await supabase.from("instances").delete().eq("id", instance.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    toast({ title: "Удалено" });
    navigate("/instances");
  };

  const updateMods = async (mods: ModInInstance[]) => {
    if (!instance) return;
    const { error } = await supabase.from("instances").update({ mods: mods as any }).eq("id", instance.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setInstance(p => p ? { ...p, mods } : p);
  };

  const addMod = async (mod: ModrinthHit) => {
    if (!instance) return;
    const newMod: ModInInstance = { id: mod.project_id, slug: mod.slug, name: mod.title, icon: mod.icon_url };
    let next: ModInInstance[];
    if (replaceModId) {
      next = instance.mods.map(m => m.id === replaceModId ? newMod : m);
      toast({ title: "Мод заменён", description: mod.title });
    } else {
      if (instance.mods.some(m => m.id === newMod.id)) return toast({ title: "Уже добавлен" });
      next = [...instance.mods, newMod];
      toast({ title: "Мод добавлен", description: mod.title });
    }
    await updateMods(next);
    setPickerOpen(false);
    setReplaceModId(null);
    setSearch("");
  };

  const removeMod = async (modId: string) => {
    if (!instance) return;
    await updateMods(instance.mods.filter(m => m.id !== modId));
  };

  if (authLoading || loading) {
    return <Layout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!instance) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="font-display text-2xl mb-3">Сборка не найдена</h1>
          <Button variant="outline" asChild><Link to="/instances"><ArrowLeft className="w-4 h-4 mr-1" />К сборкам</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <button onClick={() => navigate("/instances")} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" />Все сборки
      </button>

      {/* HERO */}
      <section className="relative rounded-3xl border border-border bg-card overflow-hidden mb-6 animate-fade-in">
        <div
          className="relative h-48 md:h-64 group"
          style={{
            background: instance.banner_url
              ? `url(${instance.banner_url}) center/cover`
              : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.5) 100%)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          {isOwner && (
            <button
              onClick={() => bannerRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-background/70 backdrop-blur border border-border text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 hover:bg-background"
            >
              {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              Сменить баннер
            </button>
          )}
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={onBannerFile} />
        </div>

        <div className="px-6 md:px-8 pb-6 -mt-20 md:-mt-24 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <div
              className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-card shadow-2xl shrink-0 overflow-hidden"
              style={{
                background: instance.icon_url
                  ? `url(${instance.icon_url}) center/cover`
                  : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent, var(--primary))))",
              }}
            >
              {!instance.icon_url && (
                <div className="w-full h-full flex items-center justify-center font-display font-bold text-3xl text-primary-foreground">
                  {instance.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-3xl md:text-4xl mb-2 truncate">{instance.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge className="bg-primary/20 text-primary border-primary/30 uppercase">{instance.loader}</Badge>
                <Badge variant="outline" className="font-mono">{instance.mc_version}</Badge>
                <Badge variant="secondary"><Package className="w-3 h-3 mr-1" />{instance.mods.length} модов</Badge>
                {instance.mrpack_url && <Badge variant="secondary">.mrpack</Badge>}
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                  <Calendar className="w-3 h-3" />Создано {new Date(instance.created_at).toLocaleDateString("ru")}
                </span>
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2 shrink-0">
                <LaunchMinecraftButton
                  version={instance.mc_version}
                  loader={instance.loader}
                  instanceId={instance.id}
                  label="Играть"
                  variant="hero"
                  size="lg"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 pb-8">
        {/* MAIN: tabs */}
        <Tabs defaultValue="mods" className="animate-fade-in">
          <TabsList>
            <TabsTrigger value="mods">Моды ({instance.mods.length})</TabsTrigger>
            <TabsTrigger value="description">Описание</TabsTrigger>
          </TabsList>

          <TabsContent value="mods" className="mt-4">
            {isOwner && (
              <Button variant="hero" onClick={() => { setReplaceModId(null); setPickerOpen(true); }} className="mb-4">
                <Plus className="w-4 h-4 mr-1" />Добавить мод из Modrinth
              </Button>
            )}
            {instance.mods.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-border">
                <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">Пока нет модов</p>
                {isOwner && <Button variant="outline" onClick={() => setPickerOpen(true)}><Plus className="w-4 h-4 mr-1" />Добавить первый</Button>}
              </div>
            ) : (
              <div className="grid gap-2">
                {instance.mods.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                    <div className="w-12 h-12 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                      {m.icon ? <img src={m.icon} alt={m.name} className="w-full h-full object-cover" /> : <FileBox className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{m.name}</div>
                      <a href={`https://modrinth.com/mod/${m.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary">
                        modrinth.com/mod/{m.slug}
                      </a>
                    </div>
                    {isOwner && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => { setReplaceModId(m.id); setPickerOpen(true); }} title="Заменить">
                          <Replace className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeMod(m.id)} className="text-destructive" title="Удалить">
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="description" className="mt-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              {instance.description ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{instance.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Описание не добавлено.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* SIDEBAR */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display font-bold mb-3">Информация</h3>
            <dl className="space-y-2 text-sm">
              <InfoRow icon={Package} label="Модов" value={String(instance.mods.length)} />
              <InfoRow icon={DownloadIcon} label="Лоадер" value={instance.loader} />
              <InfoRow icon={FileBox} label="Версия MC" value={instance.mc_version} />
              <InfoRow icon={Calendar} label="Обновлено" value={new Date(instance.updated_at).toLocaleDateString("ru")} />
              <InfoRow icon={Users} label="Автор" value="Ты" />
            </dl>
          </div>

          {isOwner && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <h3 className="font-display font-bold mb-1">Управление</h3>
              <Button variant="outline" className="w-full justify-start" onClick={() => setEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" />Изменить настройки
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={deleteInstance}>
                <Trash2 className="w-4 h-4 mr-2" />Удалить сборку
              </Button>
            </div>
          )}
        </aside>
      </div>

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader><DialogTitle>Настройки сборки</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Название</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Описание</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Версия MC</Label>
                <Select value={form.mc_version} onValueChange={v => setForm({ ...form, mc_version: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{VERSIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Лоадер</Label>
                <Select value={form.loader} onValueChange={v => setForm({ ...form, loader: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LOADERS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Отмена</Button>
            <Button variant="hero" onClick={saveForm}><Save className="w-4 h-4 mr-1" />Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mod picker */}
      <Dialog open={pickerOpen} onOpenChange={(v) => { if (!v) { setPickerOpen(false); setReplaceModId(null); setSearch(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{replaceModId ? "Заменить мод" : "Добавить мод из Modrinth"}</DialogTitle></DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sodium, JEI, Iris…" autoFocus className="pl-9" />
          </div>
          <p className="text-xs text-muted-foreground">Фильтр по лоадеру: <span className="font-mono text-foreground">{instance.loader}</span></p>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {searching && <Loader2 className="w-5 h-5 animate-spin mx-auto my-4 text-primary" />}
            {results.map(m => (
              <button key={m.project_id} onClick={() => addMod(m)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 transition-colors text-left">
                <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                  {m.icon_url ? <img src={m.icon_url} alt={m.title} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-muted-foreground" />}
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

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default InstanceDetailPage;
