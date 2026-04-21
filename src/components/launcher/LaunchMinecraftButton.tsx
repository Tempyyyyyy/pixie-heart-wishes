import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Terminal, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      launchMinecraft: (opts: { username?: string; version?: string }) => Promise<{ ok: boolean; error?: string; message?: string }>;
      onLaunchLog: (cb: (msg: string) => void) => () => void;
    };
  }
}

export const LaunchMinecraftButton = ({
  version = "1.20.1",
  username = "PixieTester",
  label = "Запустить Minecraft",
  size = "default" as "default" | "sm" | "lg",
}: {
  version?: string;
  username?: string;
  label?: string;
  size?: "default" | "sm" | "lg";
}) => {
  const [launching, setLaunching] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

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
    setLogs([`▶ Запрос: ${username} • Minecraft ${version}`]);
    try {
      const res = await window.electronAPI.launchMinecraft({ username, version });
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
      <Button onClick={onClick} disabled={launching} size={size} className="gap-2">
        {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {label}
      </Button>

      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[480px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Лог запуска</span>
            <span className="text-xs text-muted-foreground ml-2">{username} • {version}</span>
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
