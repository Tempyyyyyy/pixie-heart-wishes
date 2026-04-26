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
  Replace, X, Users, Download as DownloadIcon, Calendar, FileBox, Camera, Upload, FileArchive,
} from "lucide-react";
import { type ModrinthHit, type ProjectType, searchProjects } from "@/lib/modrinth";
import { ModrinthBrowser } from "@/components/launcher/ModrinthBrowser";
import { LaunchMinecraftButton } from "@/components/launcher/LaunchMinecraftButton";

type ModInInstance = { id: string; name: string; icon: string | null; slug: string; source?: string };
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

const LOADERS = ["fabric", "forge", "neoforge", "quilt", "vanilla"];

const MOJANG_MANIFEST = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";

const InstanceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const bannerRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [versions, setVersions] = useState<string[]>([]);
  const modFileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Edit dialog
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", mc_version: "1.21.4", loader: "fabric" });

  // Mod picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceModId, setReplaceModId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ModrinthHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [browserType, setBrowserType] = useState<ProjectType>("mod");

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
  }, [id]);

  useEffect(() => {
    if (!pickerOpen) return;
    const t = setTimeout(() => {
      setSearching(true);
      searchProjects({ query: search, projectType: browserType, limit: 12, loader: instance?.loader })
        .then(d => setResults(d.hits))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, pickerOpen, instance?.loader, browserType]);

  useEffect(() => {
    const electron = (window as any).electronAPI;
    if (!electron) return;
    return electron.onLaunchLog((msg: string) => {
      setLogs(prev => [...prev.slice(-200), msg]);
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

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

  const onIconFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !instance) return;
    if (file.size > 2 * 1024 * 1024) return toast({ title: "Файл больше 2 МБ", variant: "destructive" });
    setUploadingIcon(true);
    const path = `${user.id}/icon-${instance.id}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("banners").upload(path, file, { upsert: true });
    if (upErr) { setUploadingIcon(false); return toast({ title: "Ошибка загрузки", description: upErr.message, variant: "destructive" }); }
    const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
    const { error: dbErr } = await supabase.from("instances").update({ icon_url: publicUrl }).eq("id", instance.id);
    setUploadingIcon(false);
    if (dbErr) return toast({ title: "Ошибка", description: dbErr.message, variant: "destructive" });
    setInstance(p => p ? { ...p, icon_url: publicUrl } : p);
    toast({ title: "Иконка обновлена" });
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
    const newMod: ModInInstance = {
      id: mod.project_id,
      slug: mod.slug,
      name: mod.title,
      icon: mod.icon_url,
      source: mod.project_type,
    };
    let next: ModInInstance[];
    if (replaceModId) {
      next = instance.mods.map(m => m.id === replaceModId ? newMod : m);
    } else {
      if (instance.mods.some(m => m.id === newMod.id)) return toast({ title: "Уже добавлен" });
      next = [...instance.mods, newMod];
    }

    // Физически скачиваем файл в правильную папку (mods/resourcepacks/shaderpacks)
    const electron = (window as any).electronAPI;
    if (electron?.downloadMod) {
      toast({ title: "Загрузка…", description: mod.title });
      const res = await electron.downloadMod({
        instanceId: instance.id,
        projectId: mod.project_id,
        slug: mod.slug,
        mcVersion: instance.mc_version,
        loader: instance.loader,
        projectType: mod.project_type,
      });
      if (!res.ok) {
        return toast({ title: "Не удалось скачать", description: res.error, variant: "destructive" });
      }
      toast({ title: replaceModId ? "Заменено" : "Установлено", description: `${mod.title} → ${res.folder}/` });
    } else {
      toast({ title: replaceModId ? "Заменено" : "Добавлено в список", description: "В десктопной версии файл скачается в папку игры" });
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

  const onUploadMod = async (kind: "mod" | "resourcepack" | "shader") => {
    if (!instance) return;
    const electron = (window as any).electronAPI;
    if (!electron?.pickFile) return toast({ title: "Только в десктопной версии" });

    const filters = kind === "mod"
      ? [{ name: "Моды (.jar)", extensions: ["jar"] }]
      : [{ name: "Архивы (.zip)", extensions: ["zip"] }];

    const picked = await electron.pickFile({ title: "Выберите файл", filters });
    if (!picked.ok) {
      if (picked.canceled) return;
      return toast({ title: "Ошибка выбора файла", description: picked.error, variant: "destructive" });
    }

    const res = await electron.uploadModFile({ instanceId: instance.id, filePath: picked.filePath, kind });
    if (!res.ok) return toast({ title: "Ошибка", description: res.error, variant: "destructive" });

    const newMod: ModInInstance = {
      id: `local:${Date.now()}`,
      name: res.name,
      icon: null,
      slug: res.filename,
      source: kind,
    };
    await updateMods([...instance.mods, newMod]);
    toast({ title: "Файл загружен", description: `${res.name} → ${res.folder}/` });
  };

  const onImportMrpack = async () => {
    if (!instance) return;
    const electron = (window as any).electronAPI;
    if (!electron?.pickFile) return toast({ title: "Только в десктопной версии" });

    const picked = await electron.pickFile({
      title: "Выберите .mrpack",
      filters: [{ name: "Modrinth модпак", extensions: ["mrpack"] }],
    });
    if (!picked.ok) {
      if (picked.canceled) return;
      return toast({ title: "Ошибка", description: picked.error, variant: "destructive" });
    }

    toast({ title: "Установка сборки…", description: "Загружаем моды из .mrpack" });
    const res = await electron.installLocalMrpack({
      instanceId: instance.id,
      filePath: picked.filePath,
      instanceName: instance.name,
    });
    if (!res.ok) return toast({ title: "Не удалось установить", description: res.error, variant: "destructive" });

    // Обновляем инстанс с новой версией/лоадером и списком модов
    const update: any = { mods: res.mods };
    if (res.mc_version) update.mc_version = res.mc_version;
    if (res.loader) update.loader = res.loader;
    await supabase.from("instances").update(update).eq("id", instance.id);
    setInstance(p => p ? { ...p, mods: res.mods, mc_version: res.mc_version || p.mc_version, loader: res.loader || p.loader } : p);
    toast({ title: "Сборка установлена", description: res.message });
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

      {/* MODRINTH-STYLE HEADER */}
      <section className="relative rounded-3xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden mb-6 animate-fade-in">
        {/* Banner Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: instance.banner_url
              ? `url(${instance.banner_url}) center/cover`
              : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.5) 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-transparent" />

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Instance Icon */}
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border border-border/50 shadow-xl shrink-0 overflow-hidden relative group/icon cursor-pointer"
            style={{
              background: instance.icon_url
                ? `url(${instance.icon_url}) center/cover`
                : "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent, var(--primary))))",
            }}
            onClick={() => isOwner && iconRef.current?.click()}
          >
            {!instance.icon_url && (
              <div className="w-full h-full flex items-center justify-center font-display font-bold text-3xl text-primary-foreground">
                {instance.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            {isOwner && (
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/icon:opacity-100 transition-opacity flex items-center justify-center">
                 {uploadingIcon ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
               </div>
            )}
          </div>
          <input ref={iconRef} type="file" accept="image/*" className="hidden" onChange={onIconFile} />

          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-3xl md:text-4xl mb-2 truncate">{instance.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary font-medium">
                <Badge className="bg-transparent text-primary p-0 shadow-none border-none uppercase">{instance.loader}</Badge>
                <span className="w-1 h-1 rounded-full bg-primary/40" />
                <span>{instance.mc_version}</span>
              </div>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                Никогда не запускалось
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isOwner && (
              <>
                <LaunchMinecraftButton
                  version={instance.mc_version}
                  loader={instance.loader}
                  instanceId={instance.id}
                  mods={instance.mods}
                  label="Играть"
                  variant="hero"
                  size="lg"
                  className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
                />
                <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 rounded-xl" 
                  onClick={() => bannerRef.current?.click()}
                  disabled={uploadingBanner}
                >
                  {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                </Button>
                <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={onBannerFile} />
              </>
            )}
          </div>
        </div>
      </section>

      {/* NAVIGATION TABS */}
      <Tabs defaultValue="content" className="animate-fade-in">
        <div className="flex items-center gap-1 mb-6 bg-card/30 p-1 rounded-xl w-fit border border-border/50">
          <TabsList className="bg-transparent h-10">
            <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Контент
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Логи
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="content" className="space-y-6 focus-visible:outline-none">
          {/* TOOLBAR */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={`Поиск в ${instance.mods.length} проектах...`} 
                className="pl-10 bg-card/50 border-border/50 focus:border-primary/50 transition-all rounded-xl"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {isOwner && (
                <>
                  <Button variant="hero" onClick={() => { setReplaceModId(null); setBrowserType("mod"); setPickerOpen(true); }} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Обзор контента
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => onUploadMod("mod")} title="Загрузить .jar мод">
                    <Upload className="w-4 h-4 mr-2" />
                    Свой мод
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => onUploadMod("resourcepack")} title="Загрузить .zip ресурспак">
                    <Upload className="w-4 h-4 mr-2" />
                    Ресурспак
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => onUploadMod("shader")} title="Загрузить .zip шейдер">
                    <Upload className="w-4 h-4 mr-2" />
                    Шейдер
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={onImportMrpack} title="Импортировать .mrpack сборку">
                    <FileArchive className="w-4 h-4 mr-2" />
                    Импорт .mrpack
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* MOD LIST */}
          <div className="rounded-2xl border border-border overflow-hidden bg-card/30">
            <div className="grid grid-cols-[1fr_200px_100px] gap-4 px-6 py-3 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div>Проект</div>
              <div>Версия</div>
              <div className="text-right">Действия</div>
            </div>

            {instance.mods.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground mb-6">Эта сборка пока пуста</p>
                {isOwner && (
                  <Button variant="outline" onClick={() => setPickerOpen(true)} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />Добавить первый мод
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {instance.mods.map(m => (
                  <div key={m.id} className="grid grid-cols-[1fr_200px_100px] gap-4 items-center px-6 py-4 hover:bg-primary/5 transition-colors group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-secondary/50 border border-border/50 overflow-hidden flex items-center justify-center shrink-0 shadow-sm group-hover:border-primary/30 transition-colors">
                        {m.icon ? <img src={m.icon} alt={m.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">{m.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                           <span className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/50">Mod</span>
                           <span className="truncate">modrinth.com/mod/{m.slug}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm font-medium text-muted-foreground">
                      <span className="px-2 py-1 rounded-md bg-secondary/30 border border-border/50 font-mono text-[11px]">
                        Latest compatible
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      {isOwner && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" onClick={() => { setReplaceModId(m.id); setPickerOpen(true); }}>
                            <Replace className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive" onClick={() => removeMod(m.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4 focus-visible:outline-none h-[500px]">
          <div className="rounded-2xl border border-border bg-black/40 backdrop-blur-md p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
               <div className="flex items-center gap-2 text-sm font-medium">
                 <Calendar className="w-4 h-4 text-primary" />
                 Логи запуска
               </div>
               <Button variant="ghost" size="sm" onClick={() => setLogs([])} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                 Очистить
               </Button>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto font-mono text-[13px] leading-relaxed p-4 rounded-xl bg-black/20 border border-border/50 scrollbar-thin scrollbar-thumb-primary/20"
            >
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 opacity-50">
                   <Calendar className="w-12 h-12 mb-4" />
                   <p>История запусков и ошибки игры будут отображаться здесь.</p>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="mb-1 last:mb-0 break-words">
                    <span className="opacity-30 mr-3 select-none">{i + 1}</span>
                    <span className={log.includes('ERROR') || log.includes('Exception') ? 'text-red-400' : log.includes('WARN') ? 'text-yellow-400' : ''}>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Отмена</Button>
            <Button variant="hero" onClick={saveForm}><Save className="w-4 h-4 mr-1" />Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mod picker */}
      <Dialog open={pickerOpen} onOpenChange={(v) => { if (!v) { setPickerOpen(false); setReplaceModId(null); setSearch(""); } }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-display font-bold text-xl">{replaceModId ? "Заменить" : "Добавить контент"}</h2>
            <div className="flex gap-1 ml-auto">
              {(["mod", "resourcepack", "shader"] as const).map(t => (
                <Button 
                  key={t}
                  size="sm" 
                  variant={browserType === t ? "hero" : "outline"}
                  onClick={() => setBrowserType(t)}
                  className="rounded-full text-[10px] h-7 px-3 uppercase tracking-wider"
                >
                  {t === "mod" ? "Моды" : t === "resourcepack" ? "Ресурспаки" : "Шейдеры"}
                </Button>
              ))}
            </div>
          </div>
          
          <ModrinthBrowser 
            projectType={browserType}
            title="" 
            subtitle=""
            onSelectMod={addMod}
          />
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
