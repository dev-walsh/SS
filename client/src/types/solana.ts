import { PublicKey, Transaction, Connection } from '@solana/web3.js';

// Wallet adapter types
export interface WalletAdapter {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  wallet: Wallet | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface Wallet {
  adapter: WalletAdapterBase;
  name: string;
  url: string;
  icon: string;
}

export interface WalletAdapterBase {
  name: string;
  url: string;
  icon: string;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

// Token account types
export interface TokenAccount {
  pubkey: PublicKey;
  account: {
    data: {
      program: string;
      parsed: {
        info: {
          mint: string;
          owner: string;
          tokenAmount: {
            amount: string;
            decimals: number;
            uiAmount: number;
            uiAmountString: string;
          };
        };
        type: string;
      };
      space: number;
    };
    executable: boolean;
    lamports: number;
    owner: PublicKey;
    rentEpoch: number;
  };
}

// Transaction types
export interface SolanaTransaction {
  signature: string;
  slot: number;
  err: any;
  memo: string | null;
  blockTime: number | null;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
}

export interface TransactionInstruction {
  programId: PublicKey;
  keys: Array<{
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }>;
  data: Buffer;
}

// Game program types
export interface GameAccount {
  player: PublicKey;
  gameState: GameState;
  totalBets: number;
  totalWinnings: number;
  currentRound: number;
  lastPlayTime: number;
}

export interface GameState {
  phase: 'waiting' | 'betting' | 'spinning' | 'settled';
  bets: GameBet[];
  winningNumber: number | null;
  roundId: string;
  startTime: number;
  endTime: number | null;
}

export interface GameBet {
  betType: number; // 0: number, 1: color, 2: odds/evens, 3: dozen
  betValue: number;
  amount: number;
  payout: number;
}

// SPL Token types
export interface TokenMint {
  mintAuthority: PublicKey | null;
  supply: string;
  decimals: number;
  isInitialized: boolean;
  freezeAuthority: PublicKey | null;
}

export interface TokenInfo {
  mint: PublicKey;
  owner: PublicKey;
  amount: string;
  delegate: PublicKey | null;
  state: 'initialized' | 'uninitialized' | 'frozen';
  isNative: boolean;
  delegatedAmount: string;
  closeAuthority: PublicKey | null;
}

// RPC types
export interface RpcResponse<T> {
  context: {
    slot: number;
  };
  value: T;
}

export interface AccountInfo {
  data: string | Buffer;
  executable: boolean;
  lamports: number;
  owner: PublicKey;
  rentEpoch: number;
}

// Program derived address types
export interface PDA {
  address: PublicKey;
  bump: number;
}

// Connection and cluster types
export type Cluster = 'devnet' | 'testnet' | 'mainnet-beta';

export interface ClusterConfig {
  name: Cluster;
  endpoint: string;
  network?: string;
}

// Error types
export interface SolanaError {
  code: number;
  message: string;
  data?: any;
}

export interface TransactionError {
  InstructionError: [number, any];
}

// Anchor program types (for future smart contract integration)
export interface AnchorProgram {
  programId: PublicKey;
  idl: any;
  methods: any;
  account: any;
  instruction: any;
}

export interface AnchorProvider {
  connection: Connection;
  wallet: WalletAdapter;
  opts: {
    preflightCommitment: string;
    commitment: string;
  };
}

// Game-specific Solana types
export interface HouseWalletInfo {
  publicKey: PublicKey;
  balance: number;
  tokenAccounts: TokenAccount[];
  authority: PublicKey;
}

export interface GameTransactionResult {
  signature: string;
  success: boolean;
  error?: string;
  balanceChange: number;
  gasUsed: number;
}

export interface PlayerWalletInfo {
  publicKey: PublicKey;
  solBalance: number;
  tokenBalance: number;
  gameTokenAccount: PublicKey | null;
  transactions: SolanaTransaction[];
}

// Metaplex types (for potential NFT integration)
export interface NFTMetadata {
  mint: PublicKey;
  updateAuthority: PublicKey;
  data: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Array<{
      address: PublicKey;
      verified: boolean;
      share: number;
    }>;
  };
  primarySaleHappened: boolean;
  isMutable: boolean;
}

// WebSocket types for real-time updates
export interface SolanaWebSocketMessage {
  jsonrpc: string;
  method: string;
  params: {
    result: any;
    subscription: number;
  };
}

export interface AccountSubscription {
  subscriptionId: number;
  callback: (accountInfo: AccountInfo, context: { slot: number }) => void;
}

export interface LogsSubscription {
  subscriptionId: number;
  callback: (logs: { logs: string[]; signature: string }, context: { slot: number }) => void;
}

// Utility types
export type Base58String = string;
export type Base64String = string;
export type HexString = string;

export interface ParsedInstruction {
  parsed: {
    info: any;
    type: string;
  };
  program: string;
  programId: PublicKey;
}

export interface CompiledInstruction {
  programIdIndex: number;
  accounts: number[];
  data: string;
}
