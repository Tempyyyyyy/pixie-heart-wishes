import { useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Download, Shirt, ExternalLink } from "lucide-react";
import { SKINS, SKIN_CATEGORIES, skinBodyUrl, skinHeadUrl, skinRawUrl, type SkinPreset } from "@/lib/skins";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const Skins = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [open, setOpen] = useState<SkinPreset | null>(null);

  const filtered = SKINS.filter(s => {
    const matchCat = category === "all" || s.category === category;
    const q = query.trim().toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q) || s.tags.some(t => t.includes(q));
    return matchCat && matchQ;
  });

  const download = (skin: SkinPreset) => {
    const a = document.createElement("a");
    a.href = skinRawUrl(skin.username);
    a.download = `${skin.username}.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast({ title: "Скин скачивается", description: skin.name });
  };

  return (
    <Layout>
      <header className="mb-6 animate-fade-in">
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Каталог скинов</h1>
        <p className="text-muted-foreground">{SKINS.length} топовых скинов. Кликни, чтобы посмотреть и скачать.</p>
      </header>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по нику или имени" className="h-12 pl-11 rounded-xl bg-secondary/60" />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {SKIN_CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "px-4 h-9 rounded-full text-xs font-semibold border transition-all",
              category === c.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-6">
        {filtered.map(skin => (
          <button
            key={skin.id}
            onClick={() => setOpen(skin)}
            className="group rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:-translate-y-1 transition-all flex flex-col items-center"
          >
            <div className="aspect-[3/5] w-full flex items-center justify-center mb-3 bg-gradient-to-b from-secondary/40 to-transparent rounded-xl overflow-hidden">
              <img
                src={skinBodyUrl(skin.username, 6)}
                alt={skin.name}
                className="h-full object-contain group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
                style={{ imageRendering: "pixelated" }}
                onError={(e) => {
                  e.currentTarget.src = `https://mc-heads.net/body/MHF_Steve/384`;
                }}
              />
            </div>
            <div className="font-display font-bold text-sm truncate w-full text-center group-hover:text-primary transition-colors">{skin.name}</div>
            <div className="text-[10px] text-muted-foreground truncate w-full text-center">{skin.username}</div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Shirt className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Скины не найдены
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{open.name}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center py-4 bg-gradient-to-b from-primary/10 to-transparent rounded-xl">
                <img
                  src={skinBodyUrl(open.username, 10)}
                  alt={open.name}
                  className="h-72 object-contain"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <img src={skinHeadUrl(open.username)} alt="" className="w-10 h-10 rounded" style={{ imageRendering: "pixelated" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Никнейм</div>
                  <div className="font-mono text-sm truncate">{open.username}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {open.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="hero" className="flex-1" onClick={() => download(open)}>
                  <Download className="w-4 h-4 mr-1" />Скачать .png
                </Button>
                <Button variant="outline" asChild>
                  <a href={`https://namemc.com/profile/${open.username}`} target="_blank" rel="noopener noreferrer">
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
