import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface TokenState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  tokenMint: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setBalance: (balance: number) => void;
  addTokens: (amount: number) => void;
  deductTokens: (amount: number) => boolean;
  setTokenMint: (mint: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeTokens: () => Promise<void>;
  claimWinnings: (amount: number) => Promise<void>;
  refreshTokenBalance: () => Promise<void>;
}

export const useTokens = create<TokenState>()(
  subscribeWithSelector((set, get) => ({
    balance: 1000, // Starting balance for demo
    totalEarned: 0,
    totalSpent: 0,
    tokenMint: null,
    isLoading: false,
    error: null,
    
    setBalance: (balance) => {
      set({ balance: Math.max(0, balance) });
    },
    
    addTokens: (amount) => {
      set((state) => ({
        balance: state.balance + amount,
        totalEarned: state.totalEarned + amount
      }));
    },
    
    deductTokens: (amount) => {
      const { balance } = get();
      
      if (balance < amount) {
        set({ error: 'Insufficient balance' });
        return false;
      }
      
      set((state) => ({
        balance: state.balance - amount,
        totalSpent: state.totalSpent + amount,
        error: null
      }));
      
      return true;
    },
    
    setTokenMint: (mint) => {
      set({ tokenMint: mint });
    },
    
    setLoading: (loading) => {
      set({ isLoading: loading });
    },
    
    setError: (error) => {
      set({ error });
    },
    
    initializeTokens: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // Initialize or get existing token mint
        const response = await fetch('/api/tokens/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error('Failed to initialize tokens');
        }
        
        const data = await response.json();
        set({ 
          tokenMint: data.mint,
          balance: data.balance || 1000 // Default starting balance
        });
        
      } catch (error) {
        console.error('Failed to initialize tokens:', error);
        set({ error: 'Failed to initialize tokens' });
      } finally {
        set({ isLoading: false });
      }
    },
    
    claimWinnings: async (amount) => {
      if (amount <= 0) return;
      
      set({ isLoading: true, error: null });
      
      try {
        // This would interact with the Solana program to mint/transfer tokens
        const response = await fetch('/api/tokens/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount })
        });
        
        if (!response.ok) {
          throw new Error('Failed to claim winnings');
        }
        
        // Add to balance
        get().addTokens(amount);
        
      } catch (error) {
        console.error('Failed to claim winnings:', error);
        set({ error: 'Failed to claim winnings' });
      } finally {
        set({ isLoading: false });
      }
    },
    
    refreshTokenBalance: async () => {
      const { tokenMint } = get();
      if (!tokenMint) return;
      
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch('/api/tokens/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mint: tokenMint })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch token balance');
        }
        
        const data = await response.json();
        set({ balance: data.balance });
        
      } catch (error) {
        console.error('Failed to refresh token balance:', error);
        set({ error: 'Failed to refresh token balance' });
      } finally {
        set({ isLoading: false });
      }
    }
  }))
);

// Auto-claim winnings when roulette winnings are calculated
import { useRoulette } from './useRoulette';

useRoulette.subscribe(
  (state) => state.lastWinnings,
  (winnings) => {
    if (winnings > 0) {
      useTokens.getState().claimWinnings(winnings);
    }
  }
);
