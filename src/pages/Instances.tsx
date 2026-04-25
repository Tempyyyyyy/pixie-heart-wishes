import { useEffect, useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play, Trash2, Pencil, Package, Loader2, LogIn, Search, X, Replace, Layers, Calendar, FileArchive } from "lucide-react";
import { searchMods, type ModrinthHit } from "@/lib/modrinth";
import { AuthDialog } from "@/components/launcher/AuthDialog";
import { LaunchMinecraftButton } from "@/components/launcher/LaunchMinecraftButton";
import { Link } from "react-router-dom";

type ModInInstance = { id: string; name: string; icon: string | null; slug: string };
type Instance = {
  id: string;
  name: string;
  description: string | null;
  mc_version: string;
  loader: string;
  icon_url: string | null;
  mods: ModInInstance[];
};

const LOADERS = ["fabric", "forge", "neoforge", "quilt"];
const MOJANG_MANIFEST = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";

const InstancesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);

  // Create / edit instance
  const [editing, setEditing] = useState<Instance | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", mc_version: "1.21.4", loader: "fabric" });
  const [includePixieMod, setIncludePixieMod] = useState(true);

  // Mod manager
  const [managingId, setManagingId] = useState<string | null>(null);
  const managing = instances.find(i => i.id === managingId) ?? null;

  // Mod picker
  const [pickerFor, setPickerFor] = useState<{ instanceId: string; replaceModId?: string } | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ModrinthHit[]>([]);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("instances").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    setLoading(false);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setInstances((data ?? []).map(d => ({ ...d, mods: (d.mods as ModInInstance[]) ?? [] })));
  };

  const loadVersions = async () => {
    try {
      const res = await fetch(MOJANG_MANIFEST);
      const data = await res.json();
      const list = data.versions
        .filter((v: any) => v.type === 'release')
        .map((v: any) => v.id);
      setVersions(list);
    } catch (e) {
      setVersions(["1.21.4", "1.21.1", "1.20.1", "1.16.5", "1.12.2"]);
    }
  };

  useEffect(() => {
    void load();
    void loadVersions();
    /* eslint-disable-next-line */
  }, [user]);

  useEffect(() => {
    if (!pickerFor) return;
    const t = setTimeout(() => {
      setSearching(true);
      searchMods({ query: search, limit: 12 }).then(d => setResults(d.hits)).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, pickerFor]);

  const openCreate = () => {
    setForm({ name: "", description: "", mc_version: "1.21.4", loader: "fabric" });
    setEditing(null);
    setCreating(true);
    setIncludePixieMod(true);
  };

  const openEdit = (inst: Instance) => {
    setForm({ name: inst.name, description: inst.description ?? "", mc_version: inst.mc_version, loader: inst.loader });
    setEditing(inst);
    setCreating(true);
    setIncludePixieMod(inst.mods?.some(m => m.id === 'pixie-heart-wishes' || m.id === 'pixie:pixie-heart-wishes') ?? false);
  };

  const saveInstance = async () => {
    if (!user) return;
    if (!form.name.trim()) return toast({ title: "Введи имя сборки" });
    if (editing) {
      const { error } = await supabase.from("instances").update(form).eq("id", editing.id);
      if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      toast({ title: "Сборка обновлена" });
    } else {
      const baseMods: ModInInstance[] = [];
      const mods = includePixieMod
        ? [
            ...baseMods,
            { id: "pixie-heart-wishes", slug: "pixie-heart-wishes", name: "Pixie Heart Wishes", icon: null } as ModInInstance,
          ]
        : baseMods;
      const { error } = await supabase.from("instances").insert({ ...form, user_id: user.id, mods });
      if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      toast({ title: "Сборка создана" });
    }
    setCreating(false);
    void load();
  };

  const deleteInstance = async (id: string) => {
    if (!confirm("Удалить сборку?")) return;
    const { error } = await supabase.from("instances").delete().eq("id", id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    toast({ title: "Удалено" });
    void load();
  };

  const importLocalMrpack = async () => {
    if (!user) return toast({ title: "Войди, чтобы импортировать сборку" });
    const electron = (window as any).electronAPI;
    if (!electron?.pickFile) {
      return toast({
        title: "Только в десктопной версии",
        description: "Импорт .mrpack работает в .exe PixieClient",
        variant: "destructive",
      });
    }

    const picked = await electron.pickFile({
      title: "Выберите .mrpack сборку",
      filters: [{ name: "Modrinth модпак", extensions: ["mrpack"] }],
    });
    if (!picked.ok) {
      if (picked.canceled) return;
      return toast({ title: "Ошибка", description: picked.error, variant: "destructive" });
    }

    // Имя сборки = имя файла без расширения
    const fileName = picked.filePath.split(/[\\/]/).pop() || "Импортированная сборка";
    const name = fileName.replace(/\.mrpack$/i, "").replace(/[-_]/g, " ");

    // Создаём заготовку в БД
    const { data: created, error: insErr } = await supabase
      .from("instances")
      .insert({ name, user_id: user.id, mc_version: "1.20.1", loader: "fabric", mods: [] })
      .select()
      .single();
    if (insErr || !created) return toast({ title: "Ошибка", description: insErr?.message, variant: "destructive" });

    toast({ title: "Установка сборки…", description: "Загружаем моды из .mrpack" });
    const res = await electron.installLocalMrpack({
      instanceId: created.id,
      filePath: picked.filePath,
      instanceName: name,
    });
    if (!res.ok) {
      await supabase.from("instances").delete().eq("id", created.id);
      return toast({ title: "Не удалось установить", description: res.error, variant: "destructive" });
    }

    await supabase.from("instances").update({
      mods: res.mods,
      mc_version: res.mc_version || created.mc_version,
      loader: res.loader || created.loader,
    }).eq("id", created.id);

    toast({ title: "Сборка импортирована", description: res.message });
    void load();
  };

  const updateMods = async (instanceId: string, mods: ModInInstance[]) => {
    const { error } = await supabase.from("instances").update({ mods: mods as any }).eq("id", instanceId);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    setInstances(prev => prev.map(i => i.id === instanceId ? { ...i, mods } : i));
  };

  const addMod = async (mod: ModrinthHit) => {
    if (!pickerFor) return;
    const inst = instances.find(i => i.id === pickerFor.instanceId);
    if (!inst) return;
    const newMod: ModInInstance = { id: mod.project_id, slug: mod.slug, name: mod.title, icon: mod.icon_url };
    let next: ModInInstance[];
    if (pickerFor.replaceModId) {
      next = inst.mods.map(m => m.id === pickerFor.replaceModId ? newMod : m);
      toast({ title: "Мод заменён", description: mod.title });
    } else {
      if (inst.mods.some(m => m.id === newMod.id)) return toast({ title: "Уже добавлен" });
      next = [...inst.mods, newMod];
      toast({ title: "Мод добавлен", description: mod.title });
    }
    await updateMods(inst.id, next);
    setPickerFor(null);
    setSearch("");
  };

  const removeMod = async (instanceId: string, modId: string) => {
    const inst = instances.find(i => i.id === instanceId);
    if (!inst) return;
    await updateMods(instanceId, inst.mods.filter(m => m.id !== modId));
    toast({ title: "Мод удалён" });
  };

  if (authLoading) return <Layout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl gradient-primary mx-auto mb-6 flex items-center justify-center glow-shadow">
            <Layers className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-3xl mb-3">Войди, чтобы создавать сборки</h1>
          <p className="text-muted-foreground mb-6">Сборки сохраняются в облаке Pixiestape.</p>
          <Button variant="hero" size="lg" onClick={() => setAuthOpen(true)}>
            <LogIn className="w-4 h-4 mr-1" />Войти
          </Button>
          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="flex items-end justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Твои сборки</h1>
          <p className="text-muted-foreground">Создавай сборки и управляй модами как в Modrinth.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={importLocalMrpack}>
            <FileArchive className="w-4 h-4 mr-1" />Импорт .mrpack
          </Button>
          <Button variant="hero" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />Новая сборка
          </Button>
        </div>
      </header>

      {loading && <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

      {!loading && instances.length === 0 && (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border">
          <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">У тебя ещё нет сборок</p>
          <Button variant="hero" onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Создать первую</Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
        {instances.map(inst => (
          <article 
            key={inst.id} 
            className="group relative rounded-3xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden hover:border-primary/50 hover:bg-card/60 transition-all duration-300 flex flex-col"
          >
            {/* Banner/Header Area */}
            <div className="h-24 relative overflow-hidden">
               <div 
                 className="absolute inset-0 opacity-40 group-hover:scale-105 transition-transform duration-500"
                 style={{
                   background: inst.icon_url
                     ? `url(${inst.icon_url}) center/cover`
                     : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.5))",
                 }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/40 to-transparent" />
            </div>

            <div className="p-6 pt-0 -mt-8 relative flex-1 flex flex-col">
              <div className="flex items-start gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-2xl border-4 border-card bg-card shadow-lg shrink-0 overflow-hidden"
                  style={{
                    background: inst.icon_url
                      ? `url(${inst.icon_url}) center/cover`
                      : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent, var(--primary))))",
                  }}
                >
                  {!inst.icon_url && (
                    <div className="w-full h-full flex items-center justify-center font-display font-bold text-xl text-primary-foreground">
                      {inst.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="min-w-0 flex-1 pt-8">
                  <h3 className="font-display font-bold text-xl truncate group-hover:text-primary transition-colors leading-tight">{inst.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5 uppercase bg-primary/10 text-primary border-none">
                      {inst.loader}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">{inst.mc_version}</span>
                  </div>
                </div>
              </div>

              {inst.description && (
                <p className="text-xs text-muted-foreground mb-6 line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {inst.description}
                </p>
              )}

              <div className="mt-auto space-y-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> {inst.mods.length} проектов</span>
                  <span className="flex items-center gap-1.5 font-mono"><Calendar className="w-3.5 h-3.5" /> {new Date().toLocaleDateString("ru")}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <LaunchMinecraftButton
                    version={inst.mc_version}
                    loader={inst.loader}
                    instanceId={inst.id}
                    mods={inst.mods}
                    label="Играть"
                    size="sm"
                    variant="hero"
                    className="rounded-xl font-bold h-9"
                  />
                  <Button variant="outline" size="sm" asChild className="rounded-xl h-9">
                    <Link to={`/instances/${inst.id}`}>
                      Открыть
                    </Link>
                  </Button>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(inst)} className="flex-1 h-8 text-[11px] rounded-lg">
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Настройки
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteInstance(inst.id)} className="flex-1 h-8 text-[11px] rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Удалить
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Create/edit instance */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Редактировать" : "Новая сборка"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Название</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Better Vanilla+" /></div>
            <div><Label>Описание</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Сборка для выживания" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Версия MC</Label>
                <Select value={form.mc_version} onValueChange={v => setForm({ ...form, mc_version: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-80">
                    {versions.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    {!versions.includes(form.mc_version) && <SelectItem value={form.mc_version}>{form.mc_version}</SelectItem>}
                  </SelectContent>
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
            {!editing && (
              <label className="flex items-center gap-2 text-sm select-none">
                <input
                  type="checkbox"
                  checked={includePixieMod}
                  onChange={(e) => setIncludePixieMod(e.target.checked)}
                />
                <span>Добавить мод <span className="font-medium">Pixie Heart Wishes</span> в эту сборку</span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Отмена</Button>
            <Button variant="hero" onClick={saveInstance}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mod manager */}
      <Dialog open={!!managingId} onOpenChange={(v) => !v && setManagingId(null)}>
        <DialogContent className="max-w-2xl">
          {managing && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{managing.name} — моды</DialogTitle>
              </DialogHeader>
              <Button variant="hero" onClick={() => setPickerFor({ instanceId: managing.id })}>
                <Plus className="w-4 h-4 mr-1" />Добавить мод
              </Button>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {managing.mods.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Пока нет модов</p>}
                {managing.mods.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/20">
                    <div className="w-10 h-10 rounded bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                      {m.icon ? <img src={m.icon} alt={m.name} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="font-medium text-sm truncate flex-1">{m.name}</div>
                    <Button variant="ghost" size="sm" onClick={() => setPickerFor({ instanceId: managing.id, replaceModId: m.id })} title="Заменить">
                      <Replace className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeMod(managing.id, m.id)} className="text-destructive" title="Удалить">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Mod picker */}
      <Dialog open={!!pickerFor} onOpenChange={(v) => { if (!v) { setPickerFor(null); setSearch(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{pickerFor?.replaceModId ? "Заменить мод" : "Добавить мод"}</DialogTitle></DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск модов…" autoFocus className="pl-9" />
          </div>
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

export default InstancesPage;
