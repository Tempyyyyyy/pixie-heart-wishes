import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 md:p-10 scrollbar-thin">
          <div className="animate-page-in h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
