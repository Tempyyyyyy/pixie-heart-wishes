import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Package, Layers, User, Newspaper, Server, Shirt, Flame, Box, Palette,
  Sparkles, Plug, ChevronDown, UserCircle2, Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const modsChildren = [
  { to: "/library", label: "Моды", icon: Package },
  { to: "/modpacks", label: "Сборки модов", icon: Box },
  { to: "/resourcepacks", label: "Текстур-паки", icon: Palette },
  { to: "/shaders", label: "Шейдеры", icon: Sparkles },
  { to: "/plugins", label: "Плагины", icon: Plug },
];
const modsPaths = modsChildren.map((c) => c.to);

const topItems = [
  { to: "/", label: "Главная", icon: Home, exact: true },
  { to: "/instances", label: "Мои сборки", icon: Layers },
];

const bottomItems = [
  { to: "/servers", label: "Серверы", icon: Server },
  { to: "/skins", label: "Скины", icon: Shirt },
  { to: "/news", label: "Новости", icon: Newspaper },
  { to: "/account", label: "Аккаунт", icon: UserCircle2 },
  { to: "/profile", label: "Профиль", icon: User },
];

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
    isActive
      ? "bg-gradient-to-r from-primary/30 to-primary/5 text-foreground border border-primary/40"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
  );

export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const modsActive = modsPaths.some((p) => location.pathname.startsWith(p));
  const [modsOpen, setModsOpen] = useState(modsActive);

  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Меню"
          className="md:hidden w-10 h-10 rounded-full bg-secondary/60 border border-border flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-sidebar-border">
        <div className="flex flex-col h-full p-5 gap-6 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-shadow animate-pulse-glow">
              <Flame className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-bold text-lg leading-tight">Pixiestape</div>
              <div className="text-[10px] tracking-[0.2em] text-muted-foreground">LAUNCHER</div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground px-3 mb-2">
              НАВИГАЦИЯ
            </div>

            {topItems.map(({ to, label, icon: Icon, exact }) => (
              <NavLink key={to} to={to} end={exact} className={itemClass} onClick={close}>
                {({ isActive }) => (
                  <>
                    <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}

            <button
              type="button"
              onClick={() => setModsOpen((v) => !v)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all w-full text-left",
                modsActive
                  ? "bg-gradient-to-r from-primary/30 to-primary/5 text-foreground border border-primary/40"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Package className={cn("w-4 h-4", modsActive && "text-primary")} />
              <span>Моды</span>
              <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform text-muted-foreground", modsOpen && "rotate-180")} />
            </button>

            {modsOpen && (
              <div className="ml-3 pl-3 border-l border-sidebar-border flex flex-col gap-1 mt-1 mb-1">
                {modsChildren.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={close}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                        isActive
                          ? "bg-primary/15 text-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}

            {bottomItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={itemClass} onClick={close}>
                {({ isActive }) => (
                  <>
                    <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};
