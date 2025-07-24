import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface WalletState {
  isConnected: boolean;
  walletAddress: string | null;
  balance: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setConnected: (connected: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setBalance: (balance: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

export const useWallet = create<WalletState>()(
  subscribeWithSelector((set, get) => ({
    isConnected: false,
    walletAddress: null,
    balance: 0,
    isLoading: false,
    error: null,
    
    setConnected: (connected) => {
      set({ isConnected: connected });
    },
    
    setWalletAddress: (address) => {
      set({ walletAddress: address });
    },
    
    setBalance: (balance) => {
      set({ balance });
    },
    
    setLoading: (loading) => {
      set({ isLoading: loading });
    },
    
    setError: (error) => {
      set({ error });
    },
    
    disconnect: () => {
      set({
        isConnected: false,
        walletAddress: null,
        balance: 0,
        error: null
      });
    },
    
    refreshBalance: async () => {
      const { walletAddress } = get();
      if (!walletAddress) return;
      
      set({ isLoading: true, error: null });
      
      try {
        // This would make an actual API call to get SOL balance
        // For now, we'll simulate it
        const response = await fetch('/api/wallet/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch balance');
        }
        
        const data = await response.json();
        set({ balance: data.balance });
      } catch (error) {
        console.error('Failed to refresh balance:', error);
        set({ error: 'Failed to refresh balance' });
      } finally {
        set({ isLoading: false });
      }
    }
  }))
);

// Auto-refresh balance when wallet address changes
useWallet.subscribe(
  (state) => state.walletAddress,
  (walletAddress) => {
    if (walletAddress) {
      useWallet.getState().refreshBalance();
    }
  }
);
