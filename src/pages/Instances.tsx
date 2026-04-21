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
import { Plus, Play, Trash2, Pencil, Package, Loader2, LogIn, Search, X, Replace, Layers } from "lucide-react";
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

const VERSIONS = ["1.21.1", "1.21", "1.20.4", "1.20.1", "1.19.4", "1.19.2", "1.18.2", "1.16.5"];
const LOADERS = ["fabric", "forge", "neoforge", "quilt"];

const InstancesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  // Create / edit instance
  const [editing, setEditing] = useState<Instance | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", mc_version: "1.21.1", loader: "fabric" });

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

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [user]);

  useEffect(() => {
    if (!pickerFor) return;
    const t = setTimeout(() => {
      setSearching(true);
      searchMods({ query: search, limit: 12 }).then(d => setResults(d.hits)).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, pickerFor]);

  const openCreate = () => {
    setForm({ name: "", description: "", mc_version: "1.21.1", loader: "fabric" });
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (inst: Instance) => {
    setForm({ name: inst.name, description: inst.description ?? "", mc_version: inst.mc_version, loader: inst.loader });
    setEditing(inst);
    setCreating(true);
  };

  const saveInstance = async () => {
    if (!user) return;
    if (!form.name.trim()) return toast({ title: "Введи имя сборки" });
    if (editing) {
      const { error } = await supabase.from("instances").update(form).eq("id", editing.id);
      if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      toast({ title: "Сборка обновлена" });
    } else {
      const { error } = await supabase.from("instances").insert({ ...form, user_id: user.id, mods: [] });
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
        <div className="flex gap-2">
          <LaunchMinecraftButton version="1.20.1" username="PixieTester" label="Тест запуска MC" />
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
        {instances.map(inst => (
          <article key={inst.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-bold text-lg truncate flex-1">{inst.name}</h3>
                <Badge variant="secondary" className="ml-2 shrink-0">{inst.mods.length} модов</Badge>
              </div>
              {inst.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{inst.description}</p>}
              <div className="flex gap-2 mb-4">
                <Badge variant="outline" className="text-[10px] uppercase">{inst.loader}</Badge>
                <Badge variant="outline" className="text-[10px]">{inst.mc_version}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <LaunchMinecraftButton
                  version={inst.mc_version}
                  username="PixieTester"
                  label="Играть"
                  size="sm"
                />
                <Button variant="outline" size="sm" onClick={() => setManagingId(inst.id)}>
                  <Package className="w-4 h-4 mr-1" />Моды
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(inst)}>
                  <Pencil className="w-4 h-4 mr-1" />Изменить
                </Button>
                <Button variant="outline" size="sm" onClick={() => deleteInstance(inst.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-1" />Удалить
                </Button>
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
