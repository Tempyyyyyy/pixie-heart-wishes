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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* HERO SECTION */}
      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm font-medium">
            ✨ The Future of Minecraft Launchers
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            PixieClient<br />The Ultimate<br />Minecraft Experience
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Fast, smooth, and optimized for maximum performance. Join thousands of players who trust PixieClient.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="rounded-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-6">
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
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">See It In Action</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Experience the difference with PixieClient's powerful features
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Smooth Performance", desc: "Experience buttery smooth gameplay" },
              { icon: Shield, title: "Easy Profile Management", desc: "Switch between profiles instantly" },
              { icon: Download, title: "Mod Integration", desc: "Install mods with one click" },
            ].map((feature, i) => (
              <div key={i} className="text-center p-8 rounded-2xl border border-purple-500/20 bg-purple-900/30">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-600 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE SECTION */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose PixieClient?</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: "Lightning Fast", desc: "Quick startup and fast mod loading" },
              { icon: Play, title: "High FPS", desc: "Optimized for maximum performance" },
              { icon: Shield, title: "Trusted", desc: "Used by thousands of players" },
              { icon: CheckCircle, title: "Easy to Use", desc: "Simple and intuitive interface" },
              { icon: Download, title: "Mod Support", desc: "Full Fabric mod compatibility" },
              { icon: ArrowRight, title: "Auto Updates", desc: "Always up to date with latest features" },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-xl border border-purple-500/20 bg-purple-900/30">
                <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 md:py-24 bg-purple-900/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Download PixieClient now and take your Minecraft experience to the next level
          </p>
          
          <Button asChild size="lg" className="rounded-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-6">
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
