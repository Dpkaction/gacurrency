import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Wallet, Plus, Upload, Download, Key, Eye, EyeOff } from "lucide-react";
import { gscBlockchainService, GSCWallet } from "@/services/gscBlockchain";

interface GSCWalletManagerProps {
  activeWallet: string | null;
  onWalletChange: (walletName: string | null) => void;
}

const GSCWalletManager = ({ activeWallet, onWalletChange }: GSCWalletManagerProps) => {
  const [wallets, setWallets] = useState<GSCWallet[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletPassphrase, setNewWalletPassphrase] = useState("");
  const [importWalletName, setImportWalletName] = useState("");
  const [importPrivateKey, setImportPrivateKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [blockchainFile, setBlockchainFile] = useState<File | null>(null);
  const [walletBackupFile, setWalletBackupFile] = useState<File | null>(null);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = () => {
    // Force refresh wallet balances from blockchain data
    gscBlockchainService.refreshWalletBalances();
    
    const loadedWallets = gscBlockchainService.getWallets();
    
    // Update balances to ensure they're current
    const updatedWallets = loadedWallets.map(wallet => ({
      ...wallet,
      balance: gscBlockchainService.getWalletBalance(wallet.address)
    }));
    setWallets(updatedWallets);
  };

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a wallet name",
        variant: "destructive",
      });
      return;
    }

    try {
      const wallet = gscBlockchainService.createWallet(newWalletName, newWalletPassphrase);
      loadWallets();
      onWalletChange(wallet.name);
      setIsCreateDialogOpen(false);
      setNewWalletName("");
      setNewWalletPassphrase("");
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create wallet: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleImportWallet = async () => {
    if (!importWalletName.trim() || !importPrivateKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter wallet name and private key",
        variant: "destructive",
      });
      return;
    }

    try {
      const wallet = gscBlockchainService.importWallet(importWalletName, importPrivateKey);
      loadWallets();
      onWalletChange(wallet.name);
      setIsImportDialogOpen(false);
      setImportWalletName("");
      setImportPrivateKey("");
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to import wallet: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleImportWalletBackup = async () => {
    if (!walletBackupFile) {
      toast({
        title: "Error",
        description: "Please select a wallet backup file",
        variant: "destructive",
      });
      return;
    }

    try {
      const wallet = await gscBlockchainService.importWalletFromBackup(walletBackupFile);
      loadWallets();
      onWalletChange(wallet.name);
      setIsImportDialogOpen(false);
      setWalletBackupFile(null);
    } catch (error) {
      // Error already handled in service
    }
  };

  const handleImportBlockchain = async () => {
    if (!blockchainFile) {
      toast({
        title: "Error",
        description: "Please select a blockchain file",
        variant: "destructive",
      });
      return;
    }

    const success = await gscBlockchainService.importBlockchain(blockchainFile);
    if (success) {
      loadWallets();
      setBlockchainFile(null);
    }
  };

  const handleExportBlockchain = () => {
    const blockchainData = gscBlockchainService.exportBlockchain();
    const blob = new Blob([blockchainData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsc_blockchain_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Blockchain exported successfully",
    });
  };

  const handleExportWalletBackup = (walletName: string) => {
    try {
      const backupData = gscBlockchainService.exportWalletBackup(walletName);
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${walletName}_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `Wallet backup exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export wallet backup: ${error}`,
        variant: "destructive",
      });
    }
  };

  const getActiveWalletData = () => {
    return wallets.find(w => w.name === activeWallet);
  };

  return (
    <div className="space-y-4">
      {/* Wallet Selection and Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="wallet-select">Active Wallet</Label>
          <Select value={activeWallet || ""} onValueChange={onWalletChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.name} value={wallet.name}>
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span>{wallet.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({wallet.balance.toFixed(4)} GSC)
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New GSC Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="wallet-name">Wallet Name</Label>
                  <Input
                    id="wallet-name"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="Enter wallet name"
                  />
                </div>
                <div>
                  <Label htmlFor="wallet-passphrase">Passphrase (Optional)</Label>
                  <Input
                    id="wallet-passphrase"
                    type="password"
                    value={newWalletPassphrase}
                    onChange={(e) => setNewWalletPassphrase(e.target.value)}
                    placeholder="Enter passphrase for encryption"
                  />
                </div>
                <Button onClick={handleCreateWallet} className="w-full">
                  Create Wallet
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Key className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import GSC Wallet</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="wallet" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="wallet">Private Key</TabsTrigger>
                  <TabsTrigger value="backup">Backup File</TabsTrigger>
                  <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
                </TabsList>
                
                <TabsContent value="wallet" className="space-y-4">
                  <div>
                    <Label htmlFor="import-wallet-name">Wallet Name</Label>
                    <Input
                      id="import-wallet-name"
                      value={importWalletName}
                      onChange={(e) => setImportWalletName(e.target.value)}
                      placeholder="Enter wallet name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="import-private-key">Private Key</Label>
                    <div className="relative">
                      <Input
                        id="import-private-key"
                        type={showPrivateKey ? "text" : "password"}
                        value={importPrivateKey}
                        onChange={(e) => setImportPrivateKey(e.target.value)}
                        placeholder="Enter private key"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleImportWallet} className="w-full">
                    Import Wallet
                  </Button>
                </TabsContent>
                
                <TabsContent value="backup" className="space-y-4">
                  <div>
                    <Label htmlFor="wallet-backup-file">Wallet Backup File</Label>
                    <Input
                      id="wallet-backup-file"
                      type="file"
                      accept=".json,.backup"
                      onChange={(e) => setWalletBackupFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a GSC wallet backup file (.json or .backup)
                    </p>
                  </div>
                  <Button onClick={handleImportWalletBackup} className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Import from Backup
                  </Button>
                </TabsContent>
                
                <TabsContent value="blockchain" className="space-y-4">
                  <div>
                    <Label htmlFor="blockchain-file">Blockchain File</Label>
                    <Input
                      id="blockchain-file"
                      type="file"
                      accept=".json"
                      onChange={(e) => setBlockchainFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button onClick={handleImportBlockchain} className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Blockchain
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleExportBlockchain}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Active Wallet Info */}
      {getActiveWalletData() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              {getActiveWalletData()?.name}
            </CardTitle>
            <CardDescription>GSC Blockchain Wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Balance</Label>
                <p className="text-2xl font-bold text-green-600">
                  {getActiveWalletData()?.balance.toFixed(8)} GSC
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Address</Label>
                <p className="font-mono text-xs break-all">
                  {getActiveWalletData()?.address}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Created</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(getActiveWalletData()?.created || "").toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExportWalletBackup(getActiveWalletData()?.name || "")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Backup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blockchain Stats */}
      <Card>
        <CardHeader>
          <CardTitle>GSC Blockchain Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{gscBlockchainService.getBlockchainStats().totalBlocks}</p>
              <p className="text-sm text-muted-foreground">Total Blocks</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{gscBlockchainService.getBlockchainStats().totalWallets}</p>
              <p className="text-sm text-muted-foreground">Total Wallets</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{gscBlockchainService.getBlockchainStats().pendingTransactions}</p>
              <p className="text-sm text-muted-foreground">Pending TXs</p>
            </div>
            <div>
              <p className="text-2xl font-bold">21.75T</p>
              <p className="text-sm text-muted-foreground">Total Supply</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GSCWalletManager;
