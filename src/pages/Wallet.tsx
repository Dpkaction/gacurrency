import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { LogOut, Copy, Check, RefreshCw } from "lucide-react";
import GSCFullWallet from "@/components/wallet/GSCFullWalletNew";
import { gscBlockchainService } from "@/services/gscBlockchain";

const WalletPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isInitialized, setIsInitialized] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    navigate("/");
  };

  const copyLoginId = () => {
    if (user?.loginId) {
      navigator.clipboard.writeText(user.loginId);
      setCopiedId(true);
      toast({ title: "Copied!", description: "Login ID copied to clipboard" });
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-hero-pattern pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-midnight/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center">
                <span className="font-display font-bold text-midnight text-sm">V</span>
              </div>
              <span className="font-display font-bold text-lg text-gradient-gold">VAGS</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:block">
                Welcome, <span className="text-gold">{user.username}</span>
              </span>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 lg:px-8 py-6">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">
              <span className="text-gradient-gold">GSC</span> Wallet
            </h1>
            <p className="text-muted-foreground text-sm">GSC Blockchain Wallet - Production Grade</p>
          </div>
        </div>

        {/* DID Card */}
        <div className="glass-card p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">Your Login ID (DID)</p>
            <p className="font-mono text-xs text-foreground truncate">{user.loginId}</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 border-gold/30 hover:bg-gold/10" onClick={copyLoginId}>
            {copiedId ? <><Check className="w-4 h-4 mr-2 text-success" />Copied!</> : <><Copy className="w-4 h-4 mr-2" />Copy ID</>}
          </Button>
        </div>

        {/* GSC Wallet Full Interface */}
        {isInitialized ? (
          <GSCFullWallet />
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gold mb-4" />
              <p className="text-muted-foreground">Initializing GSC blockchain...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WalletPage;
