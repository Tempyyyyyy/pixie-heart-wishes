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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* HERO SECTION */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-block mb-6 px-6 py-3 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50 text-purple-200 text-sm font-medium backdrop-blur-sm">
            ✨ The Future of Minecraft Launchers
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 leading-tight bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            PixieClient<br />The Ultimate<br />Minecraft Experience
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Fast, smooth, and optimized for maximum performance. Join thousands of players who trust PixieClient.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="rounded-full text-lg px-10 py-7 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl shadow-purple-500/30 transition-all hover:scale-105">
              <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes/releases/latest" target="_blank" rel="noopener noreferrer">
                <Download className="w-5 h-5 mr-2" />
                DOWNLOAD for Windows
              </a>
            </Button>
          </div>

          <p className="text-sm text-gray-400 mt-6">
            Also available for macOS Intel, macOS Apple Silicon and Linux
          </p>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 md:py-24 relative">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">See It In Action</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto text-lg">
            Experience the difference with PixieClient's powerful features
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Smooth Performance", desc: "Experience buttery smooth gameplay", gradient: "from-yellow-500 to-orange-500" },
              { icon: Shield, title: "Easy Profile Management", desc: "Switch between profiles instantly", gradient: "from-blue-500 to-cyan-500" },
              { icon: Download, title: "Mod Integration", desc: "Install mods with one click", gradient: "from-green-500 to-emerald-500" },
            ].map((feature, i) => (
              <div key={i} className="group text-center p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 to-gray-900/40 backdrop-blur-sm hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg transition-all group-hover:scale-110`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-transparent via-purple-900/20 to-transparent">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Why Choose PixieClient?</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Quick startup and fast mod loading" },
              { icon: Play, title: "High FPS", desc: "Optimized for maximum performance" },
              { icon: Shield, title: "Trusted", desc: "Used by thousands of players" },
              { icon: CheckCircle, title: "Easy to Use", desc: "Simple and intuitive interface" },
              { icon: Download, title: "Mod Support", desc: "Full Fabric mod compatibility" },
              { icon: ArrowRight, title: "Auto Updates", desc: "Always up to date with latest features" },
            ].map((feature, i) => (
              <div key={i} className="group flex gap-4 p-6 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/30 to-gray-900/30 backdrop-blur-sm hover:border-purple-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg transition-all group-hover:scale-110">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div>
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
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Ready to Get Started?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Download PixieClient now and take your Minecraft experience to the next level
          </p>
          
          <Button asChild size="lg" className="rounded-full text-lg px-10 py-7 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl shadow-purple-500/30 transition-all hover:scale-105">
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
