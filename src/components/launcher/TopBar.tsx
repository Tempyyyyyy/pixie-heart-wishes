import { Search, Bell, LogIn, GitBranch, Settings, LogOut, User as UserIcon, Flame } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "./AuthDialog";
import { SettingsDialog } from "./SettingsDialog";
import { MobileNav } from "./MobileNav";
import { useEffect } from "react";

export const TopBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!user) { setAvatar(null); setName(""); return; }
    supabase.from("profiles").select("avatar_url, display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setAvatar(data?.avatar_url ?? null);
        setName(data?.display_name ?? user.email?.split("@")[0] ?? "Player");
      });
  }, [user]);

  const initials = (name || "P").slice(0, 2).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-5 md:px-10 py-3 md:py-4 bg-background/80 backdrop-blur-xl border-b border-border">
        <MobileNav />

        {/* Mobile compact logo (when sidebar is hidden) */}
        <Link to="/" className="md:hidden flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center glow-shadow">
            <Flame className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-base hidden xs:inline">Pixiestape</span>
        </Link>

        <div className="relative flex-1 max-w-2xl min-w-0">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Поиск…"
            aria-label="Поиск модов"
            className="w-full h-10 md:h-11 pl-9 sm:pl-11 pr-3 rounded-full bg-secondary/60 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const q = (e.target as HTMLInputElement).value.trim();
                if (q) navigate(`/library?q=${encodeURIComponent(q)}`);
              }
            }}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-3 h-9 rounded-full bg-secondary/60 border border-border text-xs text-muted-foreground">
            <GitBranch className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-foreground">v0.2.0</span>
            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">beta</span>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Настройки"
            className="hidden sm:flex w-10 h-10 rounded-full bg-secondary/60 border border-border items-center justify-center hover:bg-secondary hover:border-primary/40 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button className="hidden sm:flex relative w-10 h-10 rounded-full bg-secondary/60 border border-border items-center justify-center hover:bg-secondary transition-colors" aria-label="Уведомления">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full" aria-label="Меню профиля">
                  <Avatar className="w-9 h-9 md:w-10 md:h-10 border-2 border-primary/40 hover:border-primary transition-colors">
                    {avatar && <AvatarImage src={avatar} alt={name} />}
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile"><UserIcon className="w-4 h-4 mr-2" />Профиль</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />Настройки
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
                  <LogOut className="w-4 h-4 mr-2" />Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="hero" size="sm" className="rounded-full h-10 px-3 sm:px-5" onClick={() => setAuthOpen(true)}>
              <LogIn className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Войти</span>
            </Button>
          )}
        </div>
      </header>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};
