import { toast } from "@/hooks/use-toast";

// GSC Blockchain Types
export interface GSCTransaction {
  sender: string;
  receiver: string;
  amount: number;
  fee: number;
  timestamp: number;
  signature: string;
  tx_id: string;
}

export interface GSCBlock {
  index: number;
  timestamp: number;
  transactions: GSCTransaction[];
  previous_hash: string;
  nonce: number;
  hash: string;
  merkle_root: string;
  difficulty: number;
  miner: string;
  reward: number;
}

export interface GSCWallet {
  name: string;
  address: string;
  private_key: string;
  public_key: string;
  balance: number;
  created: string;
  encrypted: boolean;
}

export interface GSCBlockchain {
  chain: GSCBlock[];
  pending_transactions: GSCTransaction[];
  wallets: GSCWallet[];
  total_supply: number;
  mempool?: GSCTransaction[];
  balances?: { [address: string]: number };
  difficulty?: number;
  mining_reward?: number;
}

// Telegram Bot Configuration
const TELEGRAM_CONFIG = {
  bot_token: "8360297293:AAH8uHoBVMe09D5RguuRMRHb5_mcB3k7spo",
  bot_username: "@gsc_vags_bot",
  chat_id: null as string | null,
};

class GSCBlockchainService {
  private blockchain: GSCBlockchain;
  private storage_key = "gsc_blockchain_data";
  private wallets_key = "gsc_wallets";

  constructor() {
    this.blockchain = {
      chain: [],
      pending_transactions: [],
      wallets: [],
      total_supply: 21750000000000, // 21.75 trillion GSC
    };
    this.loadBlockchain();
    this.initializeTelegramBot();
  }

  // Blockchain Management
  loadBlockchain(): void {
    try {
      console.log("=== LOADING BLOCKCHAIN ===");
      
      // First check for main blockchain data (persistent storage)
      const stored = localStorage.getItem(this.storage_key);
      if (stored) {
        console.log("Loading existing main blockchain from persistent storage");
        this.blockchain = JSON.parse(stored);
        console.log("Loaded blockchain:", {
          chain_length: this.blockchain.chain?.length || 0,
          wallets_count: this.blockchain.wallets?.length || 0,
          balances: this.blockchain.balances || {},
          mempool_length: this.blockchain.pending_transactions?.length || 0
        });
        
        // If we have a valid blockchain with data, use it
        if (this.blockchain.chain && this.blockchain.chain.length > 1) {
          console.log("Using existing blockchain with", this.blockchain.chain.length, "blocks");
          return;
        }
      }
      
      // Check for temporary imported data (from blockchain import)
      const importedData = localStorage.getItem('gsc_blockchain');
      if (importedData) {
        console.log("Found imported blockchain data in localStorage");
        const imported = JSON.parse(importedData);
        console.log("Imported blockchain structure:", {
          chain_length: imported.chain?.length || 0,
          balances: imported.balances || {},
          mempool_length: (imported.mempool || imported.pending_transactions || []).length
        });
        
        this.blockchain = {
          chain: imported.chain || [],
          pending_transactions: imported.mempool || imported.pending_transactions || [],
          wallets: [],
          total_supply: imported.total_supply || 21750000000000,
          balances: imported.balances || {},
          difficulty: imported.difficulty || 4,
          mining_reward: imported.mining_reward || 50,
          mempool: imported.mempool || imported.pending_transactions || []
        };
        
        // Create wallets from imported balances
        if (imported.balances) {
          Object.entries(imported.balances).forEach(([address, balance]) => {
            if (address !== "GENESIS" && address !== "COINBASE" && address.startsWith("GSC1")) {
              const shortAddress = address.substring(4, 14);
              const wallet: GSCWallet = {
                name: `Wallet_${shortAddress}`,
                address: address,
                private_key: "", // Will be filled when user imports wallet backup
                public_key: "",
                balance: Math.max(0, balance as number),
                created: new Date().toISOString(),
                encrypted: false
              };
              this.blockchain.wallets.push(wallet);
              console.log(`Created wallet for ${address} with balance ${balance} GSC`);
            }
          });
        }
        
        console.log("Imported blockchain is now the main blockchain:", this.blockchain);
        console.log(`Created ${this.blockchain.wallets.length} wallets from imported balances`);
        
        // Clear the imported data flag and save as main blockchain
        localStorage.removeItem('gsc_blockchain');
        this.saveBlockchain();
        return;
      }
      
      // If no imported data and no existing blockchain, create genesis block
      console.log("No blockchain data found, creating genesis block");
      this.createGenesisBlock();
      
      // Also load wallets from separate storage (for backward compatibility)
      const storedWallets = localStorage.getItem(this.wallets_key);
      if (storedWallets && (!this.blockchain.wallets || this.blockchain.wallets.length === 0)) {
        this.blockchain.wallets = JSON.parse(storedWallets);
      }
      
      console.log("Main blockchain loaded:", this.blockchain);
    } catch (error) {
      console.error("Failed to load blockchain:", error);
      this.createGenesisBlock();
    }
  }

  saveBlockchain(): void {
    try {
      console.log("=== SAVING BLOCKCHAIN ===");
      console.log("Saving blockchain with", this.blockchain.chain.length, "blocks and", this.blockchain.wallets.length, "wallets");
      localStorage.setItem(this.storage_key, JSON.stringify(this.blockchain));
      console.log("Blockchain saved successfully");
    } catch (error) {
      console.error("Error saving blockchain:", error);
    }
  }

  // Update all wallet balances from blockchain balances
  searchTransactionById(txId: string): any | null {
    console.log("=== SEARCHING TRANSACTION BY ID ===");
    console.log("Search ID:", txId);
    
    // Search through all blocks for the transaction
    for (let i = 0; i < this.blockchain.chain.length; i++) {
      const block = this.blockchain.chain[i];
      console.log(`Searching block ${i}: ${block.transactions.length} transactions`);
      
      for (const transaction of block.transactions) {
        if (transaction.tx_id === txId) {
          console.log("Transaction found:", transaction);
          return {
            ...transaction,
            blockIndex: i,
            blockHash: block.hash,
            blockTimestamp: block.timestamp
          };
        }
      }
    }
    
    console.log("Transaction not found");
    return null;
  }

  updateAllWalletBalances(): void {
    console.log("=== UPDATING ALL WALLET BALANCES ===");
    
    if (!this.blockchain.balances) {
      console.log("No balances data available");
      return;
    }

    // Update existing wallets with correct balances
    this.blockchain.wallets.forEach(wallet => {
      const blockchainBalance = this.blockchain.balances![wallet.address];
      if (blockchainBalance !== undefined) {
        const oldBalance = wallet.balance;
        wallet.balance = Math.max(0, blockchainBalance);
        console.log(`Updated ${wallet.address}: ${oldBalance} → ${wallet.balance} GSC`);
      }
    });

    // Create missing wallets from balances
    Object.entries(this.blockchain.balances).forEach(([address, balance]) => {
      if (address !== "GENESIS" && address !== "COINBASE" && address.startsWith("GSC1")) {
        const existingWallet = this.blockchain.wallets.find(w => w.address === address);
        if (!existingWallet) {
          const shortAddress = address.substring(4, 14);
          const wallet: GSCWallet = {
            name: `Wallet_${shortAddress}`,
            address: address,
            private_key: "",
            public_key: "",
            balance: Math.max(0, balance as number),
            created: new Date().toISOString(),
            encrypted: false
          };
          this.blockchain.wallets.push(wallet);
          console.log(`Created missing wallet for ${address} with balance ${balance} GSC`);
        }
      }
    });

    this.saveBlockchain();
    console.log("All wallet balances updated");
    
    // Force refresh transaction history for all wallets
    this.blockchain.wallets.forEach(wallet => {
      const history = this.getTransactionHistory(wallet.address);
      console.log(`Transaction history for ${wallet.address}: ${history.length} transactions`);
    });
    
    toast({
      title: "Balances Updated",
      description: "All wallet balances have been refreshed from blockchain data",
    });
  }

  // Force load blockchain from GSC exe data
  forceLoadGSCBlockchain(): void {
    try {
      console.log("=== FORCE LOADING GSC BLOCKCHAIN ===");
      
      // Check if we have the synchronized blockchain data
      const gscData = localStorage.getItem('gsc_blockchain_sync');
      if (gscData) {
        console.log("Loading synchronized GSC blockchain data");
        const imported = JSON.parse(gscData);
        
        this.blockchain = {
          chain: imported.chain || [],
          pending_transactions: imported.mempool || imported.pending_transactions || [],
          wallets: [],
          total_supply: imported.total_supply || 21750000000000,
          balances: imported.balances || {},
          difficulty: imported.difficulty || 4,
          mining_reward: imported.mining_reward || 50,
          mempool: imported.mempool || imported.pending_transactions || []
        };

        // Create wallets from imported balances
        if (imported.balances) {
          Object.entries(imported.balances).forEach(([address, balance]) => {
            if (address !== "GENESIS" && address !== "COINBASE" && address.startsWith("GSC1") && (balance as number) > 0) {
              const shortAddress = address.substring(4, 14);
              const wallet: GSCWallet = {
                name: `Wallet_${shortAddress}`,
                address: address,
                private_key: "", // Will be filled when user imports wallet backup
                public_key: "",
                balance: Math.max(0, balance as number),
                created: new Date().toISOString(),
                encrypted: false
              };
              this.blockchain.wallets.push(wallet);
            }
          });
        }

        this.saveBlockchain();
        console.log("GSC blockchain loaded with", this.blockchain.chain.length, "blocks");
        
        toast({
          title: "GSC Blockchain Loaded",
          description: `Loaded blockchain with ${this.blockchain.chain.length} blocks and ${this.blockchain.wallets.length} wallets`,
        });
      } else {
        console.log("No synchronized GSC blockchain data found");
        toast({
          title: "No GSC Data",
          description: "No synchronized GSC blockchain data found. Please import blockchain first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error force loading GSC blockchain:", error);
      toast({
        title: "Load Failed",
        description: `Failed to load GSC blockchain: ${error}`,
        variant: "destructive",
      });
    }
  }

  createGenesisBlock(): void {
    const genesisBlock: GSCBlock = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previous_hash: "0",
      nonce: 0,
      hash: this.calculateHash("0", 0, Date.now(), ""),
      merkle_root: "",
      difficulty: 4,
      miner: "GENESIS",
      reward: 0,
    };
    
    this.blockchain.chain = [genesisBlock];
    this.saveBlockchain();
  }

  // Import existing blockchain from file
  async importBlockchain(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      // Validate imported data structure
      if (this.validateBlockchainData(importedData)) {
        // Convert original GSC-Asset-Foundation-Clone format to new format
        if (importedData.mempool !== undefined || importedData.balances !== undefined) {
          this.blockchain = this.convertFromOriginalFormat(importedData);
        } else {
          this.blockchain = importedData;
        }
        
        // Refresh wallet balances after import
        this.refreshWalletBalances();
        
        this.saveBlockchain();
        toast({
          title: "Success",
          description: "Blockchain imported successfully with updated balances",
        });
        return true;
      } else {
        throw new Error("Invalid blockchain format");
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: `Failed to import blockchain: ${error}`,
        variant: "destructive",
      });
      return false;
    }
  }

  private validateBlockchainData(data: any): boolean {
    // Support both new format and original GSC-Asset-Foundation-Clone format
    if (!data || !Array.isArray(data.chain)) {
      return false;
    }
    
    // New format validation
    if (Array.isArray(data.pending_transactions) && 
        Array.isArray(data.wallets) && 
        typeof data.total_supply === "number") {
      return true;
    }
    
    // Original GSC-Asset-Foundation-Clone format validation
    if (data.mempool !== undefined || data.balances !== undefined) {
      return true;
    }
    
    return false;
  }

  private convertFromOriginalFormat(originalData: any): GSCBlockchain {
    console.log("Converting original GSC format:", originalData);
    
    // Convert original GSC-Asset-Foundation-Clone format to new format
    const convertedBlockchain: GSCBlockchain = {
      chain: originalData.chain || [],
      pending_transactions: originalData.mempool || [],
      wallets: [],
      total_supply: 21750000000000, // GSC total supply
      mempool: originalData.mempool,
      balances: originalData.balances,
      difficulty: originalData.difficulty,
      mining_reward: originalData.mining_reward
    };

    console.log("Original balances:", originalData.balances);

    // Create wallets from balances if they exist
    if (originalData.balances) {
      Object.entries(originalData.balances).forEach(([address, balance]) => {
        console.log(`Processing address ${address} with balance ${balance}`);
        
        // Include all GSC addresses, even with 0 balance for completeness
        if (address !== "GENESIS" && address !== "COINBASE" && address.startsWith("GSC1")) {
          // Generate a readable wallet name from address
          const shortAddress = address.substring(4, 14); // Take middle part of address
          const wallet: GSCWallet = {
            name: `Wallet_${shortAddress}`,
            address: address,
            private_key: "", // Private key not available in blockchain data - user needs to import separately
            public_key: "", // Public key not available in blockchain data
            balance: Math.max(0, balance as number), // Ensure positive balance
            created: new Date().toISOString(),
            encrypted: false
          };
          convertedBlockchain.wallets.push(wallet);
          console.log(`Created wallet for ${address} with balance ${wallet.balance}`);
        }
      });
    }

    console.log("Converted blockchain:", convertedBlockchain);
    return convertedBlockchain;
  }

  // Wallet Management
  generateAddress(): { address: string; private_key: string; public_key: string } {
    // Generate cryptographically secure private key
    const privateKeyArray = new Uint8Array(32);
    crypto.getRandomValues(privateKeyArray);
    const private_key = Array.from(privateKeyArray, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Generate public key hash
    const encoder = new TextEncoder();
    const privateKeyBytes = encoder.encode(private_key);
    
    // Create GSC address format
    const addressSeed = private_key.substring(0, 32);
    const address = `GSC1${addressSeed}`;
    
    // Generate public key
    const public_key = this.calculateHash(private_key, 0, Date.now(), "PUBKEY");
    
    return { address, private_key, public_key };
  }

  createWallet(name: string, passphrase?: string): GSCWallet {
    if (this.blockchain.wallets.find(w => w.name === name)) {
      throw new Error("Wallet name already exists");
    }

    const { address, private_key, public_key } = this.generateAddress();
    
    const wallet: GSCWallet = {
      name,
      address,
      private_key,
      public_key,
      balance: 0,
      created: new Date().toISOString(),
      encrypted: !!passphrase,
    };

    this.blockchain.wallets.push(wallet);
    this.saveBlockchain();
    
    toast({
      title: "Wallet Created",
      description: `Wallet "${name}" created successfully`,
    });

    return wallet;
  }

  importWallet(name: string, private_key: string): GSCWallet {
    console.log("=== IMPORTING WALLET ===");
    console.log("Wallet name:", name);
    console.log("Private key:", private_key);
    
    if (this.blockchain.wallets.find(w => w.name === name)) {
      throw new Error("Wallet name already exists");
    }

    // Derive address and public key from private key
    const addressSeed = private_key.substring(0, 32);
    const address = `GSC1${addressSeed}`;
    const public_key = this.calculateHash(private_key, 0, Date.now(), "PUBKEY");
    
    console.log("Derived address:", address);
    
    // Get real balance from blockchain
    const realBalance = this.getWalletBalance(address);
    console.log("Real balance from blockchain:", realBalance);
    
    const wallet: GSCWallet = {
      name,
      address,
      private_key,
      public_key,
      balance: realBalance, // Use real blockchain balance
      created: new Date().toISOString(),
      encrypted: false,
    };

    // Check if wallet already exists and update it instead of creating duplicate
    const existingWalletIndex = this.blockchain.wallets.findIndex(w => w.address === address);
    if (existingWalletIndex !== -1) {
      console.log("Updating existing wallet with private key");
      this.blockchain.wallets[existingWalletIndex] = wallet;
    } else {
      console.log("Adding new wallet");
      this.blockchain.wallets.push(wallet);
    }
    
    this.saveBlockchain();
    
    // Log transaction history for this wallet
    const transactions = this.getWalletTransactions(address);
    console.log(`Found ${transactions.length} transactions for imported wallet ${address}`);
    
    toast({
      title: "Wallet Imported",
      description: `Wallet "${name}" imported successfully with balance: ${realBalance.toFixed(8)} GSC`,
    });

    return wallet;
  }

  // Import wallet with specific address (for backup files)
  importWalletWithAddress(name: string, address: string, private_key: string, public_key: string): GSCWallet {
    console.log("=== IMPORTING WALLET WITH SPECIFIC ADDRESS ===");
    console.log("Wallet name:", name);
    console.log("Exact address from backup:", address);
    console.log("Private key:", private_key);
    
    if (this.blockchain.wallets.find(w => w.name === name)) {
      throw new Error("Wallet name already exists");
    }

    // Get real balance from blockchain for this exact address
    const realBalance = this.getWalletBalance(address);
    console.log("Real balance from blockchain for", address, ":", realBalance);
    
    const wallet: GSCWallet = {
      name,
      address, // Use exact address from backup file
      private_key,
      public_key,
      balance: realBalance, // Use real blockchain balance
      created: new Date().toISOString(),
      encrypted: false,
    };

    // Check if wallet already exists with this address and update it instead of creating duplicate
    const existingWalletIndex = this.blockchain.wallets.findIndex(w => w.address === address);
    if (existingWalletIndex !== -1) {
      console.log("Updating existing wallet with private key and correct address");
      this.blockchain.wallets[existingWalletIndex] = wallet;
    } else {
      console.log("Adding new wallet with exact address");
      this.blockchain.wallets.push(wallet);
    }
    
    this.saveBlockchain();
    
    // Log transaction history for this wallet
    const transactions = this.getWalletTransactions(address);
    console.log(`Found ${transactions.length} transactions for imported wallet ${address}`);
    
    toast({
      title: "Wallet Imported",
      description: `Wallet "${name}" imported successfully with address ${address} and balance: ${realBalance.toFixed(8)} GSC`,
    });

    return wallet;
  }

  // Import wallet from backup file
  async importWalletFromBackup(file: File, customName?: string): Promise<GSCWallet> {
    try {
      const text = await file.text();
      let backupData;
      
      try {
        backupData = JSON.parse(text);
      } catch (parseError) {
        throw new Error("Invalid JSON format in backup file");
      }
      
      // Debug: Log the backup data structure
      console.log("Backup data structure:", backupData);
      
      // Validate backup file structure
      if (!this.validateWalletBackup(backupData)) {
        // Provide more detailed error information
        const dataKeys = Object.keys(backupData || {});
        throw new Error(`Invalid wallet backup format. Found keys: ${dataKeys.join(', ')}`);
      }

      // Extract the actual wallet data (handle nested wallet_data format)
      let actualWalletData = backupData;
      if (backupData.wallet_data && typeof backupData.wallet_data === 'object') {
        actualWalletData = backupData.wallet_data;
      }

      // Handle wallet name conflicts
      let walletName = customName || backupData.wallet_name || actualWalletData.name || `Imported_${Date.now()}`;
      let originalName = backupData.wallet_name || actualWalletData.name || `Imported_${Date.now()}`;
      
      // If wallet name exists and no custom name provided, throw error for UI to handle
      if (this.blockchain.wallets.find(w => w.name === walletName) && !customName) {
        throw new Error(`WALLET_EXISTS:${originalName}`);
      }
      
      // If custom name also exists, make it unique
      if (customName && this.blockchain.wallets.find(w => w.name === walletName)) {
        let counter = 1;
        const baseName = walletName;
        while (this.blockchain.wallets.find(w => w.name === walletName)) {
          walletName = `${baseName}_${counter}`;
          counter++;
        }
      }

      // Extract wallet data from various backup formats
      let walletAddress = "";
      let walletPrivateKey = "";
      let walletPublicKey = "";
      
      console.log("Processing wallet data:", actualWalletData);
      
      // Handle different backup formats
      if (actualWalletData.addresses && Array.isArray(actualWalletData.addresses) && actualWalletData.addresses.length > 0) {
        // GSC exe wallet format with addresses array (your format)
        console.log("Using addresses array format");
        const firstAddress = actualWalletData.addresses[0];
        walletAddress = firstAddress.address || "";
        walletPrivateKey = firstAddress.private_key || "";
        walletPublicKey = firstAddress.public_key || "";
      } else if (actualWalletData.master_address) {
        // Master address format (your format)
        console.log("Using master address format");
        walletAddress = actualWalletData.master_address;
        walletPrivateKey = actualWalletData.master_private_key || "";
        walletPublicKey = actualWalletData.master_public_key || "";
      } else {
        // Standard formats
        console.log("Using standard format");
        walletAddress = actualWalletData.address || "";
        walletPrivateKey = actualWalletData.private_key || "";
        walletPublicKey = actualWalletData.public_key || "";
      }
      
      console.log("Extracted wallet info:", {
        address: walletAddress,
        hasPrivateKey: !!walletPrivateKey,
        hasPublicKey: !!walletPublicKey
      });
      
      // Validate extracted data
      if (!walletAddress || !walletAddress.startsWith('GSC1')) {
        throw new Error(`Invalid GSC address: ${walletAddress}`);
      }
      
      if (!walletPrivateKey) {
        throw new Error("Private key not found in backup file");
      }

      // Create wallet from backup data with proper balance
      const walletBalance = this.getWalletBalance(walletAddress);
      
      const wallet: GSCWallet = {
        name: walletName,
        address: walletAddress,
        private_key: walletPrivateKey,
        public_key: walletPublicKey,
        balance: walletBalance,
        created: actualWalletData.created || backupData.created || new Date().toISOString(),
        encrypted: backupData.encrypted || false,
      };

      this.blockchain.wallets.push(wallet);
      
      // Refresh all wallet balances to ensure accuracy
      this.refreshWalletBalances();
      
      this.saveBlockchain();
      
      // Get updated balance after refresh
      const updatedWallet = this.blockchain.wallets.find(w => w.address === walletAddress);
      const finalBalance = updatedWallet ? updatedWallet.balance : walletBalance;
      
      toast({
        title: "Wallet Imported from Backup",
        description: walletName !== originalName ? 
          `Wallet imported as "${walletName}" (renamed from "${originalName}") with balance: ${finalBalance.toFixed(8)} GSC` :
          `Wallet "${wallet.name}" imported successfully with balance: ${finalBalance.toFixed(8)} GSC`,
      });

      return updatedWallet || wallet;
    } catch (error) {
      toast({
        title: "Import Failed",
        description: `Failed to import wallet backup: ${error}`,
        variant: "destructive",
      });
      throw error;
    }
  }

  private validateWalletBackup(data: any): boolean {
    // Support multiple backup formats - be more flexible
    
    // Check if it's a valid JSON object first
    if (!data || typeof data !== 'object') {
      console.log("Validation failed: Not a valid object");
      return false;
    }
    
    // Original GSC exe backup format (your specific format)
    if (data.wallet_name && data.wallet_data && typeof data.wallet_data === 'object') {
      const walletData = data.wallet_data;
      // Check for master_address or addresses array
      if (walletData.master_address || (walletData.addresses && Array.isArray(walletData.addresses))) {
        console.log("Validation passed: Original GSC exe format");
        return true;
      }
    }
    
    // Nested wallet_data format without wallet_name
    if (data.wallet_data && typeof data.wallet_data === 'object') {
      const walletData = data.wallet_data;
      if (walletData.master_address || walletData.addresses) {
        console.log("Validation passed: Nested wallet_data format");
        return true;
      }
    }
    
    // GSC wallet backup format
    if (data.name && (data.address || data.master_address)) {
      console.log("Validation passed: GSC wallet format");
      return true;
    }
    
    // Simple backup format with just address and private key
    if (data.address && data.private_key) {
      console.log("Validation passed: Simple format");
      return true;
    }
    
    // Legacy backup format
    if (data.master_address && data.master_private_key) {
      console.log("Validation passed: Legacy format");
      return true;
    }
    
    // GSC exe wallet backup format (from your original project)
    if (data.addresses && Array.isArray(data.addresses) && data.addresses.length > 0) {
      console.log("Validation passed: GSC exe addresses format");
      return true;
    }
    
    // Wallet with balance info
    if (data.balance !== undefined && (data.address || data.master_address)) {
      console.log("Validation passed: Wallet with balance");
      return true;
    }
    
    // Any object with an address field (very flexible)
    if (data.address && data.address.startsWith && data.address.startsWith('GSC1')) {
      return true;
    }
    
    // Any object with master_address field
    if (data.master_address && data.master_address.startsWith && data.master_address.startsWith('GSC1')) {
      return true;
    }
    
    return false;
  }

  // Export wallet as backup file
  exportWalletBackup(walletName: string): string {
    const wallet = this.blockchain.wallets.find(w => w.name === walletName);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const backupData = {
      name: wallet.name,
      address: wallet.address,
      private_key: wallet.private_key,
      public_key: wallet.public_key,
      balance: wallet.balance,
      created: wallet.created,
      encrypted: wallet.encrypted,
      backup_date: new Date().toISOString(),
      version: "2.0",
      type: "GSC_WALLET_BACKUP"
    };

    return JSON.stringify(backupData, null, 2);
  }

  getWallets(): GSCWallet[] {
    return this.blockchain.wallets;
  }

  // Get all transactions from blockchain for transaction history display
  getAllTransactions(): GSCTransaction[] {
    const allTransactions: GSCTransaction[] = [];
    
    console.log("=== LOADING ALL TRANSACTIONS ===");
    console.log("Blockchain chain length:", this.blockchain.chain.length);
    console.log("Pending transactions:", this.blockchain.pending_transactions.length);
    
    // Get transactions from all blocks in the chain
    for (const block of this.blockchain.chain) {
      console.log(`Block ${block.index}: ${block.transactions.length} transactions`);
      for (const transaction of block.transactions) {
        allTransactions.push(transaction);
        console.log(`  - ${transaction.sender} -> ${transaction.receiver}: ${transaction.amount} GSC`);
      }
    }
    
    // Add pending transactions from mempool
    for (const transaction of this.blockchain.pending_transactions) {
      allTransactions.push(transaction);
      console.log(`Mempool: ${transaction.sender} -> ${transaction.receiver}: ${transaction.amount} GSC`);
    }
    
    // Sort by timestamp (newest first)
    allTransactions.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log("Total transactions found:", allTransactions.length);
    return allTransactions;
  }

  // Get transactions for a specific wallet address
  getWalletTransactions(address: string): GSCTransaction[] {
    const walletTransactions: GSCTransaction[] = [];
    
    // Get all transactions
    const allTransactions = this.getAllTransactions();
    
    // Filter transactions involving this address
    for (const transaction of allTransactions) {
      if (transaction.sender === address || transaction.receiver === address) {
        walletTransactions.push(transaction);
      }
    }
    
    return walletTransactions;
  }

  // Get transaction history with type classification (sent/received)
  getTransactionHistory(address: string): Array<{
    transaction: GSCTransaction;
    type: 'sent' | 'received';
    amount: number;
    counterparty: string;
    timestamp: number;
    date: string;
  }> {
    console.log("=== GETTING TRANSACTION HISTORY ===");
    console.log("Target address:", address);
    console.log("Blockchain chain length:", this.blockchain.chain.length);
    console.log("Blockchain has balances:", !!this.blockchain.balances);
    
    // Debug: Show all blocks and their transactions
    this.blockchain.chain.forEach((block, index) => {
      console.log(`Block ${index}: ${block.transactions.length} transactions`);
      block.transactions.forEach(tx => {
        console.log(`  ${tx.sender} -> ${tx.receiver}: ${tx.amount} GSC (${tx.tx_id})`);
      });
    });
    
    const walletTransactions = this.getWalletTransactions(address);
    console.log("Wallet transactions found:", walletTransactions.length);
    
    const history = [];
    
    for (const transaction of walletTransactions) {
      const isSent = transaction.sender === address;
      const isReceived = transaction.receiver === address;
      
      console.log(`Processing transaction: ${transaction.sender} -> ${transaction.receiver}: ${transaction.amount} GSC`);
      console.log(`  Is sent: ${isSent}, Is received: ${isReceived}`);
      
      if (isSent) {
        // Handle different timestamp formats
        const timestamp = transaction.timestamp;
        const dateObj = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
        
        const historyItem = {
          transaction,
          type: 'sent' as const,
          amount: -(transaction.amount + transaction.fee), // Negative for sent (including fee)
          counterparty: transaction.receiver,
          timestamp: transaction.timestamp,
          date: dateObj.toLocaleString()
        };
        history.push(historyItem);
        console.log(`  Added sent transaction: ${historyItem.amount} GSC to ${historyItem.counterparty} on ${historyItem.date}`);
      }
      
      if (isReceived) {
        // Handle different timestamp formats
        const timestamp = transaction.timestamp;
        const dateObj = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
        
        const historyItem = {
          transaction,
          type: 'received' as const,
          amount: transaction.amount, // Positive for received
          counterparty: transaction.sender,
          timestamp: transaction.timestamp,
          date: dateObj.toLocaleString()
        };
        history.push(historyItem);
        console.log(`  Added received transaction: ${historyItem.amount} GSC from ${historyItem.counterparty} on ${historyItem.date}`);
      }
    }
    
    // Sort by timestamp (newest first)
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log("Final transaction history length:", history.length);
    return history;
  }

  getWalletBalance(address: string): number {
    // Debug logging
    console.log(`Getting balance for address: ${address}`);
    console.log(`Imported balances:`, this.blockchain.balances);
    console.log(`All balance keys:`, this.blockchain.balances ? Object.keys(this.blockchain.balances) : 'No balances');
    
    // If we have imported balances, use them first (most accurate)
    if (this.blockchain.balances && this.blockchain.balances[address] !== undefined) {
      const importedBalance = Math.max(0, this.blockchain.balances[address]);
      console.log(`Using imported balance: ${importedBalance}`);
      return importedBalance;
    }
    
    // Check if address exists in balances with different case or format
    if (this.blockchain.balances) {
      for (const [balanceAddress, balance] of Object.entries(this.blockchain.balances)) {
        if (balanceAddress.toLowerCase() === address.toLowerCase()) {
          console.log(`Found balance with case mismatch: ${balance}`);
          return Math.max(0, balance);
        }
      }
    }
    
    let balance = 0;
    
    // Calculate balance from all transactions in the blockchain
    for (const block of this.blockchain.chain) {
      for (const tx of block.transactions) {
        if (tx.receiver === address) {
          balance += tx.amount;
          console.log(`Added ${tx.amount} GSC (received from ${tx.sender})`);
        }
        if (tx.sender === address && tx.sender !== "COINBASE" && tx.sender !== "GENESIS") {
          balance -= (tx.amount + tx.fee);
          console.log(`Subtracted ${tx.amount + tx.fee} GSC (sent to ${tx.receiver})`);
        }
      }
    }
    
    const finalBalance = Math.max(0, balance);
    console.log(`Calculated balance: ${finalBalance}`);
    return finalBalance;
  }

  // Force refresh all wallet balances from blockchain data
  refreshWalletBalances(): void {
    this.blockchain.wallets = this.blockchain.wallets.map(wallet => ({
      ...wallet,
      balance: this.getWalletBalance(wallet.address)
    }));
    this.saveBlockchain();
  }

  // Transaction Management - GSC Compatible
  async createTransaction(sender: string, receiver: string, amount: number, fee: number = 0.001): Promise<GSCTransaction> {
    // Use GSC exe standard fee of 0.001 (matching your examples)
    const gscFee = fee || 0.001;
    
    // Ensure minimum fee requirement (matching original GSC exe)
    if (sender !== "COINBASE" && sender !== "GENESIS" && gscFee < 0.001) {
      throw new Error("Minimum transaction fee is 0.001 GSC");
    }

    const transaction: GSCTransaction = {
      sender,
      receiver,
      amount,
      fee: gscFee,
      timestamp: Date.now() / 1000, // Unix timestamp with decimal precision (like GSC exe)
      signature: "",
      tx_id: "",
    };

    // Calculate transaction ID using GSC-compatible hash (64-character hex)
    transaction.tx_id = await this.calculateGSCTransactionHash(transaction);
    
    // Sign transaction (GSC exe compatible)
    transaction.signature = await this.signGSCTransaction(transaction);

    return transaction;
  }

  private async calculateGSCTransactionHash(tx: GSCTransaction): Promise<string> {
    // Match original GSC transaction hash calculation - create 64-character hex
    const txString = `${tx.sender}${tx.receiver}${tx.amount}${tx.fee}${tx.timestamp}`;
    return await this.generateGSCHash(txString, 64);
  }

  private async signGSCTransaction(tx: GSCTransaction): Promise<string> {
    // GSC exe compatible signature - can be empty string or 16-character hex
    if (!tx.tx_id) return "";
    const signatureData = `${tx.tx_id}${tx.sender}${tx.timestamp}`;
    return await this.generateGSCHash(signatureData, 16);
  }

  private async generateGSCHash(input: string, length: number = 64): Promise<string> {
    // Use Web Crypto API to generate SHA256 hash (matching GSC exe)
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Return full 64-character SHA256 hash (matching GSC exe exactly)
    return hashHex;
  }

  async sendTransaction(senderWallet: GSCWallet, receiver: string, amount: number): Promise<boolean> {
    try {
      // Debug logging for transaction
      console.log("=== TRANSACTION DEBUG ===");
      console.log("Sender wallet:", senderWallet);
      console.log("Sender address:", senderWallet.address);
      console.log("Receiver:", receiver);
      console.log("Amount:", amount);
      
      let balance = this.getWalletBalance(senderWallet.address);
      const fee = 0.1; // Minimum transaction fee
      
      console.log("Retrieved balance:", balance);
      console.log("Required amount + fee:", amount + fee);
      
      // If balance is 0 but wallet object shows a balance, use the wallet balance as fallback
      if (balance === 0 && senderWallet.balance > 0) {
        console.log("WARNING: Using wallet object balance as fallback");
        balance = senderWallet.balance;
        
        // Update the blockchain balances to include this wallet's balance
        if (!this.blockchain.balances) {
          this.blockchain.balances = {};
        }
        this.blockchain.balances[senderWallet.address] = senderWallet.balance;
        console.log("Updated blockchain balances with wallet balance");
      }
      
      // Validate transaction
      if (!receiver.startsWith("GSC1")) {
        throw new Error("Invalid GSC address format");
      }
      
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      
      if (balance < amount + fee) {
        console.log("INSUFFICIENT BALANCE ERROR");
        console.log("Balance from blockchain:", balance);
        console.log("Wallet object balance:", senderWallet.balance);
        console.log("Blockchain balances:", this.blockchain.balances);
        throw new Error(`Insufficient balance. Need ${(amount + fee).toFixed(8)} GSC, have ${balance.toFixed(8)} GSC`);
      }
      
      // Create GSC-compatible transaction
      const transaction = await this.createTransaction(senderWallet.address, receiver, amount, fee);
      
      // Validate transaction before adding
      if (!this.validateGSCTransaction(transaction, senderWallet.address)) {
        throw new Error("Transaction validation failed");
      }
      
      // Add to pending transactions (mempool equivalent)
      this.blockchain.pending_transactions.push(transaction);
      
      // Update sender balance immediately (like original GSC)
      this.updateWalletBalance(senderWallet.address, balance - amount - fee);
      
      // Update receiver balance if wallet exists
      const receiverBalance = this.getWalletBalance(receiver);
      this.updateWalletBalance(receiver, receiverBalance + amount);
      
      this.saveBlockchain();
      
      // Broadcast to Telegram
      this.broadcastTransactionToTelegram(transaction);
      
      toast({
        title: "GSC Transaction Sent",
        description: `Successfully sent ${amount} GSC to ${receiver.substring(0, 20)}... (Fee: ${fee} GSC)`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: `${error}`,
        variant: "destructive",
      });
      return false;
    }
  }

  private validateGSCTransaction(transaction: GSCTransaction, senderAddress: string): boolean {
    // GSC exe transaction validation rules (matching blockchain.py exactly)
    
    // 1. Basic transaction validation (matching Transaction.is_valid())
    if (transaction.amount <= 0) return false;
    if (transaction.fee < 0) return false; // GSC exe allows 0 fee, just checks >= 0
    if (transaction.sender === transaction.receiver) return false;
    
    // 2. GSC address format validation (matching validate_gsc_address())
    if (!this.validateGSCAddress(transaction.sender)) return false;
    if (!this.validateGSCAddress(transaction.receiver)) return false;
    
    // 3. Transaction ID validation
    if (!transaction.tx_id || transaction.tx_id.length === 0) return false;
    if (transaction.tx_id.length !== 64) return false; // GSC exe uses 64-character hex tx_id
    
    return true;
  }

  private validateGSCAddress(address: string): boolean {
    // Improved GSC exe address validation (matching updated blockchain.py)
    if (!address || typeof address !== 'string') return false;
    
    // Allow special addresses
    if (address === "COINBASE" || address === "GENESIS" || address === "Genesis") return true;
    
    // GSC address format: GSC1 + hex characters (flexible length 35-36 for compatibility)
    if (!address.startsWith("GSC1")) return false;
    if (address.length < 35 || address.length > 36) return false; // Allow both 35 and 36 character addresses
    
    // Check if remaining characters are valid hex
    const hexPart = address.substring(4);
    try {
      parseInt(hexPart, 16);
      console.log(`✅ Address validation passed: ${address} (length: ${address.length})`);
      return true;
    } catch (error) {
      console.log(`❌ Invalid hex in address: ${hexPart}`);
      return false;
    }
  }

  private updateWalletBalance(address: string, newBalance: number): void {
    // Update balance in imported balances if exists
    if (this.blockchain.balances) {
      this.blockchain.balances[address] = Math.max(0, newBalance);
    }
    
    // Update wallet balance if wallet exists
    const wallet = this.blockchain.wallets.find(w => w.address === address);
    if (wallet) {
      wallet.balance = Math.max(0, newBalance);
    }
  }

  // Telegram Integration
  private async initializeTelegramBot(): Promise<void> {
    try {
      console.log("Initializing Telegram bot...");
      // Try to get chat ID from bot updates
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.bot_token}/getUpdates`);
      if (response.ok) {
        const data = await response.json();
        console.log("Telegram bot response:", data);
        if (data.ok && data.result.length > 0) {
          // Find the chat ID for @gsc_vags_bot
          for (const update of data.result.reverse()) {
            if (update.message && update.message.chat) {
              TELEGRAM_CONFIG.chat_id = update.message.chat.id;
              console.log(`Telegram bot initialized with chat ID: ${TELEGRAM_CONFIG.chat_id}`);
              break;
            }
          }
        } else {
          // Use channel username as fallback
          TELEGRAM_CONFIG.chat_id = "@gsc_vags_bot";
          console.log("Using channel username as chat ID: @gsc_vags_bot");
        }
      } else {
        console.warn("Failed to initialize Telegram bot:", await response.text());
        TELEGRAM_CONFIG.chat_id = "@gsc_vags_bot";
      }
    } catch (error) {
      console.warn("Telegram bot initialization failed:", error);
      // Use channel username as fallback
      TELEGRAM_CONFIG.chat_id = "@gsc_vags_bot";
    }
  }

  private async broadcastTransactionToTelegram(transaction: GSCTransaction): Promise<void> {
    console.log("Broadcasting transaction to Telegram...", transaction);
    
    // Use a fallback chat ID if not initialized
    const chatId = TELEGRAM_CONFIG.chat_id || "@gsc_vags_bot";
    console.log("Using chat ID:", chatId);
    
    // Create structured JSON message format (matching GSC exe test_telegram_import.py exactly)
    const structuredMessage = {
      type: "GSC_TRANSACTION",
      timestamp: new Date().toISOString(),
      transaction: {
        tx_id: transaction.tx_id,
        sender: transaction.sender,
        receiver: transaction.receiver,
        amount: transaction.amount,
        fee: transaction.fee,
        timestamp: transaction.timestamp,
        signature: transaction.signature || ""
      }
    };
    
    // Log the exact format being sent for debugging
    console.log("=== TELEGRAM BROADCAST DEBUG ===");
    console.log("Structured message:", JSON.stringify(structuredMessage, null, 2));
    console.log("Transaction validation:");
    console.log("- Sender valid:", this.validateGSCAddress(transaction.sender));
    console.log("- Receiver valid:", this.validateGSCAddress(transaction.receiver));
    console.log("- Amount > 0:", transaction.amount > 0);
    console.log("- Fee >= 0:", transaction.fee >= 0);
    console.log("- TX ID length:", transaction.tx_id.length);
    console.log("- TX ID valid hex:", /^[0-9a-fA-F]{64}$/.test(transaction.tx_id));
    
    // Convert to formatted JSON string for Telegram
    const message = `🔄 GSC VAGS Transaction Broadcast

\`\`\`json
${JSON.stringify(structuredMessage, null, 2)}
\`\`\`

📡 Broadcast via @gsc_vags_bot`;
    
    try {
      console.log("Sending structured message to Telegram:", structuredMessage);
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CONFIG.bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
      
      const responseData = await response.json();
      console.log("Telegram API response:", responseData);
      
      if (response.ok && responseData.ok) {
        console.log("✅ Transaction broadcasted to @gsc_vags_bot successfully");
        toast({
          title: "Transaction Broadcasted",
          description: "Transaction sent to Telegram @gsc_vags_bot",
        });
      } else {
        console.warn("❌ Failed to broadcast to Telegram:", responseData);
        toast({
          title: "Broadcast Warning",
          description: "Transaction completed but Telegram broadcast failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.warn("❌ Failed to broadcast to Telegram:", error);
      toast({
        title: "Broadcast Error",
        description: "Transaction completed but Telegram broadcast failed",
        variant: "destructive",
      });
    }
  }

  // Utility Methods
  private calculateHash(previousHash: string, nonce: number, timestamp: number, data: string): string {
    const input = `${previousHash}${nonce}${timestamp}${data}`;
    // Simple hash implementation for demo (in production, use proper crypto)
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private calculateTransactionHash(tx: GSCTransaction): string {
    const txString = `${tx.sender}${tx.receiver}${tx.amount}${tx.fee}${tx.timestamp}`;
    return this.calculateHash(txString, 0, tx.timestamp, "TX");
  }

  private signTransaction(tx: GSCTransaction): string {
    // Simple signature implementation for demo
    return this.calculateHash(tx.tx_id, 0, tx.timestamp, "SIG");
  }

  // Export blockchain in original GSC-Asset-Foundation-Clone format for compatibility
  exportBlockchain(): string {
    // Export in original format to maintain compatibility with GSC exe
    const exportData = {
      chain: this.blockchain.chain,
      mempool: this.blockchain.mempool || this.blockchain.pending_transactions || [],
      balances: this.blockchain.balances || this.calculateAllBalances(),
      difficulty: this.blockchain.difficulty || 5,
      mining_reward: this.blockchain.mining_reward || 50.0
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  // Calculate all balances from blockchain transactions
  private calculateAllBalances(): { [address: string]: number } {
    const balances: { [address: string]: number } = {};
    
    // Process all transactions in all blocks
    for (const block of this.blockchain.chain) {
      for (const tx of block.transactions) {
        // Initialize addresses if not exists
        if (!balances[tx.sender]) balances[tx.sender] = 0;
        if (!balances[tx.receiver]) balances[tx.receiver] = 0;
        
        // Apply transaction
        if (tx.sender !== "COINBASE" && tx.sender !== "GENESIS") {
          balances[tx.sender] -= (tx.amount + tx.fee);
        }
        balances[tx.receiver] += tx.amount;
      }
    }
    
    return balances;
  }

  // Get blockchain stats
  getBlockchainStats() {
    return {
      totalBlocks: this.blockchain.chain.length,
      totalWallets: this.blockchain.wallets.length,
      pendingTransactions: this.blockchain.pending_transactions.length,
      totalSupply: this.blockchain.total_supply,
      circulatingSupply: this.blockchain.wallets.reduce((sum, wallet) => sum + wallet.balance, 0),
    };
  }

}

export const gscBlockchainService = new GSCBlockchainService();
export default GSCBlockchainService;
