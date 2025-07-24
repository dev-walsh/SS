// Shared types between client and server

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Game types
export type RouletteNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36;

export type BetType = 'number' | 'color' | 'odds_evens' | 'dozen' | 'column' | 'high_low' | 'split' | 'street' | 'corner' | 'line';

export type GamePhase = 'waiting' | 'betting' | 'spinning' | 'result';

export interface Bet {
  id: string;
  type: BetType;
  value: RouletteNumber | string | number;
  amount: number;
  payout: number;
  timestamp: Date;
}

export interface GameState {
  id: string;
  walletAddress: string;
  phase: GamePhase;
  bets: Bet[];
  totalBetAmount: number;
  winningNumber: RouletteNumber | null;
  winningBets: Bet[];
  lastWinnings: number;
  roundNumber: number;
  startTime: Date;
  endTime: Date | null;
  lastActivity: Date;
}

export interface PlayerStats {
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

// Token types
export interface TokenBalance {
  walletAddress: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastUpdated: Date;
}

export interface TokenTransaction {
  id: string;
  type: 'earn' | 'spend' | 'deposit' | 'withdraw';
  amount: number;
  timestamp: Date;
  description: string;
  gameRound?: string;
}

// Wallet types
export interface WalletInfo {
  walletAddress: string;
  solBalance: number;
  tokenBalance: number;
  isConnected: boolean;
  network: 'devnet' | 'testnet' | 'mainnet-beta';
}

// House wallet types
export interface HouseWalletStats {
  publicKey: string;
  solBalance: number;
  tokenBalance: number;
  totalCollected: number;
  totalPaidOut: number;
  profit: number;
  transactionCount: number;
  lastUpdated: Date;
}

export interface HouseTransaction {
  signature: string;
  type: 'collection' | 'payout' | 'maintenance';
  amount: number;
  timestamp: Date;
  player?: string;
}

// Solana types
export interface SolanaTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  successful: boolean;
  fee: number;
  error?: any;
}

export interface TokenAccountInfo {
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number;
}

// API request/response types
export interface PlaceBetRequest {
  walletAddress: string;
  betType: BetType;
  betValue: RouletteNumber | string | number;
  amount: number;
  payout: number;
}

export interface PlaceBetResponse {
  betId: string;
  newBalance: number;
  totalBets: number;
}

export interface SpinRequest {
  walletAddress: string;
  gameId: string;
}

export interface SpinResponse {
  winningNumber: RouletteNumber;
  winningBets: Bet[];
  totalWinnings: number;
  newBalance: number;
  houseEdge: number;
}

export interface BalanceRequest {
  walletAddress: string;
}

export interface BalanceResponse {
  walletAddress: string;
  solBalance: number;
  tokenBalance: number;
  tokenMint: string;
}

export interface TransferRequest {
  fromWallet: string;
  toWallet: string;
  amount: number;
}

export interface TransferResponse {
  transaction: string; // Base64 encoded transaction
  message: string;
}

// Statistics types
export interface GlobalStats {
  totalGames: number;
  totalPlayers: number;
  totalBetsPlaced: number;
  totalWinnings: number;
  averageGameDuration: number;
  mostPopularBetType: string;
}

export interface TokenStats {
  totalPlayers: number;
  totalTokensInCirculation: number;
  totalTokensEarned: number;
  totalTokensSpent: number;
  averageBalance: number;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  balance?: number;
  totalEarned?: number;
  totalWinnings?: number;
  winRate?: number;
}

// Game configuration
export interface GameConfig {
  minBet: number;
  maxBet: number;
  houseEdge: number;
  tokenDecimals: number;
  tokenSymbol: string;
  tokenName: string;
  wheelNumbers: RouletteNumber[];
  payoutTable: Record<BetType, number>;
}

// Telegram types
export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

export interface TelegramWebAppData {
  user?: TelegramUser;
  chatId?: number;
  startParam?: string;
  initData: string;
}

// Error types
export interface GameError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// WebSocket message types
export interface WSMessage {
  type: 'game_state' | 'bet_placed' | 'spin_result' | 'balance_update' | 'error' | 'player_joined' | 'player_left';
  data: any;
  timestamp: Date;
  playerId?: string;
}

export interface WSGameStateMessage {
  type: 'game_state';
  data: {
    phase: GamePhase;
    playersOnline: number;
    currentRound: string;
    timeRemaining?: number;
  };
}

export interface WSSpinResultMessage {
  type: 'spin_result';
  data: {
    roundId: string;
    winningNumber: RouletteNumber;
    winners: Array<{
      playerId: string;
      amount: number;
    }>;
    totalPool: number;
  };
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Timestamp helpers
export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  deletedAt: Date | null;
}

// Pagination types
export interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Environment configuration
export interface AppConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  SOLANA_RPC_URL: string;
  GAME_TOKEN_MINT: string;
  HOUSE_WALLET_SECRET?: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
}

export default {};
