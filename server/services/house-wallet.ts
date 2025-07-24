import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

interface HouseWalletStats {
  publicKey: string;
  solBalance: number;
  tokenBalance: number;
  totalCollected: number;
  totalPaidOut: number;
  profit: number;
  transactionCount: number;
  lastUpdated: Date;
}

interface Transaction {
  signature: string;
  type: 'collection' | 'payout' | 'maintenance';
  amount: number;
  timestamp: Date;
  player?: string;
}

class HouseWalletService {
  private connection: Connection;
  private houseKeypair: Keypair;
  private tokenMint: PublicKey;
  private stats: HouseWalletStats;
  private transactions: Transaction[] = [];
  private readonly STATS_FILE = path.join(process.cwd(), 'data', 'house-stats.json');
  private readonly TRANSACTIONS_FILE = path.join(process.cwd(), 'data', 'house-transactions.json');

  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    // Initialize house wallet keypair
    this.houseKeypair = this.loadOrCreateHouseWallet();
    
    this.tokenMint = new PublicKey(
      process.env.GAME_TOKEN_MINT || '11111111111111111111111111111111'
    );

    // Initialize stats
    this.stats = this.loadStats();
    this.transactions = this.loadTransactions();

    // Update balances periodically
    this.updateBalances();
    setInterval(() => this.updateBalances(), 30000); // Every 30 seconds
  }

  private loadOrCreateHouseWallet(): Keypair {
    const walletPath = path.join(process.cwd(), 'data', 'house-wallet.json');
    
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(walletPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(walletPath)) {
        // Load existing wallet
        const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
        return Keypair.fromSecretKey(new Uint8Array(walletData.secretKey));
      } else {
        // Create new wallet
        const keypair = Keypair.generate();
        const walletData = {
          publicKey: keypair.publicKey.toString(),
          secretKey: Array.from(keypair.secretKey)
        };
        
        fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
        console.log('Created new house wallet:', keypair.publicKey.toString());
        
        return keypair;
      }
    } catch (error) {
      console.error('Failed to load/create house wallet:', error);
      // Fallback to temporary wallet
      return Keypair.generate();
    }
  }

  private loadStats(): HouseWalletStats {
    try {
      if (fs.existsSync(this.STATS_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.STATS_FILE, 'utf8'));
        return {
          ...data,
          lastUpdated: new Date(data.lastUpdated)
        };
      }
    } catch (error) {
      console.error('Failed to load house stats:', error);
    }

    // Default stats
    return {
      publicKey: this.houseKeypair.publicKey.toString(),
      solBalance: 0,
      tokenBalance: 0,
      totalCollected: 0,
      totalPaidOut: 0,
      profit: 0,
      transactionCount: 0,
      lastUpdated: new Date()
    };
  }

  private saveStats(): void {
    try {
      const dataDir = path.dirname(this.STATS_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(this.STATS_FILE, JSON.stringify(this.stats, null, 2));
    } catch (error) {
      console.error('Failed to save house stats:', error);
    }
  }

  private loadTransactions(): Transaction[] {
    try {
      if (fs.existsSync(this.TRANSACTIONS_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.TRANSACTIONS_FILE, 'utf8'));
        return data.map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load house transactions:', error);
    }

    return [];
  }

  private saveTransactions(): void {
    try {
      const dataDir = path.dirname(this.TRANSACTIONS_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(this.TRANSACTIONS_FILE, JSON.stringify(this.transactions, null, 2));
    } catch (error) {
      console.error('Failed to save house transactions:', error);
    }
  }

  private async updateBalances(): Promise<void> {
    try {
      // Get SOL balance
      const solBalance = await this.connection.getBalance(this.houseKeypair.publicKey);
      this.stats.solBalance = solBalance / LAMPORTS_PER_SOL;

      // Get token balance
      try {
        const tokenAccount = await getAssociatedTokenAddress(
          this.tokenMint,
          this.houseKeypair.publicKey
        );
        const tokenAccountInfo = await this.connection.getTokenAccountBalance(tokenAccount);
        this.stats.tokenBalance = tokenAccountInfo.value.uiAmount || 0;
      } catch (error) {
        // Token account might not exist yet
        this.stats.tokenBalance = 0;
      }

      this.stats.lastUpdated = new Date();
      this.saveStats();
    } catch (error) {
      console.error('Failed to update house wallet balances:', error);
    }
  }

  public getPublicKey(): string {
    return this.houseKeypair.publicKey.toString();
  }

  public async getStats(): Promise<HouseWalletStats> {
    await this.updateBalances();
    return { ...this.stats };
  }

  public async addFunds(amount: number, playerWallet?: string): Promise<void> {
    this.stats.totalCollected += amount;
    this.stats.profit = this.stats.totalCollected - this.stats.totalPaidOut;
    this.stats.transactionCount++;

    // Record transaction
    const transaction: Transaction = {
      signature: `internal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'collection',
      amount: amount,
      timestamp: new Date(),
      player: playerWallet
    };

    this.transactions.push(transaction);
    
    // Keep only last 1000 transactions
    if (this.transactions.length > 1000) {
      this.transactions = this.transactions.slice(-1000);
    }

    this.saveStats();
    this.saveTransactions();

    console.log(`House collected ${amount} tokens from ${playerWallet || 'unknown'}`);
  }

  public async deductFunds(amount: number, playerWallet?: string): Promise<boolean> {
    // For now, we'll allow house to go negative (house credit)
    // In production, you'd want proper bankroll management
    
    this.stats.totalPaidOut += amount;
    this.stats.profit = this.stats.totalCollected - this.stats.totalPaidOut;
    this.stats.transactionCount++;

    // Record transaction
    const transaction: Transaction = {
      signature: `internal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'payout',
      amount: amount,
      timestamp: new Date(),
      player: playerWallet
    };

    this.transactions.push(transaction);
    
    // Keep only last 1000 transactions
    if (this.transactions.length > 1000) {
      this.transactions = this.transactions.slice(-1000);
    }

    this.saveStats();
    this.saveTransactions();

    console.log(`House paid out ${amount} tokens to ${playerWallet || 'unknown'}`);
    return true;
  }

  public async transferToPlayer(
    playerWallet: string,
    amount: number
  ): Promise<string | null> {
    try {
      const playerPublicKey = new PublicKey(playerWallet);
      
      // Get token accounts
      const houseTokenAccount = await getAssociatedTokenAddress(
        this.tokenMint,
        this.houseKeypair.publicKey
      );
      
      const playerTokenAccount = await getAssociatedTokenAddress(
        this.tokenMint,
        playerPublicKey
      );

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        houseTokenAccount,
        playerTokenAccount,
        this.houseKeypair.publicKey,
        amount * Math.pow(10, 9), // Assuming 9 decimals
        []
      );

      const transaction = new Transaction().add(transferInstruction);

      // Get latest blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.houseKeypair.publicKey;

      // Sign and send transaction
      transaction.sign(this.houseKeypair);
      const signature = await this.connection.sendRawTransaction(transaction.serialize());

      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');

      console.log(`Transferred ${amount} tokens to ${playerWallet}, signature: ${signature}`);
      return signature;
    } catch (error) {
      console.error('Failed to transfer tokens to player:', error);
      return null;
    }
  }

  public async getRecentTransactions(limit: number = 50): Promise<Transaction[]> {
    return this.transactions
      .slice(-limit)
      .reverse(); // Most recent first
  }

  public async validateHouseWallet(): Promise<boolean> {
    try {
      // Check if wallet exists on blockchain
      const accountInfo = await this.connection.getAccountInfo(this.houseKeypair.publicKey);
      return accountInfo !== null;
    } catch (error) {
      console.error('Failed to validate house wallet:', error);
      return false;
    }
  }

  public async initializeHouseWallet(): Promise<string | null> {
    try {
      // Request airdrop for devnet (only in development)
      if (process.env.NODE_ENV !== 'production') {
        const signature = await this.connection.requestAirdrop(
          this.houseKeypair.publicKey,
          2 * LAMPORTS_PER_SOL // 2 SOL for gas fees
        );

        await this.connection.confirmTransaction(signature, 'confirmed');
        console.log(`Airdropped 2 SOL to house wallet: ${signature}`);
        return signature;
      }

      return null;
    } catch (error) {
      console.error('Failed to initialize house wallet:', error);
      return null;
    }
  }

  public getProfit(): number {
    return this.stats.profit;
  }

  public getTotalVolume(): number {
    return this.stats.totalCollected;
  }

  public getWinRate(): number {
    if (this.stats.totalCollected === 0) return 0;
    return (this.stats.profit / this.stats.totalCollected) * 100;
  }
}

export const houseWallet = new HouseWalletService();
