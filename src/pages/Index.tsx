import { Download, Zap, Shield, CheckCircle, ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isElectron } from "@/lib/environment";

const Index = () => {
  const isElectronEnv = isElectron();

  if (isElectronEnv) {
    // Show original launcher UI
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">PixieClient Launcher</h1>
          <Link to="/instances">
            <Button>Go to Instances</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Website landing page
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* HERO SECTION */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-block mb-6 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium backdrop-blur-sm animate-float-up">
            ✨ The Future of Minecraft Launchers
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 leading-tight bg-gradient-to-r from-white via-purple-200 via-pink-200 to-purple-400 bg-clip-text text-transparent animate-gradient bg-300% bg-gradient-to-r">
            PixieClient<br />The Ultimate<br />Minecraft Experience
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Fast, smooth, and optimized for maximum performance. Join thousands of players who trust PixieClient.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="rounded-full text-lg px-10 py-7 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white shadow-2xl shadow-purple-500/50 transition-all hover:scale-110 hover:shadow-purple-500/70 animate-gradient bg-300% bg-gradient-to-r">
              <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes/releases/latest" target="_blank" rel="noopener noreferrer">
                <Download className="w-5 h-5 mr-2" />
                DOWNLOAD for Windows
              </a>
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Also available for macOS Intel, macOS Apple Silicon and Linux
          </p>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 md:py-24 relative">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-300% bg-gradient-to-r">See It In Action</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto text-lg">
            Experience the difference with PixieClient's powerful features
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Smooth Performance", desc: "Experience buttery smooth gameplay", gradient: "from-yellow-400 via-orange-500 to-red-500", glow: "shadow-yellow-500/50" },
              { icon: Shield, title: "Easy Profile Management", desc: "Switch between profiles instantly", gradient: "from-blue-400 via-cyan-500 to-blue-600", glow: "shadow-blue-500/50" },
              { icon: Download, title: "Mod Integration", desc: "Install mods with one click", gradient: "from-green-400 via-emerald-500 to-green-600", glow: "shadow-green-500/50" },
            ].map((feature, i) => (
              <div key={i} className="group text-center p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 via-gray-900/40 to-purple-900/40 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className={`relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-2xl ${feature.glow} transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white relative">{feature.title}</h3>
                <p className="text-gray-400 relative">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-300% bg-gradient-to-r">Why Choose PixieClient?</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Quick startup and fast mod loading" },
              { icon: Play, title: "High FPS", desc: "Optimized for maximum performance" },
              { icon: Shield, title: "Trusted", desc: "Used by thousands of players" },
              { icon: CheckCircle, title: "Easy to Use", desc: "Simple and intuitive interface" },
              { icon: Download, title: "Mod Support", desc: "Full Fabric mod compatibility" },
              { icon: ArrowRight, title: "Auto Updates", desc: "Always up to date with latest features" },
            ].map((feature, i) => (
              <div key={i} className="group flex gap-4 p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 via-gray-900/40 to-purple-900/40 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shrink-0 shadow-xl shadow-purple-500/30 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div className="relative">
                  <h3 className="font-bold mb-1 text-white text-lg">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnYyaC0ydjJoLTJ2LTJ6bS0yIDBoMnYyaC0ydi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent animate-gradient bg-300% bg-gradient-to-r">Ready to Get Started?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Download PixieClient now and take your Minecraft experience to the next level
          </p>
          
          <Button asChild size="lg" className="rounded-full text-lg px-10 py-7 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white shadow-2xl shadow-purple-500/50 transition-all hover:scale-110 hover:shadow-purple-500/70 animate-gradient bg-300% bg-gradient-to-r">
            <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes/releases/latest" target="_blank" rel="noopener noreferrer">
              <Download className="w-5 h-5 mr-2" />
              Download Now
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
