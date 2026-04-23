import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Terminal, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLaunchPrefs } from "@/lib/launchSettings";

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      launchMinecraft: (opts: {
        username?: string;
        uuid?: string;
        accountType?: "offline" | "microsoft";
        version?: string;
        loader?: string;
        loaderVersion?: string;
        instanceId?: string;
        ramGb?: number;
        mods?: Array<{ id: string; name: string; slug?: string; source?: string }>;
      }) => Promise<{ ok: boolean; error?: string; message?: string; modsCount?: number }>;
      installMrpack: (opts: {
        url: string;
        instanceId: string;
        instanceName: string;
      }) => Promise<{ ok: boolean; error?: string; message?: string; mc_version?: string; loader?: string; loader_version?: string; mods?: Array<{ id: string; name: string; slug: string; icon: string | null; file?: string; source?: string }> }>;
      downloadMod: (opts: { instanceId: string; projectId: string; slug?: string; mcVersion?: string; loader?: string }) => Promise<{ ok: boolean; error?: string; filename?: string }>;
      onLaunchLog: (cb: (msg: string) => void) => () => void;
      onSessionEnded: (cb: (data: { instanceId: string | null; seconds: number }) => void) => () => void;
    };
  }
}

export const LaunchMinecraftButton = ({
  version = "1.21.4",
  loader = "vanilla",
  loaderVersion,
  instanceId,
  mods,
  username: usernameProp,
  label = "Запустить Minecraft",
  size = "default" as "default" | "sm" | "lg",
  variant = "default" as "default" | "hero" | "play" | "outline",
  className,
}: {
  version?: string;
  loader?: string;
  loaderVersion?: string;
  instanceId?: string;
  mods?: Array<{ id: string; name: string; slug?: string; source?: string }>;
  username?: string;
  label?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "hero" | "play" | "outline";
  className?: string;
}) => {
  const [launching, setLaunching] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const { prefs } = useLaunchPrefs();
  const username = usernameProp || prefs.username;

  useEffect(() => {
    if (!window.electronAPI) return;
    const off = window.electronAPI.onLaunchLog((msg) => {
      setLogs((prev) => [...prev.slice(-300), msg]);
    });
    return off;
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const onClick = async () => {
    if (!window.electronAPI?.isElectron) {
      toast({
        title: "Доступно только в .exe",
        description: "Запуск Minecraft работает в десктопной версии лаунчера, в браузере — нет.",
        variant: "destructive",
      });
      return;
    }
    setLaunching(true);
    setOpen(true);
    setLogs([`▶ Запрос: ${username} • Minecraft ${version} • ${loader}${loaderVersion ? ` ${loaderVersion}` : ""}`]);
    try {
      const res = await window.electronAPI.launchMinecraft({
        username,
        uuid: prefs.uuid,
        accountType: prefs.accountType,
        version,
        loader,
        loaderVersion,
        instanceId,
        ramGb: prefs.ramGb,
        mods,
      });
      if (!res.ok) {
        toast({ title: "Не удалось запустить", description: res.error, variant: "destructive" });
      } else {
        toast({ title: "Запуск", description: res.message ?? "Minecraft стартует…" });
      }
    } catch (e) {
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <>
      <Button onClick={onClick} disabled={launching} size={size} variant={variant} className={`gap-2 ${className ?? ""}`}>
        {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {label}
      </Button>

      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[480px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Лог запуска</span>
            <span className="text-xs text-muted-foreground ml-2 truncate">{username} • {version} • {loader}</span>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto p-1 rounded hover:bg-accent"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div ref={logRef} className="max-h-64 overflow-y-auto p-3 text-xs font-mono bg-background/50">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">Ожидание…</div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="whitespace-pre-wrap break-all leading-relaxed">{l}</div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};
