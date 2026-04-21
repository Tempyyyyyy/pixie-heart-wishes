// Общие настройки запуска (ник + RAM), используемые везде, где есть кнопка "Играть".
// Хранятся в localStorage отдельно от UI-настроек лаунчера.

const KEY = "pixiestape:launch";

export type LaunchPrefs = {
  username: string;
  ramGb: number;
};

const DEFAULTS: LaunchPrefs = {
  username: "PixieTester",
  ramGb: 4,
};

export function getLaunchPrefs(): LaunchPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export function setLaunchPrefs(patch: Partial<LaunchPrefs>) {
  const next = { ...getLaunchPrefs(), ...patch };
  // sanitize ник
  next.username = (next.username || "Player")
    .replace(/[^A-Za-z0-9_]/g, "")
    .slice(0, 16) || "Player";
  next.ramGb = Math.max(1, Math.min(32, Math.round(next.ramGb || 4)));
  localStorage.setItem(KEY, JSON.stringify(next));
  // дёргаем глобальное событие — чтобы реактовские хуки могли подписаться
  window.dispatchEvent(new CustomEvent("pixiestape:launch-changed", { detail: next }));
  return next;
}

import { useEffect, useState } from "react";

export function useLaunchPrefs() {
  const [prefs, setPrefs] = useState<LaunchPrefs>(() => getLaunchPrefs());
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<LaunchPrefs>).detail;
      if (detail) setPrefs(detail);
      else setPrefs(getLaunchPrefs());
    };
    window.addEventListener("pixiestape:launch-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("pixiestape:launch-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return {
    prefs,
    update: (patch: Partial<LaunchPrefs>) => setPrefs(setLaunchPrefs(patch)),
  };
}
