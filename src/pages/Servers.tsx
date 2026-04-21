import { useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Server, Copy, Globe, Users, Check } from "lucide-react";
import { SERVERS, SERVER_CATEGORIES, serverIconUrl, type ServerEntry } from "@/lib/servers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const Servers = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [open, setOpen] = useState<ServerEntry | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = SERVERS.filter(s => {
    const matchCat = category === "all" || s.category === category;
    const q = query.trim().toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || s.tags.some(t => t.includes(q));
    return matchCat && matchQ;
  });

  const copy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    toast({ title: "IP скопирован", description: addr });
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Layout>
      <header className="mb-6 animate-fade-in">
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Серверы Minecraft</h1>
        <p className="text-muted-foreground">{SERVERS.length}+ топовых серверов. Кликни IP, чтобы скопировать.</p>
      </header>

      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по имени или IP" className="h-12 pl-11 rounded-xl bg-secondary/60" />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {SERVER_CATEGORIES.map(c => (
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
        {filtered.map(s => (
          <article
            key={s.id}
            className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all"
          >
            <div className="p-5 flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={serverIconUrl(s.website)}
                  alt={s.name}
                  className="w-12 h-12 object-contain"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget.style.display = "none"); }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-display font-bold text-lg leading-tight truncate">{s.name}</h3>
                  {s.players && <Badge variant="secondary" className="text-[10px] shrink-0"><Users className="w-3 h-3 mr-1" />{s.players}</Badge>}
                </div>
                <button
                  onClick={() => copy(s.address)}
                  className="flex items-center gap-1.5 text-xs font-mono text-primary hover:text-primary-glow transition-colors"
                >
                  {copied === s.address ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {s.address}
                </button>
              </div>
            </div>
            <p className="px-5 text-xs text-muted-foreground line-clamp-2 mb-3">{s.description}</p>
            <div className="px-5 pb-4 flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                {s.tags.slice(0, 2).map(t => (
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
                <Badge variant="outline" className="text-[10px]">{s.version}</Badge>
              </div>
              <Button size="sm" variant="play" onClick={() => setOpen(s)}>
                Подробнее
              </Button>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Server className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Серверы не найдены
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          {open && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden">
                    <img src={serverIconUrl(open.website)} alt={open.name} className="w-10 h-10 object-contain" />
                  </div>
                  <DialogTitle className="font-display text-2xl">{open.name}</DialogTitle>
                </div>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{open.description}</p>
              <div className="space-y-2 pt-2">
                <Row label="IP" value={open.address} copyable onCopy={() => copy(open.address)} copied={copied === open.address} />
                <Row label="Версия" value={open.version} />
                <Row label="Сайт" value={open.website} link={`https://${open.website}`} />
                {open.players && <Row label="Онлайн" value={open.players} />}
              </div>
              <Button variant="hero" className="w-full mt-2" onClick={() => copy(open.address)}>
                {copied === open.address ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                Скопировать IP
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

const Row = ({ label, value, copyable, link, onCopy, copied }: { label: string; value: string; copyable?: boolean; link?: string; onCopy?: () => void; copied?: boolean }) => (
  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
    <span className="text-xs text-muted-foreground">{label}</span>
    {link ? (
      <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-mono flex items-center gap-1 hover:underline">
        <Globe className="w-3 h-3" />{value}
      </a>
    ) : copyable ? (
      <button onClick={onCopy} className="text-sm font-mono text-primary flex items-center gap-1">
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{value}
      </button>
    ) : (
      <span className="text-sm font-mono">{value}</span>
    )}
  </div>
);

export default Servers;
