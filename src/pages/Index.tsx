import { Download, Zap, Shield, CheckCircle, ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/launcher/Layout";
import { isElectron } from "@/lib/environment";

const Index = () => {
  const isElectronEnv = isElectron();

  return (
    <Layout>
      {/* HERO SECTION */}
      <section className="relative py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            The Ultimate Minecraft Experience
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Fast, smooth, and optimized for maximum performance. Join thousands of players who trust PixieClient.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isElectronEnv && (
              <Button asChild size="lg" className="rounded-full text-lg px-8 py-6">
                <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes/releases/latest" target="_blank" rel="noopener noreferrer">
                  <Download className="w-5 h-5 mr-2" />
                  DOWNLOAD for Windows
                </a>
              </Button>
            )}
            
            <Button asChild size="lg" variant="outline" className="rounded-full text-lg px-8 py-6">
              <Link to="/instances">
                <Play className="w-5 h-5 mr-2" />
                Launch PixieClient
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Also available for macOS Intel, macOS Apple Silicon and Linux
          </p>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">See It In Action</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Experience the difference with PixieClient's powerful features
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl border border-border bg-card">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smooth Performance</h3>
              <p className="text-muted-foreground">Experience buttery smooth gameplay</p>
            </div>

            <div className="text-center p-6 rounded-2xl border border-border bg-card">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Easy Profile Management</h3>
              <p className="text-muted-foreground">Switch between profiles instantly</p>
            </div>

            <div className="text-center p-6 rounded-2xl border border-border bg-card">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Mod Integration</h3>
              <p className="text-muted-foreground">Install mods with one click</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE SECTION */}
      <section className="py-16 md:py-24 bg-secondary/30">
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
              <div key={i} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                <feature.icon className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <h3 className="font-bold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Download PixieClient now and take your Minecraft experience to the next level
          </p>
          
          {!isElectronEnv && (
            <Button asChild size="lg" className="rounded-full text-lg px-8 py-6">
              <a href="https://github.com/Tempyyyyyy/pixie-heart-wishes/releases/latest" target="_blank" rel="noopener noreferrer">
                <Download className="w-5 h-5 mr-2" />
                Download Now
              </a>
            </Button>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
