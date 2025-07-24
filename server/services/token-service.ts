import fs from 'fs';
import path from 'path';

interface PlayerBalance {
  walletAddress: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastUpdated: Date;
  transactions: TokenTransaction[];
}

interface TokenTransaction {
  id: string;
  type: 'earn' | 'spend' | 'deposit' | 'withdraw';
  amount: number;
  timestamp: Date;
  description: string;
  gameRound?: string;
}

class TokenServiceClass {
  private balances: Map<string, PlayerBalance> = new Map();
  private readonly BALANCES_FILE = path.join(process.cwd(), 'data', 'player-balances.json');

  constructor() {
    this.loadBalances();
    
    // Auto-save periodically
    setInterval(() => this.saveBalances(), 10000); // Every 10 seconds
  }

  private loadBalances(): void {
    try {
      if (fs.existsSync(this.BALANCES_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.BALANCES_FILE, 'utf8'));
        
        Object.entries(data).forEach(([walletAddress, balanceData]: [string, any]) => {
          this.balances.set(walletAddress, {
            ...balanceData,
            lastUpdated: new Date(balanceData.lastUpdated),
            transactions: balanceData.transactions.map((tx: any) => ({
              ...tx,
              timestamp: new Date(tx.timestamp)
            }))
          });
        });
        
        console.log(`Loaded balances for ${this.balances.size} players`);
      }
    } catch (error) {
      console.error('Failed to load player balances:', error);
    }
  }

  private saveBalances(): void {
    try {
      const dataDir = path.dirname(this.BALANCES_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const data: Record<string, any> = {};
      this.balances.forEach((balance, walletAddress) => {
        data[walletAddress] = balance;
      });

      fs.writeFileSync(this.BALANCES_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save player balances:', error);
    }
  }

  private getOrCreateBalance(walletAddress: string): PlayerBalance {
    if (!this.balances.has(walletAddress)) {
      const newBalance: PlayerBalance = {
        walletAddress,
        balance: 1000, // Starting balance
        totalEarned: 1000, // Starting tokens count as earned
        totalSpent: 0,
        lastUpdated: new Date(),
        transactions: [
          {
            id: `init_${Date.now()}`,
            type: 'deposit',
            amount: 1000,
            timestamp: new Date(),
            description: 'Welcome bonus'
          }
        ]
      };
      
      this.balances.set(walletAddress, newBalance);
      this.saveBalances();
      
      console.log(`Created new player balance for ${walletAddress} with 1000 tokens`);
    }

    return this.balances.get(walletAddress)!;
  }

  private addTransaction(
    walletAddress: string,
    type: TokenTransaction['type'],
    amount: number,
    description: string,
    gameRound?: string
  ): void {
    const balance = this.getOrCreateBalance(walletAddress);
    
    const transaction: TokenTransaction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      timestamp: new Date(),
      description,
      gameRound
    };

    balance.transactions.push(transaction);
    
    // Keep only last 100 transactions per player
    if (balance.transactions.length > 100) {
      balance.transactions = balance.transactions.slice(-100);
    }

    balance.lastUpdated = new Date();
  }

  public async getPlayerBalance(walletAddress: string): Promise<number> {
    const balance = this.getOrCreateBalance(walletAddress);
    return balance.balance;
  }

  public async addBalance(
    walletAddress: string,
    amount: number,
    description: string = 'Game winnings',
    gameRound?: string
  ): Promise<number> {
    const balance = this.getOrCreateBalance(walletAddress);
    
    balance.balance += amount;
    balance.totalEarned += amount;
    
    this.addTransaction(walletAddress, 'earn', amount, description, gameRound);
    
    console.log(`Added ${amount} tokens to ${walletAddress}. New balance: ${balance.balance}`);
    return balance.balance;
  }

  public async deductBalance(
    walletAddress: string,
    amount: number,
    description: string = 'Game bet',
    gameRound?: string
  ): Promise<boolean> {
    const balance = this.getOrCreateBalance(walletAddress);
    
    if (balance.balance < amount) {
      console.log(`Insufficient balance for ${walletAddress}. Required: ${amount}, Available: ${balance.balance}`);
      return false;
    }

    balance.balance -= amount;
    balance.totalSpent += amount;
    
    this.addTransaction(walletAddress, 'spend', amount, description, gameRound);
    
    console.log(`Deducted ${amount} tokens from ${walletAddress}. New balance: ${balance.balance}`);
    return true;
  }

  public async transferTokens(
    fromWallet: string,
    toWallet: string,
    amount: number,
    description: string = 'Transfer'
  ): Promise<boolean> {
    const fromBalance = this.getOrCreateBalance(fromWallet);
    
    if (fromBalance.balance < amount) {
      return false;
    }

    // Deduct from sender
    fromBalance.balance -= amount;
    fromBalance.totalSpent += amount;
    this.addTransaction(fromWallet, 'spend', amount, `Transfer to ${toWallet}`);

    // Add to receiver
    const toBalance = this.getOrCreateBalance(toWallet);
    toBalance.balance += amount;
    toBalance.totalEarned += amount;
    this.addTransaction(toWallet, 'earn', amount, `Transfer from ${fromWallet}`);

    console.log(`Transferred ${amount} tokens from ${fromWallet} to ${toWallet}`);
    return true;
  }

  public async getPlayerStats(walletAddress: string): Promise<{
    balance: number;
    totalEarned: number;
    totalSpent: number;
    netProfit: number;
    transactionCount: number;
    lastActivity: Date;
  }> {
    const balance = this.getOrCreateBalance(walletAddress);
    
    return {
      balance: balance.balance,
      totalEarned: balance.totalEarned,
      totalSpent: balance.totalSpent,
      netProfit: balance.totalEarned - balance.totalSpent,
      transactionCount: balance.transactions.length,
      lastActivity: balance.lastUpdated
    };
  }

  public async getTransactionHistory(
    walletAddress: string,
    limit: number = 50
  ): Promise<TokenTransaction[]> {
    const balance = this.balances.get(walletAddress);
    
    if (!balance) {
      return [];
    }

    return balance.transactions
      .slice(-limit)
      .reverse(); // Most recent first
  }

  public async getAllPlayers(): Promise<{
    walletAddress: string;
    balance: number;
    totalEarned: number;
    totalSpent: number;
    lastActivity: Date;
  }[]> {
    const players: any[] = [];
    
    this.balances.forEach((balance, walletAddress) => {
      players.push({
        walletAddress,
        balance: balance.balance,
        totalEarned: balance.totalEarned,
        totalSpent: balance.totalSpent,
        lastActivity: balance.lastUpdated
      });
    });

    return players.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  public async getTopPlayers(limit: number = 10): Promise<{
    walletAddress: string;
    balance: number;
    totalEarned: number;
    rank: number;
  }[]> {
    const players: any[] = [];
    
    this.balances.forEach((balance, walletAddress) => {
      players.push({
        walletAddress,
        balance: balance.balance,
        totalEarned: balance.totalEarned
      });
    });

    return players
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, limit)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));
  }

  public async getTotalStats(): Promise<{
    totalPlayers: number;
    totalTokensInCirculation: number;
    totalTokensEarned: number;
    totalTokensSpent: number;
    averageBalance: number;
  }> {
    let totalBalance = 0;
    let totalEarned = 0;
    let totalSpent = 0;

    this.balances.forEach((balance) => {
      totalBalance += balance.balance;
      totalEarned += balance.totalEarned;
      totalSpent += balance.totalSpent;
    });

    const playerCount = this.balances.size;

    return {
      totalPlayers: playerCount,
      totalTokensInCirculation: totalBalance,
      totalTokensEarned: totalEarned,
      totalTokensSpent: totalSpent,
      averageBalance: playerCount > 0 ? totalBalance / playerCount : 0
    };
  }

  public async resetPlayerBalance(walletAddress: string): Promise<void> {
    this.balances.delete(walletAddress);
    console.log(`Reset balance for ${walletAddress}`);
  }

  public async backup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      process.cwd(),
      'data',
      'backups',
      `balances-backup-${timestamp}.json`
    );

    try {
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const data: Record<string, any> = {};
      this.balances.forEach((balance, walletAddress) => {
        data[walletAddress] = balance;
      });

      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
      console.log(`Created balance backup: ${backupPath}`);
      
      return backupPath;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }
}

export const tokenService = new TokenServiceClass();
