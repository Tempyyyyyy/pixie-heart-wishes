import { useEffect } from "react";
import { useTheme, addPlaytime } from "@/lib/launchSettings";

/**
 * Глобальный провайдер: применяет сохранённую тему при старте и
 * слушает события окончания сессии Minecraft из Electron, чтобы
 * накапливать время игры.
 */
export const AppGlobals = ({ children }: { children: React.ReactNode }) => {
  useTheme(); // применяет тему из localStorage

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.onSessionEnded) return;
    const off = api.onSessionEnded((data: { instanceId: string | null; seconds: number }) => {
      addPlaytime(data.seconds, data.instanceId);
    });
    return off;
  }, []);

  return <>{children}</>;
};
