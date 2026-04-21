import { Search, Bell, LogIn, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TopBar = () => {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 md:px-10 py-4 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="relative flex-1 max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск модов, сборок, серверов..."
          className="w-full h-11 pl-11 pr-4 rounded-full bg-secondary/60 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-full bg-secondary/60 border border-border text-xs text-muted-foreground">
          <GitBranch className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-foreground">v0.2.0</span>
          <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">beta</span>
        </div>

        <button className="relative w-10 h-10 rounded-full bg-secondary/60 border border-border flex items-center justify-center hover:bg-secondary transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
        </button>

        <Button variant="hero" size="sm" className="rounded-full h-10 px-5">
          <LogIn className="w-4 h-4 mr-1" />
          Войти
        </Button>
      </div>
    </header>
  );
};
