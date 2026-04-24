// Общие настройки запуска (ник + RAM) + тема, используемые везде.
const KEY = "pixiestape:launch";
const THEME_KEY = "pixiestape:theme";

export type LaunchPrefs = {
  username: string;
  ramGb: number;
  uuid?: string;
  accountType?: "offline" | "microsoft";
};

const DEFAULTS: LaunchPrefs = {
  username: "PixieTester",
  ramGb: 4,
};

export function getLaunchPrefs(): LaunchPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export function setLaunchPrefs(patch: Partial<LaunchPrefs>) {
  const next = { ...getLaunchPrefs(), ...patch };
  next.username = (next.username || "Player")
    .replace(/[^A-Za-z0-9_ ]/g, "") // Разрешаем пробелы для MS аккаунтов
    .slice(0, 32) || "Player";
  next.ramGb = Math.max(1, Math.min(32, Math.round(next.ramGb || 4)));
  next.uuid = next.uuid || "00000000000000000000000000000000";
  next.accountType = next.accountType || "offline";
  localStorage.setItem(KEY, JSON.stringify(next));
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

// =====================================================
// Темы — пользователи могут менять основной цвет / фон
// =====================================================

export type ThemePreset = {
  id: string;
  name: string;
  primary: string;         // HSL "H S% L%"
  primaryGlow: string;
  background: string;
  card: string;
  accent: string;
  border: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  { id: "crimson",    name: "Crimson (по умолчанию)", primary: "0 84% 50%",   primaryGlow: "14 100% 55%", background: "0 0% 4%",    card: "0 30% 7%",    accent: "0 60% 20%",   border: "0 30% 12%" },
  { id: "violet",     name: "Violet Dream",           primary: "270 80% 60%", primaryGlow: "290 90% 65%", background: "260 25% 5%", card: "260 30% 9%",  accent: "270 50% 25%", border: "260 30% 15%" },
  { id: "ocean",      name: "Deep Ocean",             primary: "200 90% 50%", primaryGlow: "180 90% 55%", background: "215 30% 5%", card: "215 30% 9%",  accent: "200 60% 25%", border: "210 30% 15%" },
  { id: "forest",     name: "Forest",                 primary: "140 70% 45%", primaryGlow: "120 80% 55%", background: "150 20% 5%", card: "150 25% 8%",  accent: "140 50% 20%", border: "150 25% 13%" },
  { id: "sunset",     name: "Sunset",                 primary: "25 95% 55%",  primaryGlow: "45 100% 60%", background: "20 20% 5%",  card: "20 30% 8%",   accent: "30 60% 25%",  border: "25 30% 14%" },
  { id: "candy",      name: "Candy Pink",             primary: "330 85% 60%", primaryGlow: "300 90% 70%", background: "330 15% 6%", card: "330 25% 9%",  accent: "330 60% 25%", border: "330 25% 15%" },
  { id: "mint",       name: "Mint",                   primary: "165 70% 50%", primaryGlow: "175 85% 55%", background: "170 15% 6%", card: "170 22% 9%",  accent: "165 50% 22%", border: "170 25% 14%" },
  { id: "monochrome", name: "Monochrome",             primary: "0 0% 90%",    primaryGlow: "0 0% 100%",   background: "0 0% 4%",    card: "0 0% 8%",     accent: "0 0% 18%",    border: "0 0% 14%" },
];

export type CustomTheme = ThemePreset;

export function getTheme(): CustomTheme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CustomTheme;
      return parsed;
    }
  } catch { /* ignore */ }
  return THEME_PRESETS[0];
}

export function setTheme(t: CustomTheme) {
  localStorage.setItem(THEME_KEY, JSON.stringify(t));
  applyTheme(t);
  window.dispatchEvent(new CustomEvent("pixiestape:theme-changed", { detail: t }));
}

export function applyTheme(t: CustomTheme) {
  const r = document.documentElement;
  // Основные цвета
  r.style.setProperty("--primary", t.primary);
  r.style.setProperty("--primary-glow", t.primaryGlow);
  r.style.setProperty("--background", t.background);
  r.style.setProperty("--card", t.card);
  r.style.setProperty("--popover", t.card);
  r.style.setProperty("--accent", t.accent);
  r.style.setProperty("--border", t.border);
  r.style.setProperty("--ring", t.primary);
  r.style.setProperty("--destructive", t.primary);

  // Цвета сайдбара — теперь они тоже зависят от темы!
  // Мы используем чуть более темную версию фона темы для сайдбара
  const [h, s, l] = t.background.split(" ");
  const lNum = parseInt(l);
  const sidebarBg = `${h} ${s} ${Math.max(2, lNum - 1)}%`;
  const sidebarAccent = `${h} ${s} ${Math.min(20, lNum + 5)}%`;
  const sidebarBorder = `${h} ${s} ${Math.min(25, lNum + 8)}%`;

  r.style.setProperty("--sidebar-background", sidebarBg);
  r.style.setProperty("--sidebar-foreground", "0 0% 85%");
  r.style.setProperty("--sidebar-primary", t.primary);
  r.style.setProperty("--sidebar-primary-foreground", "0 0% 100%");
  r.style.setProperty("--sidebar-accent", sidebarAccent);
  r.style.setProperty("--sidebar-accent-foreground", "0 0% 96%");
  r.style.setProperty("--sidebar-border", sidebarBorder);
  r.style.setProperty("--sidebar-ring", t.primary);

  // Вторичные цвета
  r.style.setProperty("--secondary", sidebarAccent);
  r.style.setProperty("--secondary-foreground", "0 0% 96%");

  // Градиенты и тени (обновляем переменные, которые используются в index.css)
  r.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, hsl(${t.primary}), hsl(${t.primaryGlow}))`
  );
  r.style.setProperty(
    "--gradient-hero",
    `radial-gradient(ellipse at top, hsl(${t.primary} / 0.4), transparent 60%)`
  );
  r.style.setProperty(
    "--shadow-glow",
    `0 0 40px hsl(${t.primary} / 0.4)`
  );
  r.style.setProperty(
    "--shadow-button",
    `0 8px 24px hsl(${t.primary} / 0.45)`
  );
}

export function useTheme() {
  const [theme, setT] = useState<CustomTheme>(() => getTheme());

  useEffect(() => {
    applyTheme(theme);

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<CustomTheme>).detail;
      if (detail) {
        setT(detail);
        applyTheme(detail); // <--- Важно! Применяем тему сразу при получении события
      }
    };

    window.addEventListener("pixiestape:theme-changed", onChange);
    return () => window.removeEventListener("pixiestape:theme-changed", onChange);
  }, [theme]);

  return {
    theme,
    update: (t: CustomTheme) => {
      setT(t);
      setTheme(t);
    },
  };
}

// =====================================================
// Учёт времени игры — суммарно по всем инстансам
// =====================================================

const PLAYTIME_KEY = "pixiestape:playtime";

export type Playtime = {
  totalSeconds: number;
  byInstance: Record<string, number>;
};

export function getPlaytime(): Playtime {
  try {
    const raw = localStorage.getItem(PLAYTIME_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { totalSeconds: 0, byInstance: {} };
}

// Anti-dup guard: один и тот же session-ended иногда приходит дважды
// (StrictMode регистрирует listener дважды; Electron в редких кейсах эмитит повторно).
let _lastPlaytimeKey = "";
let _lastPlaytimeAt = 0;

const MAX_SESSION_SECONDS = 24 * 3600; // 24 часа на одну сессию максимум

export function addPlaytime(seconds: number, instanceId?: string | null) {
  if (!seconds || seconds < 5) return; // игнорируем «крашнулось мгновенно»
  // Дедупликация: одинаковая сессия в пределах 3 сек = дубликат
  const key = `${instanceId || "_"}:${seconds}`;
  const now = Date.now();
  if (key === _lastPlaytimeKey && now - _lastPlaytimeAt < 3000) return;
  _lastPlaytimeKey = key;
  _lastPlaytimeAt = now;

  const safeSeconds = Math.min(seconds, MAX_SESSION_SECONDS);
  const cur = getPlaytime();
  cur.totalSeconds += safeSeconds;
  if (instanceId) {
    cur.byInstance[instanceId] = (cur.byInstance[instanceId] || 0) + safeSeconds;
  }
  localStorage.setItem(PLAYTIME_KEY, JSON.stringify(cur));
  window.dispatchEvent(new CustomEvent("pixiestape:playtime-changed", { detail: cur }));
}

export function resetPlaytime() {
  const empty: Playtime = { totalSeconds: 0, byInstance: {} };
  localStorage.setItem(PLAYTIME_KEY, JSON.stringify(empty));
  window.dispatchEvent(new CustomEvent("pixiestape:playtime-changed", { detail: empty }));
}

export function usePlaytime() {
  const [pt, setPt] = useState<Playtime>(() => getPlaytime());
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<Playtime>).detail;
      if (detail) setPt(detail);
    };
    window.addEventListener("pixiestape:playtime-changed", onChange);
    return () => window.removeEventListener("pixiestape:playtime-changed", onChange);
  }, []);
  return pt;
}

export function formatHours(seconds: number): string {
  if (!seconds || seconds < 60) return `${Math.max(0, Math.floor(seconds))}с`;
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}м`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}ч ${minutes}м` : `${hours}ч`;
}
