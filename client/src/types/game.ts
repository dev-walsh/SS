export type RouletteNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36;

export type BetType = 'number' | 'color' | 'odds_evens' | 'dozen' | 'column' | 'high_low' | 'split' | 'street' | 'corner' | 'line';

export type GamePhase = 'waiting' | 'betting' | 'spinning' | 'result';

export interface Bet {
  type: BetType;
  value: RouletteNumber | string | number;
  amount: number;
  payout: number;
  id?: string;
}

export interface GameStats {
  totalRounds: number;
  totalWins: number;
  totalWinnings: number;
  biggestWin: number;
}

export interface SpinResult {
  winningNumber: RouletteNumber;
  winningBets: Bet[];
  totalWinnings: number;
  houseEdge: number;
}

export interface GameSession {
  id: string;
  playerId: string;
  startTime: Date;
  endTime?: Date;
  totalBets: number;
  totalWinnings: number;
  rounds: GameRound[];
}

export interface GameRound {
  id: string;
  sessionId: string;
  roundNumber: number;
  bets: Bet[];
  spinResult: SpinResult;
  timestamp: Date;
  transactionHash?: string;
}

export interface PlayerStats {
  totalGames: number;
  totalWinnings: number;
  totalLosses: number;
  biggestWin: number;
  favoriteNumbers: RouletteNumber[];
  winRate: number;
}

// Solana-specific types
export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
}

export interface GameTransaction {
  signature: string;
  type: 'bet' | 'win' | 'loss' | 'refund';
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  blockTime?: number;
}

export interface HouseWallet {
  publicKey: string;
  tokenBalance: number;
  solBalance: number;
  totalCollected: number;
  totalPaidOut: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GameStateResponse {
  gamePhase: GamePhase;
  currentRound?: GameRound;
  playerBalance: number;
  houseBalance: number;
  canBet: boolean;
  minBet: number;
  maxBet: number;
}

export interface BetResponse {
  success: boolean;
  betId: string;
  transactionHash?: string;
  newBalance: number;
}

export interface SpinResponse {
  success: boolean;
  winningNumber: RouletteNumber;
  winningBets: Bet[];
  totalWinnings: number;
  transactionHash?: string;
  newBalance: number;
}

// WebSocket message types
export interface WSMessage {
  type: 'game_state' | 'bet_placed' | 'spin_result' | 'balance_update' | 'error';
  data: any;
  timestamp: Date;
}

export interface WSGameState {
  phase: GamePhase;
  playersOnline: number;
  currentRound: string;
  timeRemaining?: number;
}

export interface WSSpinResult {
  roundId: string;
  winningNumber: RouletteNumber;
  winners: Array<{
    playerId: string;
    amount: number;
  }>;
  totalPool: number;
}
