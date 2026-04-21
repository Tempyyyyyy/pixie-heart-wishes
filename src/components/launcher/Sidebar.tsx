import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Package, Layers, User, Newspaper, Server, Shirt, Flame, Box, Palette, Sparkles, Plug, ChevronDown, Gamepad2 } from "lucide-react";
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
  { to: "/profile", label: "Профиль", icon: User },
];

export const Sidebar = () => {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-5 gap-8">
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

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground px-3 mb-2">
          НАВИГАЦИЯ
        </div>
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                isActive
                  ? "bg-gradient-to-r from-primary/30 to-primary/5 text-foreground border border-primary/40"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                <span>{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
