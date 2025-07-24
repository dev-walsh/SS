import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { RouletteNumber, Bet, GamePhase, GameStats } from "../../types/game";

interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface RouletteState {
  gamePhase: GamePhase;
  isSpinning: boolean;
  winningNumber: RouletteNumber | null;
  currentBets: Bet[];
  lastWinnings: number;
  ballPosition: Position3D | null;
  gameStats: GameStats;
  
  // Actions
  placeBet: (bet: Bet) => void;
  clearBets: () => void;
  spinWheel: () => void;
  endSpin: () => void;
  setWinningNumber: (number: RouletteNumber) => void;
  setBallPosition: (position: Position3D) => void;
  calculateWinnings: () => number;
  startNewRound: () => void;
  resetGame: () => void;
}

export const useRoulette = create<RouletteState>()(
  subscribeWithSelector((set, get) => ({
    gamePhase: "waiting",
    isSpinning: false,
    winningNumber: null,
    currentBets: [],
    lastWinnings: 0,
    ballPosition: null,
    gameStats: {
      totalRounds: 0,
      totalWins: 0,
      totalWinnings: 0,
      biggestWin: 0
    },
    
    placeBet: (bet) => {
      set((state) => {
        if (state.gamePhase !== 'betting') return {};
        
        // Check if bet already exists for this type and value
        const existingBetIndex = state.currentBets.findIndex(
          (existingBet) => 
            existingBet.type === bet.type && 
            existingBet.value === bet.value
        );
        
        if (existingBetIndex >= 0) {
          // Add to existing bet
          const updatedBets = [...state.currentBets];
          updatedBets[existingBetIndex].amount += bet.amount;
          return { currentBets: updatedBets };
        } else {
          // Add new bet
          return { currentBets: [...state.currentBets, bet] };
        }
      });
    },
    
    clearBets: () => {
      set((state) => {
        if (state.gamePhase !== 'betting') return {};
        return { currentBets: [] };
      });
    },
    
    spinWheel: () => {
      set((state) => {
        if (state.gamePhase !== 'betting' || state.currentBets.length === 0) {
          return {};
        }
        
        return {
          gamePhase: "spinning",
          isSpinning: true,
          winningNumber: null,
          lastWinnings: 0
        };
      });
    },
    
    endSpin: () => {
      set((state) => {
        if (!state.isSpinning) return {};
        
        const winnings = get().calculateWinnings();
        const isWin = winnings > 0;
        
        // Update stats
        const newStats = {
          ...state.gameStats,
          totalRounds: state.gameStats.totalRounds + 1,
          totalWins: isWin ? state.gameStats.totalWins + 1 : state.gameStats.totalWins,
          totalWinnings: state.gameStats.totalWinnings + winnings,
          biggestWin: Math.max(state.gameStats.biggestWin, winnings)
        };
        
        return {
          gamePhase: "result",
          isSpinning: false,
          lastWinnings: winnings,
          gameStats: newStats
        };
      });
    },
    
    setWinningNumber: (number) => {
      set({ winningNumber: number });
    },
    
    setBallPosition: (position) => {
      set({ ballPosition: position });
    },
    
    calculateWinnings: () => {
      const { winningNumber, currentBets } = get();
      if (winningNumber === null) return 0;
      
      let totalWinnings = 0;
      
      currentBets.forEach((bet) => {
        let isWinningBet = false;
        
        switch (bet.type) {
          case 'number':
            isWinningBet = bet.value === winningNumber;
            break;
            
          case 'color':
            if (winningNumber === 0) {
              isWinningBet = false;
            } else {
              const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
              const isRed = redNumbers.includes(winningNumber);
              isWinningBet = (bet.value === 'red' && isRed) || (bet.value === 'black' && !isRed);
            }
            break;
            
          case 'odds_evens':
            if (winningNumber === 0) {
              isWinningBet = false;
            } else {
              const isOdd = winningNumber % 2 === 1;
              isWinningBet = (bet.value === 'odd' && isOdd) || (bet.value === 'even' && !isOdd);
            }
            break;
            
          case 'dozen':
            if (winningNumber === 0) {
              isWinningBet = false;
            } else {
              const dozen = Math.ceil(winningNumber / 12);
              isWinningBet = bet.value === dozen;
            }
            break;
        }
        
        if (isWinningBet) {
          totalWinnings += bet.amount * (bet.payout + 1); // Include original bet
        }
      });
      
      return totalWinnings;
    },
    
    startNewRound: () => {
      set({
        gamePhase: "betting",
        currentBets: [],
        winningNumber: null,
        lastWinnings: 0,
        isSpinning: false
      });
    },
    
    resetGame: () => {
      set({
        gamePhase: "betting",
        isSpinning: false,
        winningNumber: null,
        currentBets: [],
        lastWinnings: 0,
        ballPosition: null,
        gameStats: {
          totalRounds: 0,
          totalWins: 0,
          totalWinnings: 0,
          biggestWin: 0
        }
      });
    }
  }))
);

// Auto-transition from waiting to betting when wallet is connected
useRoulette.subscribe(
  (state) => state.gamePhase,
  (phase) => {
    if (phase === "waiting") {
      // Check if wallet is connected and transition to betting
      setTimeout(() => {
        const walletConnected = true; // This would check actual wallet state
        if (walletConnected && useRoulette.getState().gamePhase === "waiting") {
          useRoulette.getState().startNewRound();
        }
      }, 1000);
    }
  }
);
