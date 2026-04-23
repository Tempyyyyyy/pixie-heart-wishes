import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Volume2, Monitor, Cpu, Languages, User } from "lucide-react";
import { useLaunchPrefs, useTheme, THEME_PRESETS, CustomTheme } from "@/lib/launchSettings";

type Settings = {
  language: "ru" | "en";
  volume: number;
  closeOnLaunch: boolean;
  betaFeatures: boolean;
  showFps: boolean;
  resolution: "auto" | "1280x720" | "1920x1080" | "2560x1440";
};

const DEFAULTS: Settings = {
  language: "ru",
  volume: 80,
  closeOnLaunch: false,
  betaFeatures: true,
  showFps: false,
  resolution: "auto",
};

const KEY = "pixiestape:settings";

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);
  const update = (patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };
  return { settings, update };
};

export const SettingsDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { settings, update } = useSettings();
  const { prefs, update: updatePrefs } = useLaunchPrefs();
  const { theme, update: updateTheme } = useTheme();
  const [nickDraft, setNickDraft] = useState(prefs.username);

  useEffect(() => { setNickDraft(prefs.username); }, [prefs.username, open]);

  const saveNick = () => {
    updatePrefs({ username: nickDraft });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display text-2xl">Настройки</DialogTitle>
              <DialogDescription>Управляй лаунчером под себя</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">

          <Section icon={Cpu} title={`Память: ${prefs.ramGb} ГБ`} description="Сколько RAM выделять Java при запуске Minecraft">
            <Slider value={[prefs.ramGb]} min={1} max={32} step={1} onValueChange={([v]) => updatePrefs({ ramGb: v })} />
          </Section>

          <Section icon={Languages} title="Язык интерфейса">
            <Select value={settings.language} onValueChange={(v) => update({ language: v as Settings["language"] })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </Section>

          <Section icon={Volume2} title={`Громкость лаунчера: ${settings.volume}%`}>
            <Slider value={[settings.volume]} min={0} max={100} step={5} onValueChange={([v]) => update({ volume: v })} />
          </Section>

          <Section icon={Monitor} title="Разрешение окна игры">
            <Select value={settings.resolution} onValueChange={(v) => update({ resolution: v as Settings["resolution"] })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Авто</SelectItem>
                <SelectItem value="1280x720">1280 × 720</SelectItem>
                <SelectItem value="1920x1080">1920 × 1080 (FHD)</SelectItem>
                <SelectItem value="2560x1440">2560 × 1440 (QHD)</SelectItem>
              </SelectContent>
            </Select>
          </Section>

          <Section icon={SettingsIcon} title="Тема оформления" description="Выбери цвет лаунчера (сохраняется локально)">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEME_PRESETS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateTheme(t)}
                  className={`relative h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    theme.id === t.id ? "border-primary ring-2 ring-primary/50" : "border-border hover:border-primary/50"
                  }`}
                  style={{ background: `hsl(${t.background})` }}
                >
                  <div className="w-6 h-6 rounded-full" style={{ background: `hsl(${t.primary})` }} />
                  <span className="text-[10px] font-semibold truncate w-full text-center px-1 text-white">{t.name}</span>
                </button>
              ))}
            </div>
          </Section>

          <div className="space-y-3 pt-2 border-t border-border">
            <ToggleRow
              label="Закрывать лаунчер при запуске игры"
              value={settings.closeOnLaunch}
              onChange={(v) => update({ closeOnLaunch: v })}
            />
            <ToggleRow
              label="Показывать FPS оверлей"
              value={settings.showFps}
              onChange={(v) => update({ showFps: v })}
            />
            <ToggleRow
              label="Бета-функции"
              value={settings.betaFeatures}
              onChange={(v) => update({ betaFeatures: v })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Закрыть</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Section = ({ icon: Icon, title, description, children }: { icon: any; title: string; description?: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" />
      <Label className="text-sm font-semibold">{title}</Label>
    </div>
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
    <div>{children}</div>
  </div>
);

const ToggleRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4">
    <Label className="text-sm font-medium">{label}</Label>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);
