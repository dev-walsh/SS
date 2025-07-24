import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { gameStateService } from '../services/game-state';
import { tokenService } from '../services/token-service';
import { houseWallet } from '../services/house-wallet';
import { PublicKey } from '@solana/web3.js';

const router = Router();

// Validation schemas
const placeBetSchema = z.object({
  walletAddress: z.string(),
  betType: z.enum(['number', 'color', 'odds_evens', 'dozen', 'column', 'high_low']),
  betValue: z.union([z.number(), z.string()]),
  amount: z.number().min(1).max(1000),
  payout: z.number().min(1)
});

const spinWheelSchema = z.object({
  walletAddress: z.string(),
  gameId: z.string()
});

const withdrawSchema = z.object({
  walletAddress: z.string(),
  amount: z.number().min(1)
});

// Initialize new game session
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address required' 
      });
    }

    // Validate wallet address
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wallet address' 
      });
    }

    // Initialize game state
    const gameState = await gameStateService.initializeGame(walletAddress);
    
    // Get player token balance
    const balance = await tokenService.getPlayerBalance(walletAddress);
    
    res.json({
      success: true,
      data: {
        gameId: gameState.id,
        phase: gameState.phase,
        balance: balance,
        minBet: 1,
        maxBet: 1000,
        canBet: gameState.phase === 'betting'
      }
    });
  } catch (error) {
    console.error('Failed to initialize game:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initialize game' 
    });
  }
});

// Get current game state
router.get('/state/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    const gameState = await gameStateService.getGameState(walletAddress);
    const balance = await tokenService.getPlayerBalance(walletAddress);
    
    if (!gameState) {
      return res.status(404).json({ 
        success: false, 
        error: 'Game not found' 
      });
    }

    res.json({
      success: true,
      data: {
        gameId: gameState.id,
        phase: gameState.phase,
        currentBets: gameState.bets,
        winningNumber: gameState.winningNumber,
        balance: balance,
        totalBetAmount: gameState.totalBetAmount,
        lastWinnings: gameState.lastWinnings,
        canBet: gameState.phase === 'betting',
        roundNumber: gameState.roundNumber
      }
    });
  } catch (error) {
    console.error('Failed to get game state:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get game state' 
    });
  }
});

// Place a bet
router.post('/bet', async (req: Request, res: Response) => {
  try {
    const validation = placeBetSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid bet data',
        details: validation.error.errors
      });
    }

    const { walletAddress, betType, betValue, amount, payout } = validation.data;
    
    // Get current game state
    const gameState = await gameStateService.getGameState(walletAddress);
    
    if (!gameState || gameState.phase !== 'betting') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot place bet in current game phase' 
      });
    }

    // Check player balance
    const balance = await tokenService.getPlayerBalance(walletAddress);
    
    if (balance < amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient balance' 
      });
    }

    // Place bet
    const bet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: betType,
      value: betValue,
      amount: amount,
      payout: payout,
      timestamp: new Date()
    };

    await gameStateService.placeBet(walletAddress, bet);
    
    // Deduct bet amount from player balance (escrow)
    await tokenService.deductBalance(walletAddress, amount);
    
    const newBalance = await tokenService.getPlayerBalance(walletAddress);

    res.json({
      success: true,
      data: {
        betId: bet.id,
        newBalance: newBalance,
        totalBets: gameState.bets.length + 1
      }
    });
  } catch (error) {
    console.error('Failed to place bet:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to place bet' 
    });
  }
});

// Clear all bets
router.post('/clear-bets', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address required' 
      });
    }

    const gameState = await gameStateService.getGameState(walletAddress);
    
    if (!gameState || gameState.phase !== 'betting') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot clear bets in current game phase' 
      });
    }

    // Refund all bet amounts
    const totalRefund = gameState.totalBetAmount;
    
    if (totalRefund > 0) {
      await tokenService.addBalance(walletAddress, totalRefund);
    }

    // Clear bets
    await gameStateService.clearBets(walletAddress);
    
    const newBalance = await tokenService.getPlayerBalance(walletAddress);

    res.json({
      success: true,
      data: {
        refundedAmount: totalRefund,
        newBalance: newBalance
      }
    });
  } catch (error) {
    console.error('Failed to clear bets:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear bets' 
    });
  }
});

// Spin the wheel
router.post('/spin', async (req: Request, res: Response) => {
  try {
    const validation = spinWheelSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid spin data' 
      });
    }

    const { walletAddress } = validation.data;
    
    const gameState = await gameStateService.getGameState(walletAddress);
    
    if (!gameState || gameState.phase !== 'betting') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot spin in current game phase' 
      });
    }

    if (gameState.bets.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No bets placed' 
      });
    }

    // Start spinning
    await gameStateService.startSpin(walletAddress);
    
    // Generate winning number (cryptographically secure)
    const winningNumber = generateSecureRandomNumber();
    
    // Calculate winnings
    const { winningBets, totalWinnings } = calculateWinnings(gameState.bets, winningNumber);
    
    // Update game state with results
    await gameStateService.endSpin(walletAddress, winningNumber, winningBets, totalWinnings);
    
    // Process winnings
    if (totalWinnings > 0) {
      await tokenService.addBalance(walletAddress, totalWinnings);
      
      // Deduct from house wallet
      await houseWallet.deductFunds(totalWinnings - gameState.totalBetAmount);
    } else {
      // Add bet amount to house wallet
      await houseWallet.addFunds(gameState.totalBetAmount);
    }
    
    const newBalance = await tokenService.getPlayerBalance(walletAddress);

    res.json({
      success: true,
      data: {
        winningNumber: winningNumber,
        winningBets: winningBets,
        totalWinnings: totalWinnings,
        newBalance: newBalance,
        houseEdge: 2.7 // European roulette house edge
      }
    });
  } catch (error) {
    console.error('Failed to spin wheel:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to spin wheel' 
    });
  }
});

// Start new round
router.post('/new-round', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address required' 
      });
    }

    await gameStateService.startNewRound(walletAddress);
    
    const gameState = await gameStateService.getGameState(walletAddress);
    const balance = await tokenService.getPlayerBalance(walletAddress);

    res.json({
      success: true,
      data: {
        gameId: gameState?.id,
        phase: 'betting',
        balance: balance,
        roundNumber: gameState?.roundNumber || 1
      }
    });
  } catch (error) {
    console.error('Failed to start new round:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start new round' 
    });
  }
});

// Get player statistics
router.get('/stats/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    const stats = await gameStateService.getPlayerStats(walletAddress);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get player stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get player stats' 
    });
  }
});

// Withdraw winnings
router.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const validation = withdrawSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid withdrawal data' 
      });
    }

    const { walletAddress, amount } = validation.data;
    
    const balance = await tokenService.getPlayerBalance(walletAddress);
    
    if (balance < amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient balance' 
      });
    }

    // Process withdrawal (this would interact with Solana)
    await tokenService.deductBalance(walletAddress, amount);
    
    // Here you would create and send a Solana transaction
    // For now, we'll simulate it
    const transactionHash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newBalance = await tokenService.getPlayerBalance(walletAddress);

    res.json({
      success: true,
      data: {
        transactionHash: transactionHash,
        withdrawnAmount: amount,
        newBalance: newBalance
      }
    });
  } catch (error) {
    console.error('Failed to process withdrawal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process withdrawal' 
    });
  }
});

// Utility functions
function generateSecureRandomNumber(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % 37; // 0-36 for European roulette
}

function calculateWinnings(bets: any[], winningNumber: number) {
  const winningBets: any[] = [];
  let totalWinnings = 0;

  bets.forEach(bet => {
    if (isBetWinning(bet, winningNumber)) {
      winningBets.push(bet);
      totalWinnings += bet.amount * (bet.payout + 1); // Include original bet
    }
  });

  return { winningBets, totalWinnings };
}

function isBetWinning(bet: any, winningNumber: number): boolean {
  switch (bet.type) {
    case 'number':
      return bet.value === winningNumber;
      
    case 'color':
      if (winningNumber === 0) return false;
      const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      const isRed = redNumbers.includes(winningNumber);
      return (bet.value === 'red' && isRed) || (bet.value === 'black' && !isRed);
      
    case 'odds_evens':
      if (winningNumber === 0) return false;
      const isOdd = winningNumber % 2 === 1;
      return (bet.value === 'odd' && isOdd) || (bet.value === 'even' && !isOdd);
      
    case 'dozen':
      if (winningNumber === 0) return false;
      const dozen = Math.ceil(winningNumber / 12);
      return bet.value === dozen;
      
    default:
      return false;
  }
}

export default router;
