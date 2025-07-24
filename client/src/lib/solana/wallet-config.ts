import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
  TrustWalletAdapter,
  WalletConnectWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';

// Wallet configuration for the Solana roulette game
export const SUPPORTED_WALLETS = [
  {
    name: 'Phantom',
    icon: '👻',
    description: 'Popular Solana wallet with great UX',
    mobile: true,
    desktop: true
  },
  {
    name: 'Trust Wallet',
    icon: '🛡️',
    description: 'Multi-chain wallet with Solana support',
    mobile: true,
    desktop: true
  },
  {
    name: 'Solflare',
    icon: '☀️',
    description: 'Native Solana wallet with advanced features',
    mobile: true,
    desktop: true
  },

  {
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect any wallet via QR code',
    mobile: true,
    desktop: true
  }
];

// Configure network (mainnet for production, devnet for testing)
export const getWalletNetwork = () => {
  // Use devnet for development, mainnet for production
  return process.env.NODE_ENV === 'production' 
    ? WalletAdapterNetwork.Mainnet 
    : WalletAdapterNetwork.Devnet;
};

// Get RPC endpoint based on network
export const getWalletEndpoint = (network: WalletAdapterNetwork): string => {
  return clusterApiUrl(network);
};

// Initialize wallet adapters
export const createWalletAdapters = (network: WalletAdapterNetwork) => {
  const adapters = [
    new PhantomWalletAdapter(),
    new TrustWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
  ];

  // Add WalletConnect adapter with proper configuration
  try {
    const wcAdapter = new WalletConnectWalletAdapter({
      network: network as any,
      options: {
        projectId: 'roulette-crypto-game-solana',
        metadata: {
          name: 'Crypto Roulette Game',
          description: 'Play-to-earn 3D roulette game on Solana',
          url: typeof window !== 'undefined' ? window.location.origin : '',
          icons: ['https://avatars.githubusercontent.com/u/37784886']
        }
      },
    });
    adapters.push(wcAdapter);
  } catch (error) {
    console.warn('WalletConnect adapter failed to initialize:', error);
  }

  return adapters;
};

// Wallet connection utilities
export const getWalletInfo = (walletName: string) => {
  return SUPPORTED_WALLETS.find(wallet => 
    wallet.name.toLowerCase() === walletName.toLowerCase()
  );
};

// Check if wallet is mobile-friendly
export const isMobileWallet = (walletName: string): boolean => {
  const wallet = getWalletInfo(walletName);
  return wallet?.mobile ?? false;
};

// Check if wallet is desktop-friendly
export const isDesktopWallet = (walletName: string): boolean => {
  const wallet = getWalletInfo(walletName);
  return wallet?.desktop ?? false;
};

// Get wallet display name with icon
export const getWalletDisplayName = (walletName: string): string => {
  const wallet = getWalletInfo(walletName);
  return wallet ? `${wallet.icon} ${wallet.name}` : walletName;
};

// Trust Wallet specific configuration
export const TRUST_WALLET_CONFIG = {
  name: 'Trust Wallet',
  url: 'https://trustwallet.com/',
  icon: '🛡️',
  supportedPlatforms: ['iOS', 'Android', 'Chrome Extension'],
  features: [
    'Multi-chain support',
    'Built-in DeFi browser',
    'NFT gallery',
    'Staking rewards',
    'Cross-chain swaps'
  ],
  downloadLinks: {
    ios: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
    android: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
    chrome: 'https://chrome.google.com/webstore/detail/trust-wallet/egjidjbpglichdcondbcbdnbeeppgdph'
  }
};

export default {
  SUPPORTED_WALLETS,
  getWalletNetwork,
  getWalletEndpoint,
  createWalletAdapters,
  getWalletInfo,
  isMobileWallet,
  isDesktopWallet,
  getWalletDisplayName,
  TRUST_WALLET_CONFIG
};