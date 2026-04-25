import { useEffect, useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Server, Copy, Globe, Check, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type NameMcServer = {
  rank: number;
  name: string;
  address: string;
  votes: number;
  icon?: string;
  motd?: string;
};

const Servers = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<NameMcServer | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [servers, setServers] = useState<NameMcServer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase.functions
      .invoke("namemc", { method: "GET", body: undefined as any })
      // edge fn parses query params, so we need explicit URL — fall back to fetch:
      .then(() => {})
      .catch(() => {});

    // Direct fetch with query params (functions.invoke doesn't pass them well)
    const url = `https://iykuoicwycnmhkygqeqb.supabase.co/functions/v1/namemc?action=servers`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setServers(d.servers ?? []);
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Не удалось загрузить серверы", variant: "destructive" });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const filtered = servers.filter((s) => {
    const q = query.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
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
        <p className="text-muted-foreground">
          Топ серверов с NameMC — обновляется автоматически. Кликни IP, чтобы скопировать.
        </p>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени или IP"
          className="h-12 pl-11 rounded-xl bg-secondary/60"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Загружаем топ серверов с NameMC…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
          {filtered.map((s) => (
            <article
              key={s.address}
              className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all"
            >
              <div className="p-5 flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {s.icon ? (
                    <img
                      src={s.icon.startsWith("http") ? s.icon : `https:${s.icon}`}
                      alt={s.name}
                      className="w-12 h-12 object-contain"
                      style={{ imageRendering: "pixelated" }}
                      loading="lazy"
                      onError={(e) => ((e.currentTarget.style.display = "none"))}
                    />
                  ) : (
                    <Server className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      #{s.rank}
                    </Badge>
                    <h3 className="font-display font-bold text-lg leading-tight truncate">{s.name}</h3>
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
              {s.motd && <p className="px-5 text-xs text-muted-foreground line-clamp-2 mb-3">{s.motd}</p>}
              <div className="px-5 pb-4 flex items-center justify-end">
                <Button size="sm" variant="play" onClick={() => setOpen(s)}>
                  Подробнее
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
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
                    {open.icon ? (
                      <img
                        src={open.icon.startsWith("http") ? open.icon : `https:${open.icon}`}
                        alt={open.name}
                        className="w-10 h-10 object-contain"
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      <Server className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <DialogTitle className="font-display text-2xl">{open.name}</DialogTitle>
                </div>
              </DialogHeader>
              {open.motd && <p className="text-sm text-muted-foreground">{open.motd}</p>}
              <div className="space-y-2 pt-2">
                <Row label="IP" value={open.address} copyable onCopy={() => copy(open.address)} copied={copied === open.address} />
                <Row label="Топ" value={`#${open.rank} на NameMC`} />
                <Row label="NameMC" value="Открыть страницу" link={`https://namemc.com/server/${open.address}`} />
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

const Row = ({
  label,
  value,
  copyable,
  link,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  link?: string;
  onCopy?: () => void;
  copied?: boolean;
}) => (
  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
    <span className="text-xs text-muted-foreground">{label}</span>
    {link ? (
      <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-mono flex items-center gap-1 hover:underline">
        <ExternalLink className="w-3 h-3" />
        {value}
      </a>
    ) : copyable ? (
      <button onClick={onCopy} className="text-sm font-mono text-primary flex items-center gap-1">
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {value}
      </button>
    ) : (
      <span className="text-sm font-mono">{value}</span>
    )}
  </div>
);

export default Servers;
