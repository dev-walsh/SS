import { PublicKey } from '@solana/web3.js';

// Solana network configuration
export const SOLANA_NETWORK = process.env.NODE_ENV === 'production' ? 'mainnet-beta' : 'devnet';
export const SOLANA_RPC_URL = process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

// Game program configuration
export const GAME_PROGRAM_ID = new PublicKey(
  process.env.REACT_APP_GAME_PROGRAM_ID || '11111111111111111111111111111111'
);

// Token configuration
export const GAME_TOKEN_MINT = process.env.REACT_APP_GAME_TOKEN_MINT 
  ? new PublicKey(process.env.REACT_APP_GAME_TOKEN_MINT)
  : null;

// House wallet (treasury)
export const HOUSE_WALLET = new PublicKey(
  process.env.REACT_APP_HOUSE_WALLET || '11111111111111111111111111111111'
);

// Game settings
export const GAME_CONFIG = {
  minBet: 1,
  maxBet: 1000,
  houseEdge: 0.027, // 2.7% for European roulette
  tokenDecimals: 9,
  tokenSymbol: 'ROUL',
  tokenName: 'Roulette Token'
};

// Transaction settings
export const TRANSACTION_CONFIG = {
  maxRetries: 3,
  confirmationTimeout: 30000, // 30 seconds
  commitment: 'confirmed' as const
};
