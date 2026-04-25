import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Loader2 } from "lucide-react";
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
      stopMinecraft: (instanceId: string) => Promise<{ ok: boolean; error?: string }>;
      installMrpack: (opts: {
        url: string;
        instanceId: string;
        instanceName: string;
      }) => Promise<{ ok: boolean; error?: string; message?: string; mc_version?: string; loader?: string; loader_version?: string; mods?: Array<{ id: string; name: string; slug: string; icon: string | null; file?: string; source?: string }> }>;
      installLocalMrpack: (opts: {
        instanceId: string;
        filePath: string;
        instanceName?: string;
      }) => Promise<{ ok: boolean; error?: string; message?: string; mc_version?: string; loader?: string; loader_version?: string; mods?: Array<{ id: string; name: string; slug: string; icon: string | null; file?: string; source?: string }> }>;
      pickFile: (opts?: { title?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<{ ok: boolean; canceled?: boolean; filePath?: string; error?: string }>;
      uploadModFile: (opts: { instanceId: string; filePath: string; kind?: "mod" | "resourcepack" | "shader" }) => Promise<{ ok: boolean; error?: string; filename?: string; name?: string; folder?: string }>;
      downloadMod: (opts: { instanceId: string; projectId: string; slug?: string; mcVersion?: string; loader?: string; projectType?: string }) => Promise<{ ok: boolean; error?: string; filename?: string; folder?: string }>;
      onLaunchLog: (cb: (msg: string) => void) => () => void;
      onSessionStarted: (cb: (data: { instanceId: string }) => void) => () => void;
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
  label = "Играть",
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
  const [isRunning, setIsRunning] = useState(false);
  const { prefs } = useLaunchPrefs();
  const username = usernameProp || prefs.username;

  // Слушаем события запуска и остановки игры
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const offStarted = api.onSessionStarted?.((data) => {
      if (!instanceId || data.instanceId === instanceId) {
        setIsRunning(true);
        setLaunching(false);
      }
    });

    const offEnded = api.onSessionEnded?.((data) => {
      if (!instanceId || data.instanceId === instanceId) {
        setIsRunning(false);
        setLaunching(false);
      }
    });

    return () => {
      offStarted?.();
      offEnded?.();
    };
  }, [instanceId]);

  const onPlay = async () => {
    if (!window.electronAPI?.isElectron) {
      toast({
        title: "Доступно только в .exe",
        description: "Запуск Minecraft работает в десктопной версии PixieClient, в браузере — нет.",
        variant: "destructive",
      });
      return;
    }
    setLaunching(true);
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
        setLaunching(false);
        toast({ title: "Не удалось запустить", description: res.error, variant: "destructive" });
      }
      // Если ok — ждём событие mc-session-started, тогда setLaunching(false) произойдёт автоматически
    } catch (e) {
      setLaunching(false);
      toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" });
    }
  };

  const onStop = async () => {
    if (!instanceId || !window.electronAPI) return;
    const res = await window.electronAPI.stopMinecraft(instanceId);
    if (!res.ok) {
      toast({ title: "Не удалось остановить", description: res.error, variant: "destructive" });
    }
  };

  // === Кнопка "Остановить" — красная, как на Modrinth ===
  if (isRunning) {
    return (
      <Button
        onClick={onStop}
        size={size}
        className={`gap-2 bg-red-500 hover:bg-red-600 text-white border-0 ${className ?? ""}`}
      >
        <Square className="w-4 h-4 fill-current" />
        Остановить
      </Button>
    );
  }

  // === Кнопка "Играть" / загрузка ===
  return (
    <Button
      onClick={onPlay}
      disabled={launching}
      size={size}
      variant={variant}
      className={`gap-2 ${className ?? ""}`}
    >
      {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
      {launching ? "Загрузка…" : label}
    </Button>
  );
};
