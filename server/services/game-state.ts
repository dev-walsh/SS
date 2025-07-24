import fs from 'fs';
import path from 'path';

interface GameBet {
  id: string;
  type: 'number' | 'color' | 'odds_evens' | 'dozen' | 'column' | 'high_low';
  value: number | string;
  amount: number;
  payout: number;
  timestamp: Date;
}

interface GameState {
  id: string;
  walletAddress: string;
  phase: 'waiting' | 'betting' | 'spinning' | 'result';
  bets: GameBet[];
  totalBetAmount: number;
  winningNumber: number | null;
  winningBets: GameBet[];
  lastWinnings: number;
  roundNumber: number;
  startTime: Date;
  endTime: Date | null;
  lastActivity: Date;
}

interface PlayerStats {
  walletAddress: string;
  totalRounds: number;
  totalWins: number;
  totalLosses: number;
  totalWinnings: number;
  biggestWin: number;
  favoriteNumbers: number[];
  winRate: number;
  averageBet: number;
  lastPlayed: Date;
}

class GameStateService {
  private gameStates: Map<string, GameState> = new Map();
  private playerStats: Map<string, PlayerStats> = new Map();
  private readonly GAME_STATES_FILE = path.join(process.cwd(), 'data', 'game-states.json');
  private readonly PLAYER_STATS_FILE = path.join(process.cwd(), 'data', 'player-stats.json');

  constructor() {
    this.loadGameStates();
    this.loadPlayerStats();
    
    // Auto-save periodically
    setInterval(() => this.saveData(), 15000); // Every 15 seconds

    // Clean up old game states periodically
    setInterval(() => this.cleanupOldGames(), 300000); // Every 5 minutes
  }

  private loadGameStates(): void {
    try {
      if (fs.existsSync(this.GAME_STATES_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.GAME_STATES_FILE, 'utf8'));
        
        Object.entries(data).forEach(([walletAddress, gameData]: [string, any]) => {
          this.gameStates.set(walletAddress, {
            ...gameData,
            startTime: new Date(gameData.startTime),
            endTime: gameData.endTime ? new Date(gameData.endTime) : null,
            lastActivity: new Date(gameData.lastActivity),
            bets: gameData.bets.map((bet: any) => ({
              ...bet,
              timestamp: new Date(bet.timestamp)
            })),
            winningBets: gameData.winningBets.map((bet: any) => ({
              ...bet,
              timestamp: new Date(bet.timestamp)
            }))
          });
        });
        
        console.log(`Loaded game states for ${this.gameStates.size} players`);
      }
    } catch (error) {
      console.error('Failed to load game states:', error);
    }
  }

  private loadPlayerStats(): void {
    try {
      if (fs.existsSync(this.PLAYER_STATS_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.PLAYER_STATS_FILE, 'utf8'));
        
        Object.entries(data).forEach(([walletAddress, statsData]: [string, any]) => {
          this.playerStats.set(walletAddress, {
            ...statsData,
            lastPlayed: new Date(statsData.lastPlayed)
          });
        });
        
        console.log(`Loaded stats for ${this.playerStats.size} players`);
      }
    } catch (error) {
      console.error('Failed to load player stats:', error);
    }
  }

  private saveData(): void {
    this.saveGameStates();
    this.savePlayerStats();
  }

  private saveGameStates(): void {
    try {
      const dataDir = path.dirname(this.GAME_STATES_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const data: Record<string, any> = {};
      this.gameStates.forEach((gameState, walletAddress) => {
        data[walletAddress] = gameState;
      });

      fs.writeFileSync(this.GAME_STATES_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save game states:', error);
    }
  }

  private savePlayerStats(): void {
    try {
      const dataDir = path.dirname(this.PLAYER_STATS_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const data: Record<string, any> = {};
      this.playerStats.forEach((stats, walletAddress) => {
        data[walletAddress] = stats;
      });

      fs.writeFileSync(this.PLAYER_STATS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save player stats:', error);
    }
  }

  private cleanupOldGames(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleanedCount = 0;

    this.gameStates.forEach((gameState, walletAddress) => {
      if (gameState.lastActivity < oneHourAgo && gameState.phase === 'result') {
        this.gameStates.delete(walletAddress);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old game states`);
    }
  }

  public async initializeGame(walletAddress: string): Promise<GameState> {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const gameState: GameState = {
      id: gameId,
      walletAddress,
      phase: 'betting',
      bets: [],
      totalBetAmount: 0,
      winningNumber: null,
      winningBets: [],
      lastWinnings: 0,
      roundNumber: 1,
      startTime: new Date(),
      endTime: null,
      lastActivity: new Date()
    };

    this.gameStates.set(walletAddress, gameState);
    console.log(`Initialized game for ${walletAddress}: ${gameId}`);
    
    return gameState;
  }

  public async getGameState(walletAddress: string): Promise<GameState | null> {
    const gameState = this.gameStates.get(walletAddress);
    
    if (gameState) {
      gameState.lastActivity = new Date();
    }
    
    return gameState || null;
  }

  public async placeBet(walletAddress: string, bet: GameBet): Promise<void> {
    const gameState = this.gameStates.get(walletAddress);
    
    if (!gameState || gameState.phase !== 'betting') {
      throw new Error('Cannot place bet in current game phase');
    }

    // Check if bet of same type and value already exists
    const existingBetIndex = gameState.bets.findIndex(
      (existingBet) => existingBet.type === bet.type && existingBet.value === bet.value
    );

    if (existingBetIndex >= 0) {
      // Add to existing bet
      gameState.bets[existingBetIndex].amount += bet.amount;
    } else {
      // Add new bet
      gameState.bets.push(bet);
    }

    // Update total bet amount
    gameState.totalBetAmount = gameState.bets.reduce((sum, b) => sum + b.amount, 0);
    gameState.lastActivity = new Date();

    console.log(`Placed bet for ${walletAddress}: ${bet.type} ${bet.value} - ${bet.amount} tokens`);
  }

  public async clearBets(walletAddress: string): Promise<void> {
    const gameState = this.gameStates.get(walletAddress);
    
    if (!gameState || gameState.phase !== 'betting') {
      throw new Error('Cannot clear bets in current game phase');
    }

    gameState.bets = [];
    gameState.totalBetAmount = 0;
    gameState.lastActivity = new Date();

    console.log(`Cleared bets for ${walletAddress}`);
  }

  public async startSpin(walletAddress: string): Promise<void> {
    const gameState = this.gameStates.get(walletAddress);
    
    if (!gameState || gameState.phase !== 'betting') {
      throw new Error('Cannot start spin in current game phase');
    }

    if (gameState.bets.length === 0) {
      throw new Error('No bets placed');
    }

    gameState.phase = 'spinning';
    gameState.lastActivity = new Date();

    console.log(`Started spin for ${walletAddress}`);
  }

  public async endSpin(
    walletAddress: string,
    winningNumber: number,
    winningBets: GameBet[],
    totalWinnings: number
  ): Promise<void> {
    const gameState = this.gameStates.get(walletAddress);
    
    if (!gameState || gameState.phase !== 'spinning') {
      throw new Error('Cannot end spin in current game phase');
    }

    gameState.phase = 'result';
    gameState.winningNumber = winningNumber;
    gameState.winningBets = winningBets;
    gameState.lastWinnings = totalWinnings;
    gameState.endTime = new Date();
    gameState.lastActivity = new Date();

    // Update player statistics
    await this.updatePlayerStats(walletAddress, gameState, winningNumber, totalWinnings);

    console.log(`Ended spin for ${walletAddress}: winning number ${winningNumber}, winnings ${totalWinnings}`);
  }

  public async startNewRound(walletAddress: string): Promise<void> {
    const gameState = this.gameStates.get(walletAddress);
    
    if (!gameState) {
      // Initialize new game if none exists
      await this.initializeGame(walletAddress);
      return;
    }

    // Reset for new round
    gameState.phase = 'betting';
    gameState.bets = [];
    gameState.totalBetAmount = 0;
    gameState.winningNumber = null;
    gameState.winningBets = [];
    gameState.lastWinnings = 0;
    gameState.roundNumber++;
    gameState.startTime = new Date();
    gameState.endTime = null;
    gameState.lastActivity = new Date();

    console.log(`Started new round ${gameState.roundNumber} for ${walletAddress}`);
  }

  private async updatePlayerStats(
    walletAddress: string,
    gameState: GameState,
    winningNumber: number,
    totalWinnings: number
  ): Promise<void> {
    let stats = this.playerStats.get(walletAddress);
    
    if (!stats) {
      stats = {
        walletAddress,
        totalRounds: 0,
        totalWins: 0,
        totalLosses: 0,
        totalWinnings: 0,
        biggestWin: 0,
        favoriteNumbers: [],
        winRate: 0,
        averageBet: 0,
        lastPlayed: new Date()
      };
    }

    // Update basic stats
    stats.totalRounds++;
    stats.lastPlayed = new Date();
    
    const isWin = totalWinnings > gameState.totalBetAmount;
    
    if (isWin) {
      stats.totalWins++;
      const netWinnings = totalWinnings - gameState.totalBetAmount;
      stats.totalWinnings += netWinnings;
      stats.biggestWin = Math.max(stats.biggestWin, netWinnings);
    } else {
      stats.totalLosses++;
      stats.totalWinnings -= gameState.totalBetAmount; // Loss
    }

    // Calculate win rate
    stats.winRate = (stats.totalWins / stats.totalRounds) * 100;

    // Update favorite numbers (track number bets)
    gameState.bets.forEach(bet => {
      if (bet.type === 'number' && typeof bet.value === 'number') {
        const numberBets = stats!.favoriteNumbers;
        if (!numberBets.includes(bet.value)) {
          numberBets.push(bet.value);
        }
        // Keep only top 10 most played numbers
        if (numberBets.length > 10) {
          stats!.favoriteNumbers = numberBets.slice(0, 10);
        }
      }
    });

    // Calculate average bet
    const totalBetAmount = gameState.totalBetAmount;
    stats.averageBet = ((stats.averageBet * (stats.totalRounds - 1)) + totalBetAmount) / stats.totalRounds;

    this.playerStats.set(walletAddress, stats);
  }

  public async getPlayerStats(walletAddress: string): Promise<PlayerStats | null> {
    return this.playerStats.get(walletAddress) || null;
  }

  public async getLeaderboard(limit: number = 10): Promise<PlayerStats[]> {
    const allStats = Array.from(this.playerStats.values());
    
    return allStats
      .sort((a, b) => b.totalWinnings - a.totalWinnings)
      .slice(0, limit);
  }

  public async getActiveGames(): Promise<{
    total: number;
    betting: number;
    spinning: number;
    result: number;
  }> {
    let total = 0;
    let betting = 0;
    let spinning = 0;
    let result = 0;

    this.gameStates.forEach((gameState) => {
      total++;
      switch (gameState.phase) {
        case 'betting':
          betting++;
          break;
        case 'spinning':
          spinning++;
          break;
        case 'result':
          result++;
          break;
      }
    });

    return { total, betting, spinning, result };
  }

  public async getGameHistory(
    walletAddress: string,
    limit: number = 50
  ): Promise<{
    roundNumber: number;
    bets: GameBet[];
    winningNumber: number | null;
    totalWinnings: number;
    netResult: number;
    timestamp: Date;
  }[]> {
    // This would typically come from a more persistent storage
    // For now, we'll return the current game if it exists
    const gameState = this.gameStates.get(walletAddress);
    
    if (!gameState || gameState.phase === 'betting') {
      return [];
    }

    return [{
      roundNumber: gameState.roundNumber,
      bets: gameState.bets,
      winningNumber: gameState.winningNumber,
      totalWinnings: gameState.lastWinnings,
      netResult: gameState.lastWinnings - gameState.totalBetAmount,
      timestamp: gameState.endTime || gameState.lastActivity
    }];
  }

  public async resetPlayerData(walletAddress: string): Promise<void> {
    this.gameStates.delete(walletAddress);
    this.playerStats.delete(walletAddress);
    console.log(`Reset all data for ${walletAddress}`);
  }

  public async getGlobalStats(): Promise<{
    totalGames: number;
    totalPlayers: number;
    totalBetsPlaced: number;
    totalWinnings: number;
    averageGameDuration: number;
    mostPopularBetType: string;
  }> {
    let totalGames = 0;
    let totalBetsPlaced = 0;
    let totalWinnings = 0;
    const betTypeCounts: Record<string, number> = {};

    this.playerStats.forEach((stats) => {
      totalGames += stats.totalRounds;
      totalWinnings += stats.totalWinnings;
    });

    this.gameStates.forEach((gameState) => {
      totalBetsPlaced += gameState.bets.length;
      
      gameState.bets.forEach((bet) => {
        betTypeCounts[bet.type] = (betTypeCounts[bet.type] || 0) + 1;
      });
    });

    const mostPopularBetType = Object.entries(betTypeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'number';

    return {
      totalGames,
      totalPlayers: this.playerStats.size,
      totalBetsPlaced,
      totalWinnings,
      averageGameDuration: 120, // Placeholder: 2 minutes average
      mostPopularBetType
    };
  }
}

export const gameStateService = new GameStateService();
