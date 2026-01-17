import { ArrowRight, Shield, Coins, Globe, Upload, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { gscBlockchainService } from "@/services/gscBlockchain";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-silver/5 rounded-full blur-3xl animate-float delay-300" />
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--gold)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-gold mb-8 animate-fade-in-up">
            <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-sm text-gold font-medium">The Future of Sound Money</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up delay-100">
            <span className="text-foreground">Virtual Asset</span>
            <br />
            <span className="text-gradient-gold">Gold & Silver</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-fade-in-up delay-200">
            VAGS transforms gold and silver into a sustainable, scarcity-driven digital value system 
            for the next century. Move beyond printed money to a metal-backed reality.
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-300">
            <div className="glass-card p-4">
              <div className="font-display text-2xl md:text-3xl font-bold text-gold">1:8</div>
              <div className="text-xs text-muted-foreground mt-1">Gold to Silver Ratio</div>
            </div>
            <div className="glass-card p-4">
              <div className="font-display text-2xl md:text-3xl font-bold text-silver-light">2.16T</div>
              <div className="text-xs text-muted-foreground mt-1">Max GSC Supply</div>
            </div>
            <div className="glass-card p-4">
              <div className="font-display text-2xl md:text-3xl font-bold text-gold">0.1g + 0.8g</div>
              <div className="text-xs text-muted-foreground mt-1">Gold + Silver per GSC</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-400">
            <Button
              className="btn-gold group px-8 py-6 text-lg"
              onClick={() => navigate("/signup")}
            >
              Start Mining
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              className="btn-silver px-8 py-6 text-lg"
              onClick={() => navigate("/whitepaper")}
            >
              Read Whitepaper
            </Button>
          </div>

          {/* Blockchain Import Section */}
          <div className="mt-12 p-6 glass-card max-w-2xl mx-auto animate-fade-in-up delay-600">
            <h3 className="text-xl font-semibold text-gold mb-4">Import Blockchain Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Import your existing GSC blockchain data to access your wallets and transaction history
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="file"
                accept=".json,.blockchain"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  
                  try {
                    const text = await file.text();
                    const blockchainData = JSON.parse(text);
                    
                    // Import blockchain data
                    localStorage.setItem('gsc_blockchain', text);
                    
                    // Show success message
                    const toast = (await import("@/hooks/use-toast")).toast;
                    toast({
                      title: "Blockchain Imported",
                      description: "Successfully imported blockchain data. Navigate to wallet to access your data.",
                    });
                    
                    // Navigate to wallet page
                    setTimeout(() => {
                      navigate("/wallet");
                    }, 1500);
                    
                  } catch (error) {
                    const toast = (await import("@/hooks/use-toast")).toast;
                    toast({
                      title: "Import Failed",
                      description: `Failed to import blockchain: ${error}`,
                      variant: "destructive",
                    });
                  }
                }}
                className="hidden"
                id="blockchain-import"
              />
              <Button
                onClick={() => document.getElementById('blockchain-import')?.click()}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Import Blockchain
              </Button>
              <Button
                onClick={() => gscBlockchainService.forceLoadGSCBlockchain()}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Load GSC Data
              </Button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-fade-in-up delay-500">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-gold" />
              <span className="text-sm">Non-Custodial</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className="w-5 h-5 text-gold" />
              <span className="text-sm">Metal-Backed</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-5 h-5 text-gold" />
              <span className="text-sm">Decentralized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
