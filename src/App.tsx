import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppGlobals } from "@/components/AppGlobals";
import Index from "./pages/Index.tsx";
import Library from "./pages/Library.tsx";
import Modpacks from "./pages/Modpacks.tsx";
import Resourcepacks from "./pages/Resourcepacks.tsx";
import Shaders from "./pages/Shaders.tsx";
import Plugins from "./pages/Plugins.tsx";
import Instances from "./pages/Instances.tsx";
import InstanceDetail from "./pages/InstanceDetail.tsx";
import Profile from "./pages/Profile.tsx";
import News from "./pages/News.tsx";
import Servers from "./pages/Servers.tsx";
import Skins from "./pages/Skins.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-page-in">
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/index.html" element={<Index />} />
        <Route path="/library" element={<Library />} />
        <Route path="/modpacks" element={<Modpacks />} />
        <Route path="/resourcepacks" element={<Resourcepacks />} />
        <Route path="/shaders" element={<Shaders />} />
        <Route path="/plugins" element={<Plugins />} />
        <Route path="/instances" element={<Instances />} />
        <Route path="/instances/:id" element={<InstanceDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/news" element={<News />} />
        <Route path="/servers" element={<Servers />} />
        <Route path="/skins" element={<Skins />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AppGlobals>
          <AnimatedRoutes />
        </AppGlobals>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
