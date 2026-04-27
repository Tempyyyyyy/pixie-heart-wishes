import { useEffect, useState } from "react";
import { Layout } from "@/components/launcher/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isElectron } from "@/lib/environment";
import { Newspaper, Download, Clock, Users, Package, ExternalLink, Loader2, Layers, Zap, Shield, Cpu, Globe, ChevronDown, Menu, X, Monitor, Laptop, Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import fallbackImg from "@/assets/hero-bg.jpg";
import renderImg from "@/assets/3d-render.png";
import { usePlaytime, formatHours } from "@/lib/launchSettings";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

type NewsItem = {
  title: string;
  link: string;
  description: string;
  image: string | null;
  pubDate: string;
  source: string;
};

type ModItem = {
  title: string;
  author: string;
  downloads: string;
  icon?: string;
  slug?: string;
};

type ModrinthModpack = {
  title: string;
  author: string;
  downloads: string;
  icon_url?: string;
  description: string;
  slug?: string;
};

type UserInstance = {
  id: string;
  name: string;
  icon?: string;
};

const Index = () => {
  const isElectronEnv = isElectron();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [topMods, setTopMods] = useState<ModItem[]>([
    { title: "Fabric API", author: "FabricMC", downloads: "162.5M", icon: "https://cdn.modrinth.com/data/P7dR8mSH/icon.png", slug: "fabric-api" },
    { title: "Sodium", author: "jellysquid3", downloads: "147.0M", icon: "https://cdn.modrinth.com/data/AANobbMI/icon.png", slug: "sodium" },
    { title: "Cloth Config API", author: "shedaniel", downloads: "115.4M", icon: "https://cdn.modrinth.com/data/9s6osm5g/icon.png", slug: "cloth-config" },
    { title: "Iris Shaders", author: "IrisShaders", downloads: "114.8M", icon: "https://cdn.modrinth.com/data/YL57xq9i/icon.png", slug: "iris" },
    { title: "Entity Culling", author: "tr7zw", downloads: "106.3M", icon: "https://cdn.modrinth.com/data/NNAgCjsB/icon.png", slug: "entity-culling-fabric" },
    { title: "FerriteCore", author: "malte231", downloads: "104.9M", icon: "https://cdn.modrinth.com/data/hu4coxoH/icon.png", slug: "ferritecore" },
  ]);
  const [buildsTab, setBuildsTab] = useState<"my" | "community">("my");
  const [communityModpacks, setCommunityModpacks] = useState<ModrinthModpack[]>([]);
  const [loadingModpacks, setLoadingModpacks] = useState(false);
  const [userInstances, setUserInstances] = useState<UserInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [instancesLoaded, setInstancesLoaded] = useState(false);
  const playtime = usePlaytime();

  useEffect(() => {
    if (isElectronEnv) {
      fetch(`${SUPABASE_URL}/functions/v1/news`)
        .then(r => r.json())
        .then(d => setNewsItems(d.items ?? []))
        .catch(() => setNewsItems([]))
        .finally(() => setLoadingNews(false));
    }
  }, [isElectronEnv]);

  useEffect(() => {
    if (buildsTab === "community" && communityModpacks.length === 0) {
      setLoadingModpacks(true);
      fetch("https://api.modrinth.com/v2/search?facets=[[\"project_type:modpack\"]]&limit=12&index=downloads")
        .then(r => r.json())
        .then(d => {
          const modpacks = d.hits?.map((hit: any) => ({
            title: hit.title,
            author: hit.author,
            downloads: hit.downloads > 1000000 ? `${(hit.downloads / 1000000).toFixed(1)}M` : `${(hit.downloads / 1000).toFixed(1)}K`,
            icon_url: hit.icon_url,
            description: hit.description,
            slug: hit.slug,
          })) || [];
          setCommunityModpacks(modpacks);
        })
        .catch(() => setCommunityModpacks([]))
        .finally(() => setLoadingModpacks(false));
    }
  }, [buildsTab, communityModpacks.length]);

  useEffect(() => {
    if (isElectronEnv && buildsTab === "my" && !instancesLoaded) {
      setLoadingInstances(true);
      (window as any).electron?.listInstances?.()
        .then((instances: any[]) => {
          const userInsts = instances.map((inst: any) => ({
            id: inst.id,
            name: inst.name,
            icon: inst.icon,
          }));
          setUserInstances(userInsts);
          setInstancesLoaded(true);
        })
        .catch(() => {
          setUserInstances([]);
          setInstancesLoaded(true);
        })
        .finally(() => setLoadingInstances(false));
    }
  }, [isElectronEnv, buildsTab, instancesLoaded]);

  if (!isElectronEnv) {
    // Website landing page - FastClient theme
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    const faqs = [
      { q: "Is PixieClient free to use?", a: "Yes! PixieClient is 100% free and open-source. No hidden fees or premium tiers." },
      { q: "What versions of Minecraft are supported?", a: "We support all major versions from 1.8 to the latest release, including Fabric, Forge, and Quilt loaders." },
      { q: "How do I install mods?", a: "Simply browse our built-in mod browser, click on any mod, and it will be automatically installed to your selected instance." },
      { q: "Is it safe to use?", a: "Absolutely. All mods are verified through Modrinth, and we never collect personal data without consent." },
    ];

    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#3b82f6]/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow-delay" />
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow-delay-2" />
          <div className="absolute top-1/4 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-float" />
          <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl animate-float-delay" />
        </div>

        {/* Sticky Navigation */}
        <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <Zap className="w-8 h-8 text-[#3b82f6]" />
                <span className="text-xl font-bold">PixieClient</span>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-gray-300 hover:text-white transition-colors hover:scale-110 transform">Features</a>
                <a href="https://discord.gg/pixieclient" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors hover:scale-110 transform">Discord</a>
                <a href="#support" className="text-gray-300 hover:text-white transition-colors hover:scale-110 transform">Support</a>
                <Button 
                  asChild
                  className="bg-gradient-to-r from-[#3b82f6] via-purple-500 to-[#3b82f6] bg-[length:200%_auto] animate-gradient-shift hover:bg-[length:200%_auto] text-white rounded-lg px-6 py-2 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:scale-105"
                >
                  <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes/releases/latest" target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 space-y-4 animate-fade-in">
                <a href="#features" className="block text-gray-300 hover:text-white transition-colors">Features</a>
                <a href="https://discord.gg/pixieclient" target="_blank" rel="noopener noreferrer" className="block text-gray-300 hover:text-white transition-colors">Discord</a>
                <a href="#support" className="block text-gray-300 hover:text-white transition-colors">Support</a>
                <Button 
                  asChild
                  className="w-full bg-gradient-to-r from-[#3b82f6] via-purple-500 to-[#3b82f6] bg-[length:200%_auto] animate-gradient-shift text-white rounded-lg px-6 py-2"
                >
                  <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes/releases/latest" target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </Button>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-20 md:py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8 animate-fade-in relative z-10">
                <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#3b82f6]/20 to-purple-500/20 border border-[#3b82f6]/30 text-sm font-medium animate-pulse-slow">
                  ⚡ Next-Gen Launcher
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Next-Gen Performance for <span className="bg-gradient-to-r from-[#3b82f6] via-purple-500 to-pink-500 bg-clip-text text-transparent">Minecraft</span>
                </h1>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Experience FPS boosting like never before. PixieClient optimizes your game with advanced memory management, integrated mod support, and a sleek interface designed for performance.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-[#3b82f6] via-purple-500 to-[#3b82f6] bg-[length:200%_auto] animate-gradient-shift hover:bg-[length:200%_auto] text-white rounded-lg px-8 py-4 text-lg transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:scale-105 relative overflow-hidden group"
                  >
                    <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes/releases/latest" target="_blank" rel="noopener noreferrer">
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <Download className="w-5 h-5 mr-2" />
                      Download Now
                    </a>
                  </Button>
                </div>
              </div>

              {/* Right Content - 3D Render */}
              <div className="relative animate-fade-in-delay">
                <div className="aspect-square bg-gradient-to-br from-[#1a1a1a] via-[#3b82f6]/5 to-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden relative group hover:shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/10 via-purple-500/5 to-pink-500/10 animate-gradient-rotate" />
                  <div className="absolute inset-0 bg-[#3b82f6]/5 blur-3xl group-hover:blur-2xl transition-all duration-500" />
                  <div className="relative z-10 w-full h-full">
                    <img 
                      src={renderImg} 
                      alt="3D Render" 
                      className="w-full h-full object-cover animate-float-slow group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="py-12 border-y border-white/10 bg-gradient-to-r from-[#1a1a1a]/50 via-[#3b82f6]/5 to-[#1a1a1a]/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/10 via-purple-500/5 to-[#3b82f6]/10 animate-gradient-rotate opacity-50" />
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div className="animate-fade-in group cursor-default">
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#3b82f6] to-purple-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">1M+</p>
                <p className="text-gray-400 mt-2 group-hover:text-white transition-colors">Downloads</p>
              </div>
              <div className="animate-fade-in-delay group cursor-default">
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">200+</p>
                <p className="text-gray-400 mt-2 group-hover:text-white transition-colors">Mods</p>
              </div>
              <div className="animate-fade-in-delay-2 group cursor-default">
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-[#3b82f6] bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">100%</p>
                <p className="text-gray-400 mt-2 group-hover:text-white transition-colors">Free</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 px-4 relative">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-[#3b82f6] via-purple-500 to-pink-500 bg-clip-text text-transparent">Why Choose PixieClient?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Lightning Fast", desc: "Optimized for maximum FPS with minimal resource usage", gradient: "from-[#3b82f6] to-cyan-400" },
                { icon: Shield, title: "Secure & Safe", desc: "All mods verified through Modrinth for your safety", gradient: "from-purple-500 to-pink-500" },
                { icon: Cpu, title: "Smart Optimization", desc: "Automatic memory management and performance tuning", gradient: "from-pink-500 to-[#3b82f6]" },
                { icon: Globe, title: "Global Community", desc: "Join thousands of players worldwide", gradient: "from-cyan-400 to-[#3b82f6]" },
                { icon: Layers, title: "Mod Integration", desc: "Built-in mod browser with one-click installs", gradient: "from-[#3b82f6] to-purple-500" },
                { icon: Download, title: "Easy Updates", desc: "Auto-update launcher and mods seamlessly", gradient: "from-purple-500 to-cyan-400" },
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl p-6 border border-white/10 hover:border-[#3b82f6]/50 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] animate-fade-in group relative overflow-hidden"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <feature.icon className={`w-10 h-10 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform duration-300`} />
                  <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-[#1a1a1a]/50 via-[#3b82f6]/5 to-[#1a1a1a]/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/5 via-purple-500/5 to-[#3b82f6]/5 animate-gradient-rotate opacity-50" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-[#3b82f6] via-purple-500 to-pink-500 bg-clip-text text-transparent">Download PixieClient</h2>
            <p className="text-gray-400 mb-12">Available for all major operating systems</p>
            
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Monitor, name: "Windows", version: "v1.0.0", gradient: "from-[#3b82f6] to-cyan-400" },
                { icon: Laptop, name: "macOS", version: "v1.0.0", gradient: "from-purple-500 to-pink-500" },
                { icon: Terminal, name: "Linux", version: "v1.0.0", gradient: "from-pink-500 to-[#3b82f6]" },
              ].map((os, i) => (
                <div 
                  key={i}
                  className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl p-6 border border-white/10 hover:border-[#3b82f6]/50 transition-all hover:scale-105 cursor-pointer animate-fade-in group relative overflow-hidden"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <os.icon className={`w-12 h-12 bg-gradient-to-r ${os.gradient} bg-clip-text text-transparent mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`} />
                  <h3 className="text-xl font-bold mb-1 group-hover:text-white transition-colors">{os.name}</h3>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{os.version}</p>
                  <Button 
                    asChild
                    className="mt-4 w-full bg-gradient-to-r from-[#3b82f6] via-purple-500 to-[#3b82f6] bg-[length:200%_auto] animate-gradient-shift hover:bg-[length:200%_auto] text-white rounded-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] relative overflow-hidden group"
                    size="sm"
                  >
                    <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes/releases/latest" target="_blank" rel="noopener noreferrer">
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="support" className="py-20 px-4 relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-[#3b82f6] via-purple-500 to-pink-500 bg-clip-text text-transparent">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div 
                  key={i}
                  className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden animate-fade-in group hover:border-[#3b82f6]/30 transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <button 
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  >
                    <span className="font-semibold group-hover:text-white transition-colors">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${faqOpen === i ? 'rotate-180 text-[#3b82f6]' : 'text-gray-400'}`} />
                  </button>
                  {faqOpen === i && (
                    <div className="px-6 pb-4 text-gray-400 animate-fade-in border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-white/10 bg-gradient-to-br from-[#1a1a1a]/50 via-[#3b82f6]/5 to-[#1a1a1a]/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/5 via-purple-500/5 to-[#3b82f6]/5 animate-gradient-rotate opacity-50" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2 group cursor-default">
                <Zap className="w-6 h-6 text-[#3b82f6] group-hover:scale-110 transition-transform duration-300" />
                <span className="font-bold bg-gradient-to-r from-[#3b82f6] to-purple-500 bg-clip-text text-transparent">PixieClient</span>
              </div>
              
              <div className="flex items-center gap-6">
                <a href="https://discord.gg/pixieclient" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#3b82f6] transition-colors hover:scale-110 transform">
                  Discord
                </a>
                <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#3b82f6] transition-colors hover:scale-110 transform">
                  GitHub
                </a>
              </div>
              
              <p className="text-gray-400 text-sm group cursor-default hover:text-white transition-colors">Built by Tempyyyyyy</p>
            </div>
          </div>
        </footer>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
          .animate-fade-in-delay {
            animation: fadeIn 0.6s ease-out 0.2s forwards;
            opacity: 0;
          }
          .animate-fade-in-delay-2 {
            animation: fadeIn 0.6s ease-out 0.4s forwards;
            opacity: 0;
          }
          @keyframes pulseSlow {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.05); }
          }
          .animate-pulse-slow {
            animation: pulseSlow 4s ease-in-out infinite;
          }
          .animate-pulse-slow-delay {
            animation: pulseSlow 4s ease-in-out infinite 1s;
          }
          .animate-pulse-slow-delay-2 {
            animation: pulseSlow 4s ease-in-out infinite 2s;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(0) translateX(20px); }
            75% { transform: translateY(20px) translateX(10px); }
          }
          .animate-float {
            animation: float 8s ease-in-out infinite;
          }
          .animate-float-delay {
            animation: float 8s ease-in-out infinite 2s;
          }
          .animate-float-slow {
            animation: float 12s ease-in-out infinite;
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient-shift {
            animation: gradientShift 3s ease infinite;
          }
          @keyframes gradientRotate {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient-rotate {
            background-size: 200% 200%;
            animation: gradientRotate 6s ease infinite;
          }
        `}</style>
      </div>
    );
  }

  // Electron launcher dashboard
  return (
    <Layout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/30">
          <h1 className="text-2xl font-bold mb-2">Твой кастомный PixieClient.</h1>
          <p className="text-muted-foreground text-sm">Один клик — и ты в игре. Тысячи модов, готовые сборки, шейдеры и текстур-паки прямо из Modrinth. Серверы, новости и профиль в стиле Steam — всё в одном кастомном интерфейсе.</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Часов в игре</span>
            </div>
            <p className="text-2xl font-bold">{formatHours(playtime.totalSeconds)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Установлено модов</span>
            </div>
            <p className="text-2xl font-bold">{userInstances.length > 0 ? "—" : "0"}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Друзей онлайн</span>
            </div>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Сборки</span>
            </div>
            <p className="text-2xl font-bold">{userInstances.length}</p>
          </div>
        </div>

        {/* Builds Section */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Сборки
          </h2>
          
          <div className="flex gap-2 mb-4">
            <Button 
              variant={buildsTab === "my" ? "default" : "outline"} 
              size="sm"
              onClick={() => setBuildsTab("my")}
            >
              Мои сборки
            </Button>
            <Button 
              variant={buildsTab === "community" ? "default" : "outline"} 
              size="sm"
              onClick={() => setBuildsTab("community")}
            >
              Сборки сообщества
            </Button>
          </div>

          {buildsTab === "my" && (
            <>
              {loadingInstances && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {!loadingInstances && userInstances.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  У тебя пока нет сборок. Создай первую!
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userInstances.map((instance) => (
                  <Link key={instance.id} to={`/instance/${instance.id}`} className="block">
                    <div className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-all cursor-pointer h-full">
                      <div className="aspect-video bg-secondary rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {instance.icon ? (
                          <img 
                            src={instance.icon} 
                            alt={instance.name}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              (e.currentTarget as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Layers className="w-8 h-8 text-muted-foreground" style={{ display: instance.icon ? 'none' : 'block' }} />
                      </div>
                      <h3 className="font-bold text-sm mb-1">{instance.name}</h3>
                      <p className="text-xs text-muted-foreground">Твоя сборка</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {buildsTab === "community" && (
            <>
              {loadingModpacks && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}

              {!loadingModpacks && communityModpacks.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Не удалось загрузить сборки. Проверь интернет.
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {communityModpacks.map((modpack, i) => (
                  <Link key={i} to="/modpacks" className="block">
                    <div className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-all cursor-pointer h-full">
                      <div className="aspect-video bg-secondary rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        {modpack.icon_url ? (
                          <img 
                            src={modpack.icon_url} 
                            alt={modpack.title}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                              (e.currentTarget as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Layers className="w-8 h-8 text-muted-foreground" style={{ display: modpack.icon_url ? 'none' : 'block' }} />
                      </div>
                      <h3 className="font-bold text-sm mb-1">{modpack.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{modpack.author}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{modpack.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* News Section */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            Новости Minecraft
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Свежие истории сообщества и обновления</p>

          {loadingNews && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!loadingNews && newsItems.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Не удалось загрузить новости. Проверь интернет.
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsItems.map((n, i) => (
              <a
                key={n.link + i}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:-translate-y-1 transition-all flex flex-col"
              >
                <div className="aspect-video bg-secondary overflow-hidden">
                  <img
                    src={n.image || fallbackImg}
                    alt={n.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallbackImg; }}
                  />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-[10px]">{n.source}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {n.pubDate ? new Date(n.pubDate).toLocaleDateString("ru") : ""}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {n.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{n.description}</p>
                  <div className="mt-2 text-xs text-primary inline-flex items-center gap-1">
                    Читать <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Top Mods Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Топ модов</h2>
          <p className="text-sm text-muted-foreground mb-4">Самые скачиваемые моды сообщества</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topMods.map((mod, i) => (
              <Link key={i} to="/library" className="block">
                <div className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-all flex items-center gap-3 cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {mod.icon ? (
                      <img 
                        src={mod.icon} 
                        alt={mod.title}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          (e.currentTarget as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Package className="w-6 h-6 text-muted-foreground" style={{ display: mod.icon ? 'none' : 'block' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm mb-1 truncate">{mod.title}</h3>
                    <p className="text-xs text-muted-foreground mb-1 truncate">{mod.author}</p>
                    <p className="text-xs font-medium text-primary">{mod.downloads}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
