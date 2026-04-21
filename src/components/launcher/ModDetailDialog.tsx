import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, ExternalLink, Loader2, Heart, Calendar, User, Tag, FileBox } from "lucide-react";
import { type ModrinthHit, getProject, getProjectVersions, downloadFile, modrinthUrl, type ModrinthProject, type ModrinthVersion } from "@/lib/modrinth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  mod: ModrinthHit | null;
  onOpenChange: (v: boolean) => void;
};

const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);

export const ModDetailDialog = ({ mod, onOpenChange }: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [project, setProject] = useState<ModrinthProject | null>(null);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mod) { setProject(null); setVersions([]); return; }
    setLoading(true);
    Promise.all([getProject(mod.project_id), getProjectVersions(mod.project_id)])
      .then(([p, v]) => { setProject(p); setVersions(v); })
      .catch((e) => toast({ title: "Не удалось загрузить", description: String(e), variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [mod, toast]);

  const handleDownload = (v: ModrinthVersion) => {
    const file = v.files.find(f => f.primary) ?? v.files[0];
    if (!file) return toast({ title: "Файл недоступен" });
    downloadFile(file);
    toast({ title: "Скачивание началось", description: file.filename });
  };

  const setFavorite = async () => {
    if (!user || !mod) {
      toast({ title: "Нужен вход", description: "Войди, чтобы сохранить любимый мод" });
      return;
    }
    const { error } = await supabase.from("profiles").update({
      favorite_mod_id: mod.project_id,
      favorite_mod_name: mod.title,
      favorite_mod_icon: mod.icon_url ?? null,
    }).eq("id", user.id);
    if (error) return toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    toast({ title: "Сохранено", description: `${mod.title} — твой любимый мод` });
  };

  return (
    <Dialog open={!!mod} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {mod && (
          <>
            <DialogHeader className="p-6 pb-4 border-b border-border">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {mod.icon_url
                    ? <img src={mod.icon_url} alt={mod.title} className="w-full h-full object-cover" loading="lazy" />
                    : <FileBox className="w-8 h-8 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="font-display text-2xl mb-1 truncate">{mod.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">{mod.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{mod.author}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{formatNumber(mod.downloads)}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(mod.follows)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {(mod.display_categories ?? mod.categories).slice(0, 6).map(c => (
                  <Badge key={c} variant="secondary" className="text-xs"><Tag className="w-3 h-3 mr-1" />{c}</Badge>
                ))}
              </div>
            </DialogHeader>

            <Tabs defaultValue="versions" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="mx-6 mt-4 self-start">
                <TabsTrigger value="versions">Скачать ({versions.length})</TabsTrigger>
                <TabsTrigger value="description">Описание</TabsTrigger>
                <TabsTrigger value="links">Ссылки</TabsTrigger>
              </TabsList>

              <TabsContent value="versions" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[45vh] px-6">
                  {loading && <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
                  <div className="space-y-2 pb-4">
                    {versions.map(v => {
                      const file = v.files.find(f => f.primary) ?? v.files[0];
                      return (
                        <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/60 hover:border-primary/40 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{v.version_number}</span>
                              <Badge variant={v.version_type === "release" ? "default" : "secondary"} className="text-[10px]">{v.version_type}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(v.date_published).toLocaleDateString("ru")}</span>
                              <span>{v.game_versions.slice(0, 3).join(", ")}{v.game_versions.length > 3 ? "…" : ""}</span>
                              <span>{v.loaders.join(", ")}</span>
                            </div>
                          </div>
                          <Button size="sm" variant="hero" onClick={() => handleDownload(v)} disabled={!file}>
                            <Download className="w-4 h-4 mr-1" />
                            {file ? `${(file.size / 1024 / 1024).toFixed(1)} МБ` : "—"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="description" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[45vh] px-6">
                  {loading && <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto my-10" />}
                  {project && (
                    <article className="prose prose-invert prose-sm max-w-none pb-6 prose-headings:font-display prose-a:text-primary">
                      <div dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(project.body) }} />
                    </article>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="links" className="px-6 mt-4 space-y-2 pb-6">
                <LinkRow label="На Modrinth" url={modrinthUrl(mod.slug, mod.project_type)} />
                {project?.source_url && <LinkRow label="Исходники" url={project.source_url} />}
                {project?.issues_url && <LinkRow label="Баги / Issues" url={project.issues_url} />}
                {project?.wiki_url && <LinkRow label="Wiki" url={project.wiki_url} />}
                {project?.discord_url && <LinkRow label="Discord" url={project.discord_url} />}
              </TabsContent>
            </Tabs>

            <div className="p-4 border-t border-border flex gap-2">
              <Button variant="outline" onClick={setFavorite} className="flex-1">
                <Heart className="w-4 h-4 mr-1" />
                В любимые
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <a href={modrinthUrl(mod.slug, mod.project_type)} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Открыть Modrinth
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const LinkRow = ({ label, url }: { label: string; url: string }) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 transition-colors text-sm">
    <span className="font-medium">{label}</span>
    <ExternalLink className="w-4 h-4 text-muted-foreground" />
  </a>
);

// Tiny safe markdown renderer — escapes HTML, then converts a subset
function markdownToSafeHtml(md: string): string {
  const esc = (s: string) => s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]!));
  let html = esc(md);
  html = html.replace(/!\[([^\]]*)\]\((https?:[^)]+)\)/g, '<img alt="$1" src="$2" loading="lazy" style="max-width:100%;border-radius:8px;margin:8px 0" />');
  html = html.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\n\n+/g, "</p><p>");
  return `<p>${html}</p>`;
}
