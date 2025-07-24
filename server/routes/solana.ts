import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import { tokenService } from '../services/token-service';
import { houseWallet } from '../services/house-wallet';

const router = Router();

// Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

// Game token mint (would be created during deployment)
const GAME_TOKEN_MINT = new PublicKey(
  process.env.GAME_TOKEN_MINT || '11111111111111111111111111111111'
);

// Validation schemas
const walletSchema = z.object({
  walletAddress: z.string()
});

const transactionSchema = z.object({
  walletAddress: z.string(),
  transaction: z.string(), // Base64 encoded transaction
  signature: z.string()
});

const airdropSchema = z.object({
  walletAddress: z.string(),
  amount: z.number().min(0.1).max(2)
});

// Get wallet balance (SOL and tokens)
router.post('/balance', async (req: Request, res: Response) => {
  try {
    const validation = walletSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wallet address' 
      });
    }

    const { walletAddress } = validation.data;
    
    // Validate wallet address format
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(walletAddress);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wallet address format' 
      });
    }

    // Get SOL balance
    const solBalance = await connection.getBalance(publicKey);
    const solBalanceFormatted = solBalance / LAMPORTS_PER_SOL;

    // Get token balance
    let tokenBalance = 0;
    try {
      const tokenAccount = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey);
      const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccount);
      tokenBalance = tokenAccountInfo.value.uiAmount || 0;
    } catch (error) {
      // Token account doesn't exist yet
      console.log('Token account not found for wallet:', walletAddress);
    }

    res.json({
      success: true,
      data: {
        walletAddress: walletAddress,
        solBalance: solBalanceFormatted,
        tokenBalance: tokenBalance,
        tokenMint: GAME_TOKEN_MINT.toString()
      }
    });
  } catch (error) {
    console.error('Failed to get wallet balance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get wallet balance' 
    });
  }
});

// Create token account for new player
router.post('/create-token-account', async (req: Request, res: Response) => {
  try {
    const validation = walletSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wallet address' 
      });
    }

    const { walletAddress } = validation.data;
    
    const publicKey = new PublicKey(walletAddress);
    
    // Check if token account already exists
    const tokenAccount = await getAssociatedTokenAddress(GAME_TOKEN_MINT, publicKey);
    
    try {
      const accountInfo = await connection.getAccountInfo(tokenAccount);
      if (accountInfo) {
        return res.json({
          success: true,
          data: {
            tokenAccount: tokenAccount.toString(),
            exists: true,
            message: 'Token account already exists'
          }
        });
      }
    } catch (error) {
      // Account doesn't exist, continue to create
    }

    // Create transaction to create associated token account
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        publicKey, // payer
        tokenAccount, // associated token account
        publicKey, // owner
        GAME_TOKEN_MINT // mint
      )
    );

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    // Serialize transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    res.json({
      success: true,
      data: {
        transaction: serializedTransaction.toString('base64'),
        tokenAccount: tokenAccount.toString(),
        message: 'Sign and send this transaction to create your token account'
      }
    });
  } catch (error) {
    console.error('Failed to create token account transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create token account transaction' 
    });
  }
});

// Airdrop SOL for devnet testing
router.post('/airdrop', async (req: Request, res: Response) => {
  try {
    const validation = airdropSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid airdrop request' 
      });
    }

    const { walletAddress, amount } = validation.data;
    
    // Only allow airdrops on devnet
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false, 
        error: 'Airdrops not allowed in production' 
      });
    }

    const publicKey = new PublicKey(walletAddress);
    
    // Request airdrop
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );

    // Confirm transaction
    await connection.confirmTransaction(signature, 'confirmed');

    res.json({
      success: true,
      data: {
        signature: signature,
        amount: amount,
        message: `Airdropped ${amount} SOL to ${walletAddress}`
      }
    });
  } catch (error) {
    console.error('Failed to airdrop SOL:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to airdrop SOL' 
    });
  }
});

// Initialize game tokens for new player
router.post('/initialize-tokens', async (req: Request, res: Response) => {
  try {
    const validation = walletSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wallet address' 
      });
    }

    const { walletAddress } = validation.data;
    
    // Check if player already has tokens
    const existingBalance = await tokenService.getPlayerBalance(walletAddress);
    
    if (existingBalance > 0) {
      return res.json({
        success: true,
        data: {
          balance: existingBalance,
          message: 'Player already has tokens'
        }
      });
    }

    // Give starting tokens (1000 tokens)
    const startingTokens = 1000;
    await tokenService.addBalance(walletAddress, startingTokens);

    res.json({
      success: true,
      data: {
        balance: startingTokens,
        message: `Initialized with ${startingTokens} game tokens`
      }
    });
  } catch (error) {
    console.error('Failed to initialize tokens:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initialize tokens' 
    });
  }
});

// Transfer tokens between accounts
router.post('/transfer', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      fromWallet: z.string(),
      toWallet: z.string(),
      amount: z.number().min(1)
    });

    const validation = schema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid transfer data' 
      });
    }

    const { fromWallet, toWallet, amount } = validation.data;
    
    const fromPublicKey = new PublicKey(fromWallet);
    const toPublicKey = new PublicKey(toWallet);

    // Get token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(GAME_TOKEN_MINT, fromPublicKey);
    const toTokenAccount = await getAssociatedTokenAddress(GAME_TOKEN_MINT, toPublicKey);

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPublicKey,
      amount * Math.pow(10, 9), // Assuming 9 decimals
      []
    );

    const transaction = new Transaction().add(transferInstruction);

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    // Serialize transaction
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });

    res.json({
      success: true,
      data: {
        transaction: serializedTransaction.toString('base64'),
        message: 'Sign and send this transaction to transfer tokens'
      }
    });
  } catch (error) {
    console.error('Failed to create transfer transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create transfer transaction' 
    });
  }
});

// Verify transaction
router.post('/verify-transaction', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      signature: z.string()
    });

    const validation = schema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid signature' 
      });
    }

    const { signature } = validation.data;

    // Get transaction details
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed'
    });

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transaction not found' 
      });
    }

    const isSuccessful = transaction.meta?.err === null;

    res.json({
      success: true,
      data: {
        signature: signature,
        successful: isSuccessful,
        blockTime: transaction.blockTime,
        slot: transaction.slot,
        fee: transaction.meta?.fee || 0,
        error: transaction.meta?.err
      }
    });
  } catch (error) {
    console.error('Failed to verify transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify transaction' 
    });
  }
});

// Get house wallet stats
router.get('/house-stats', async (req: Request, res: Response) => {
  try {
    const stats = await houseWallet.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Failed to get house stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get house stats' 
    });
  }
});

// Get recent transactions for a wallet
router.get('/transactions/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const publicKey = new PublicKey(walletAddress);
    
    // Get recent transactions
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: limit
    });

    const transactions = await Promise.all(
      signatures.map(async (sigInfo) => {
        const tx = await connection.getTransaction(sigInfo.signature, {
          commitment: 'confirmed'
        });
        
        return {
          signature: sigInfo.signature,
          blockTime: sigInfo.blockTime,
          successful: sigInfo.err === null,
          slot: sigInfo.slot,
          fee: tx?.meta?.fee || 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        transactions: transactions,
        count: transactions.length
      }
    });
  } catch (error) {
    console.error('Failed to get transactions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get transactions' 
    });
  }
});

export default router;
