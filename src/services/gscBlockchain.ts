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

class GSCBlockchainService {
  private blockchain: GSCBlockchain | null = null;
  private storage_key = "gsc_blockchain_data";

  constructor() {
    this.loadBlockchain();
  }

  private loadBlockchain(): void {
    try {
      console.log("=== LOADING BLOCKCHAIN ===");
      
      // Check for imported blockchain data first
      const imported = localStorage.getItem('gsc_blockchain');
      if (imported) {
        console.log("Found imported blockchain data, loading...");
        const importedData = JSON.parse(imported);
        
        this.blockchain = {
          chain: importedData.chain || [],
          pending_transactions: importedData.mempool || importedData.pending_transactions || [],
          wallets: [],
          total_supply: importedData.total_supply || 21750000000000,
          balances: importedData.balances || {},
          difficulty: importedData.difficulty || 4,
          mining_reward: importedData.mining_reward || 50,
          mempool: importedData.mempool || importedData.pending_transactions || []
        };
        
        // Create wallets from imported balances
        if (importedData.balances) {
          Object.entries(importedData.balances).forEach(([address, balance]) => {
            if (address !== "GENESIS" && address !== "COINBASE" && address.startsWith("GSC1")) {
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
              this.blockchain!.wallets.push(wallet);
            }
          });
        }
        
        localStorage.removeItem('gsc_blockchain');
        this.saveBlockchain();
        return;
      }
      
      // Load existing blockchain
      const stored = localStorage.getItem(this.storage_key);
      if (stored) {
        this.blockchain = JSON.parse(stored);
        this.initializeBlockchainAfterImport();
      } else {
        this.createGenesisBlock();
      }
    } catch (error) {
      console.error("Error loading blockchain:", error);
      this.createGenesisBlock();
    }
  }

  private createGenesisBlock(): void {
    console.log("Creating genesis block...");
    this.blockchain = {
      chain: [{
        index: 0,
        timestamp: Date.now(),
        transactions: [],
        previous_hash: "0",
        nonce: 0,
        hash: "genesis_hash",
        merkle_root: "",
        difficulty: 4,
        miner: "GENESIS",
        reward: 0
      }],
      pending_transactions: [],
      wallets: [],
      total_supply: 21750000000000,
      balances: {},
      difficulty: 4,
      mining_reward: 50
    };
    this.saveBlockchain();
  }

  private saveBlockchain(): void {
    try {
      if (this.blockchain) {
        localStorage.setItem(this.storage_key, JSON.stringify(this.blockchain));
      }
    } catch (error) {
      console.error("Error saving blockchain:", error);
    }
  }

  // Get all wallets
  getWallets(): GSCWallet[] {
    if (!this.blockchain || !Array.isArray(this.blockchain.wallets)) {
      return [];
    }
    return this.blockchain.wallets;
  }

  // Get all transactions
  getAllTransactions(): GSCTransaction[] {
    if (!this.blockchain || !Array.isArray(this.blockchain.chain)) {
      return [];
    }
    
    const allTransactions: GSCTransaction[] = [];
    for (const block of this.blockchain.chain) {
      if (block && Array.isArray(block.transactions)) {
        allTransactions.push(...block.transactions);
      }
    }
    
    // Add pending transactions
    if (Array.isArray(this.blockchain.pending_transactions)) {
      allTransactions.push(...this.blockchain.pending_transactions);
    }
    
    return allTransactions;
  }

  // Get wallet balance
  getWalletBalance(address: string): number {
    if (!this.blockchain) return 0;
    
    // Check balances object first
    if (this.blockchain.balances && this.blockchain.balances[address] !== undefined) {
      return this.blockchain.balances[address];
    }
    
    // Check wallet object
    if (Array.isArray(this.blockchain.wallets)) {
      const wallet = this.blockchain.wallets.find(w => w && w.address === address);
      if (wallet && wallet.balance !== undefined) {
        return wallet.balance;
      }
    }
    
    return 0;
  }

  // Get transaction history for address
  getTransactionHistory(address: string): GSCTransaction[] {
    if (!this.blockchain || !Array.isArray(this.blockchain.chain)) {
      return [];
    }

    const transactions: GSCTransaction[] = [];
    
    // Search through all blocks
    for (const block of this.blockchain.chain) {
      if (!block || !Array.isArray(block.transactions)) continue;
      
      for (const tx of block.transactions) {
        if (tx && (tx.sender === address || tx.receiver === address)) {
          transactions.push(tx);
        }
      }
    }
    
    // Add pending transactions
    if (Array.isArray(this.blockchain.pending_transactions)) {
      for (const tx of this.blockchain.pending_transactions) {
        if (tx && (tx.sender === address || tx.receiver === address)) {
          transactions.push(tx);
        }
      }
    }
    
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Create new wallet
  createWallet(name: string): GSCWallet {
    if (!this.blockchain) {
      this.createGenesisBlock();
    }

    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 15);
    const address = `GSC1${timestamp.toString(16)}${randomPart}`;
    
    const wallet: GSCWallet = {
      name: name,
      address: address,
      private_key: this.generatePrivateKey(),
      public_key: this.generatePublicKey(address),
      balance: 0,
      created: new Date().toISOString(),
      encrypted: false
    };

    this.blockchain!.wallets.push(wallet);
    this.saveBlockchain();
    
    return wallet;
  }

  // Import wallet with address
  importWalletWithAddress(name: string, address: string, private_key: string, public_key?: string): GSCWallet {
    if (!this.blockchain) {
      this.createGenesisBlock();
    }

    // Check if wallet already exists
    const existingWallet = this.blockchain!.wallets.find(w => w && w.address === address);
    if (existingWallet) {
      throw new Error("Wallet with this address already exists");
    }

    const balance = this.getWalletBalance(address);
    
    const wallet: GSCWallet = {
      name: name,
      address: address,
      private_key: private_key,
      public_key: public_key || this.generatePublicKey(address),
      balance: balance,
      created: new Date().toISOString(),
      encrypted: false
    };

    this.blockchain!.wallets.push(wallet);
    this.saveBlockchain();
    
    return wallet;
  }

  // Generate private key
  private generatePrivateKey(): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  // Generate public key
  private generatePublicKey(address: string): string {
    return address.substring(4) + Math.random().toString(16).substring(2, 10);
  }

  // Create transaction - GSC Compatible
  async createTransaction(sender: string, receiver: string, amount: number, fee: number = 0.1): Promise<GSCTransaction> {
    // Use GSC minimum fee of 0.1 GSC
    const gscFee = fee || 0.1;
    
    // Ensure minimum fee requirement
    if (sender !== "COINBASE" && sender !== "GENESIS" && gscFee < 0.1) {
      throw new Error("Minimum transaction fee is 0.1 GSC");
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

  // Generate GSC hash - Exact Reference Implementation
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

  private async calculateGSCTransactionHash(tx: GSCTransaction): Promise<string> {
    // Match original GSC transaction hash calculation - create 64-character hex
    const txString = `${tx.sender}${tx.receiver}${tx.amount}${tx.fee}${tx.timestamp}`;
    return await this.generateGSCHash(txString, 64);
  }

  // Sign GSC transaction
  private async signGSCTransaction(tx: GSCTransaction): Promise<string> {
    if (!tx.tx_id) return "";
    const signatureData = `${tx.tx_id}${tx.sender}${tx.timestamp}`;
    return await this.generateGSCHash(signatureData, 16);
  }

  // Send transaction
  async sendTransaction(senderWallet: GSCWallet, receiver: string, amount: number): Promise<boolean> {
    try {
      if (!this.blockchain || !senderWallet) {
        console.error("Blockchain or sender wallet not initialized");
        return false;
      }
      
      let balance = this.getWalletBalance(senderWallet.address);
      const fee = 0.1; // Minimum transaction fee is 0.1 GSC
      
      if (balance === 0 && senderWallet.balance > 0) {
        balance = senderWallet.balance;
        if (!this.blockchain.balances) {
          this.blockchain.balances = {};
        }
        this.blockchain.balances[senderWallet.address] = senderWallet.balance;
      }
      
      if (!receiver.startsWith("GSC1")) {
        throw new Error("Invalid GSC address format");
      }
      
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      
      if (balance < amount + fee) {
        throw new Error(`Insufficient balance. Need ${(amount + fee).toFixed(8)} GSC, have ${balance.toFixed(8)} GSC`);
      }
      
      const transaction = await this.createTransaction(senderWallet.address, receiver, amount, fee);
      
      if (!this.validateGSCTransaction(transaction, senderWallet.address)) {
        throw new Error("Transaction validation failed");
      }
      
      if (!Array.isArray(this.blockchain.pending_transactions)) {
        this.blockchain.pending_transactions = [];
      }
      this.blockchain.pending_transactions.push(transaction);
      
      this.updateWalletBalance(senderWallet.address, balance - amount - fee);
      const receiverBalance = this.getWalletBalance(receiver);
      this.updateWalletBalance(receiver, receiverBalance + amount);
      
      this.saveBlockchain();
      
      // Broadcast transaction to network (Telegram)
      await this.broadcastTransaction(transaction);
      
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

  // Validate GSC transaction
  private validateGSCTransaction(transaction: GSCTransaction, senderAddress: string): boolean {
    if (transaction.amount <= 0) return false;
    if (transaction.fee < 0) return false;
    if (transaction.sender === transaction.receiver) return false;
    if (!this.validateGSCAddress(transaction.sender)) return false;
    if (!this.validateGSCAddress(transaction.receiver)) return false;
    if (!transaction.tx_id || transaction.tx_id.length !== 64) return false;
    return true;
  }

  // Validate GSC address
  private validateGSCAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;
    if (address === "COINBASE" || address === "GENESIS" || address === "Genesis") return true;
    if (!address.startsWith("GSC1")) return false;
    if (address.length < 35 || address.length > 36) return false;
    
    const hexPart = address.substring(4);
    try {
      parseInt(hexPart, 16);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Update wallet balance
  private updateWalletBalance(address: string, newBalance: number): void {
    if (!this.blockchain.balances) {
      this.blockchain.balances = {};
    }
    this.blockchain.balances[address] = Math.max(0, newBalance);
    
    if (Array.isArray(this.blockchain.wallets)) {
      const wallet = this.blockchain.wallets.find(w => w && w.address === address);
      if (wallet) {
        wallet.balance = Math.max(0, newBalance);
      }
    }
  }

  // Get blockchain stats
  getBlockchainStats() {
    if (!this.blockchain) {
      return {
        totalBlocks: 0,
        totalWallets: 0,
        totalSupply: 0,
        pendingTransactions: 0,
        difficulty: 4,
        miningReward: 50,
        circulatingSupply: 0
      };
    }
    
    return {
      totalBlocks: Array.isArray(this.blockchain.chain) ? this.blockchain.chain.length : 0,
      totalWallets: Array.isArray(this.blockchain.wallets) ? this.blockchain.wallets.length : 0,
      pendingTransactions: Array.isArray(this.blockchain.pending_transactions) ? this.blockchain.pending_transactions.length : 0,
      totalSupply: this.blockchain.total_supply || 0,
      difficulty: this.blockchain.difficulty || 4,
      miningReward: this.blockchain.mining_reward || 50,
      circulatingSupply: Array.isArray(this.blockchain.wallets) ? this.blockchain.wallets.reduce((sum, wallet) => sum + (wallet?.balance || 0), 0) : 0,
    };
  }

  // Search for transaction by ID
  searchTransactionById(txId: string): GSCTransaction | null {
    if (!txId || !this.blockchain || !Array.isArray(this.blockchain.chain)) {
      return null;
    }

    // Search in all blocks
    for (const block of this.blockchain.chain) {
      if (!block || !Array.isArray(block.transactions)) continue;
      
      for (const transaction of block.transactions) {
        if (transaction && transaction.tx_id === txId) {
          return transaction;
        }
      }
    }
    
    // Search in pending transactions
    if (Array.isArray(this.blockchain.pending_transactions)) {
      for (const transaction of this.blockchain.pending_transactions) {
        if (transaction && transaction.tx_id === txId) {
          return transaction;
        }
      }
    }
    
    return null;
  }

  // Initialize blockchain after import
  initializeBlockchainAfterImport(): void {
    if (!this.blockchain) {
      this.blockchain = {
        chain: [],
        wallets: [],
        pending_transactions: [],
        balances: {},
        difficulty: 4,
        mining_reward: 50,
        total_supply: 0
      };
      return;
    }

    if (!Array.isArray(this.blockchain.chain)) {
      this.blockchain.chain = [];
    }
    
    if (!Array.isArray(this.blockchain.wallets)) {
      this.blockchain.wallets = [];
    }
    
    if (!Array.isArray(this.blockchain.pending_transactions)) {
      this.blockchain.pending_transactions = [];
    }
    
    if (!this.blockchain.balances || typeof this.blockchain.balances !== 'object') {
      this.blockchain.balances = {};
    }

    this.blockchain.difficulty = this.blockchain.difficulty || 4;
    this.blockchain.mining_reward = this.blockchain.mining_reward || 50;
    this.blockchain.total_supply = this.blockchain.total_supply || 0;
  }

  // Refresh blockchain data while preserving existing wallets
  refreshBlockchainData(): void {
    try {
      console.log("=== REFRESHING BLOCKCHAIN DATA ===");
      
      // Check for new imported blockchain data
      const imported = localStorage.getItem('gsc_blockchain');
      if (!imported) {
        console.log("No new blockchain data to refresh");
        return;
      }

      console.log("Found new blockchain data, refreshing...");
      const importedData = JSON.parse(imported);
      
      if (!this.blockchain) {
        // If no existing blockchain, create new one
        this.loadBlockchain();
        return;
      }

      // Preserve existing wallets
      const existingWallets = [...this.blockchain.wallets];
      console.log(`Preserving ${existingWallets.length} existing wallets`);

      // Update blockchain data
      this.blockchain.chain = importedData.chain || this.blockchain.chain;
      this.blockchain.pending_transactions = importedData.mempool || importedData.pending_transactions || this.blockchain.pending_transactions;
      this.blockchain.total_supply = importedData.total_supply || this.blockchain.total_supply;
      this.blockchain.balances = importedData.balances || this.blockchain.balances;
      this.blockchain.difficulty = importedData.difficulty || this.blockchain.difficulty;
      this.blockchain.mining_reward = importedData.mining_reward || this.blockchain.mining_reward;
      this.blockchain.mempool = importedData.mempool || importedData.pending_transactions || this.blockchain.mempool;

      // Update existing wallet balances from new blockchain data
      existingWallets.forEach(wallet => {
        if (wallet && wallet.address && this.blockchain!.balances) {
          const newBalance = this.blockchain!.balances[wallet.address];
          if (newBalance !== undefined) {
            console.log(`Updating balance for ${wallet.name}: ${wallet.balance} -> ${newBalance} GSC`);
            wallet.balance = Math.max(0, newBalance as number);
          }
        }
      });

      // Create wallets for new addresses that don't exist in current wallets
      if (importedData.balances) {
        Object.entries(importedData.balances).forEach(([address, balance]) => {
          if (address !== "GENESIS" && address !== "COINBASE" && address.startsWith("GSC1")) {
            // Check if wallet already exists
            const existingWallet = existingWallets.find(w => w && w.address === address);
            if (!existingWallet) {
              const shortAddress = address.substring(4, 14);
              const newWallet: GSCWallet = {
                name: `Wallet_${shortAddress}`,
                address: address,
                private_key: "",
                public_key: "",
                balance: Math.max(0, balance as number),
                created: new Date().toISOString(),
                encrypted: false
              };
              existingWallets.push(newWallet);
              console.log(`Added new wallet for ${address} with balance ${balance} GSC`);
            }
          }
        });
      }

      // Update wallets array
      this.blockchain.wallets = existingWallets;

      // Clean up and save
      localStorage.removeItem('gsc_blockchain');
      this.saveBlockchain();
      
      console.log(`Blockchain refreshed successfully. Total wallets: ${this.blockchain.wallets.length}`);
      
    } catch (error) {
      console.error("Error refreshing blockchain data:", error);
    }
  }

  // Broadcast transaction to @gsc_vags_bot
  private async broadcastTransaction(transaction: GSCTransaction): Promise<void> {
    try {
      const botToken = "8360297293:AAH8uHoBVMe09D5RguuRMRHb5_mcB3k7spo";
      
      // First test if bot token is valid
      console.log("🔍 Testing @gsc_vags_bot token validity...");
      try {
        const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const botInfo = await botInfoResponse.json();
        console.log("🤖 Bot info for @gsc_vags_bot:", botInfo);
        
        if (!botInfo.ok) {
          console.error("❌ Invalid bot token for @gsc_vags_bot:", botInfo.description);
          return;
        }
      } catch (tokenError) {
        console.error("❌ Bot token validation failed for @gsc_vags_bot:", tokenError);
        return;
      }
      
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
      
      // Send clean JSON format only (no markdown formatting)
      const transactionMessage = JSON.stringify(structuredMessage, null, 2);

      let success = false;
      let errorDetails = "";
      
      // Try different chat ID configurations
      const chatConfigs = [
        "@gsc_vags_bot",
        "gsc_vags_bot",
        // If the bot username doesn't work, we might need the actual chat ID
      ];
      
      for (const chatId of chatConfigs) {
        try {
          console.log(`📤 Attempting to send to: ${chatId}`);
          
          const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: transactionMessage
            })
          });
          
          const responseData = await response.json();
          if (response.ok && responseData.ok) {
            success = true;
            console.log(`✅ Transaction successfully broadcast to ${chatId}`);
            break;
          } else {
            errorDetails += `${chatId}: ${responseData.description || responseData.error_code || 'Unknown error'}. `;
            
            // Check for specific error types
            if (responseData.description) {
              if (responseData.description.includes("chat not found")) {
                console.log(`⚠️ Chat not found for ${chatId} - bot may not exist or hasn't been started`);
              } else if (responseData.description.includes("bot was blocked")) {
                console.log(`⚠️ Bot was blocked by user for ${chatId}`);
              } else if (responseData.description.includes("Forbidden")) {
                console.log(`⚠️ Bot doesn't have permission to send messages to ${chatId}`);
              }
            }
          }
        } catch (apiError) {
          console.log(`❌ API call failed for ${chatId}:`, apiError);
          errorDetails += `${chatId}: ${apiError.message}. `;
        }
      }
      
      // If all direct methods fail, try to get the correct chat ID from updates
      if (!success) {
        console.log("🔍 Trying to discover correct chat ID from bot updates...");
        try {
          const updatesResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
          const updatesData = await updatesResponse.json();
          console.log("📨 Bot updates:", updatesData);
          
          if (updatesData.ok && updatesData.result && updatesData.result.length > 0) {
            // Find the most recent message to get chat ID
            const lastUpdate = updatesData.result[updatesData.result.length - 1];
            if (lastUpdate.message && lastUpdate.message.chat) {
              const discoveredChatId = lastUpdate.message.chat.id;
              console.log(`🎯 Discovered chat ID: ${discoveredChatId}`);
              
              try {
                const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    chat_id: discoveredChatId,
                    text: transactionMessage
                  })
                });
                
                const responseData = await response.json();
                if (response.ok && responseData.ok) {
                  success = true;
                  console.log(`✅ Transaction broadcast successful using discovered chat ID: ${discoveredChatId}`);
                }
              } catch (discoveryError) {
                console.log("❌ Discovery method failed:", discoveryError);
              }
            }
          }
        } catch (updatesError) {
          console.log("❌ Failed to get bot updates:", updatesError);
        }
      }
      
      if (!success) {
        console.error(`❌ All broadcast methods failed for @gsc_vags_bot. Errors: ${errorDetails}`);
        console.log("💡 To fix: Ensure @gsc_vags_bot exists, is started, and has proper permissions");
      }
      
    } catch (error) {
      console.error("❌ Transaction broadcast error:", error);
      // Don't throw error - transaction should still succeed even if broadcast fails
    }
  }

  // Export blockchain
  exportBlockchain(): string {
    if (!this.blockchain) {
      return JSON.stringify({});
    }
    
    return JSON.stringify({
      chain: this.blockchain.chain || [],
      wallets: this.blockchain.wallets || [],
      pending_transactions: this.blockchain.pending_transactions || [],
      balances: this.blockchain.balances || {},
      difficulty: this.blockchain.difficulty || 4,
      mining_reward: this.blockchain.mining_reward || 50,
      total_supply: this.blockchain.total_supply || 0
    }, null, 2);
  }
}

export const gscBlockchainService = new GSCBlockchainService();
export default GSCBlockchainService;
