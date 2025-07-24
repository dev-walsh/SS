import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  SYSVAR_RECENT_BLOCKHASHES_PUBKEY
} from '@solana/web3.js';
import { GAME_PROGRAM_ID, HOUSE_WALLET, SOLANA_RPC_URL } from './config';
import { RouletteNumber, Bet } from '../../types/game';

// Instruction discriminators for the game program
enum GameInstruction {
  InitializeGame = 0,
  PlaceBet = 1,
  SpinWheel = 2,
  SettleBets = 3,
  WithdrawWinnings = 4
}

export class GameProgram {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  }

  async initializeGame(
    playerPublicKey: PublicKey,
    tokenMint: PublicKey
  ): Promise<Transaction> {
    try {
      // Derive game state PDA
      const [gameState] = await PublicKey.findProgramAddress(
        [Buffer.from('game'), playerPublicKey.toBuffer()],
        GAME_PROGRAM_ID
      );

      const data = Buffer.from([GameInstruction.InitializeGame]);

      const instruction = new TransactionInstruction({
        programId: GAME_PROGRAM_ID,
        keys: [
          { pubkey: playerPublicKey, isSigner: true, isWritable: false },
          { pubkey: gameState, isSigner: false, isWritable: true },
          { pubkey: tokenMint, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
        ],
        data
      });

      return new Transaction().add(instruction);
    } catch (error) {
      console.error('Failed to create initialize game transaction:', error);
      throw error;
    }
  }

  async placeBet(
    playerPublicKey: PublicKey,
    bet: Bet,
    tokenMint: PublicKey
  ): Promise<Transaction> {
    try {
      const [gameState] = await PublicKey.findProgramAddress(
        [Buffer.from('game'), playerPublicKey.toBuffer()],
        GAME_PROGRAM_ID
      );

      // Encode bet data
      const data = Buffer.alloc(32);
      data.writeUInt8(GameInstruction.PlaceBet, 0);
      data.writeUInt8(this.encodeBetType(bet.type), 1);
      data.writeUInt32LE(Number(bet.value), 2);
      data.writeBigUInt64LE(BigInt(bet.amount), 6);
      data.writeUInt32LE(bet.payout, 14);

      const instruction = new TransactionInstruction({
        programId: GAME_PROGRAM_ID,
        keys: [
          { pubkey: playerPublicKey, isSigner: true, isWritable: false },
          { pubkey: gameState, isSigner: false, isWritable: true },
          { pubkey: tokenMint, isSigner: false, isWritable: false }
        ],
        data
      });

      return new Transaction().add(instruction);
    } catch (error) {
      console.error('Failed to create place bet transaction:', error);
      throw error;
    }
  }

  async spinWheel(
    playerPublicKey: PublicKey,
    tokenMint: PublicKey
  ): Promise<Transaction> {
    try {
      const [gameState] = await PublicKey.findProgramAddress(
        [Buffer.from('game'), playerPublicKey.toBuffer()],
        GAME_PROGRAM_ID
      );

      const data = Buffer.from([GameInstruction.SpinWheel]);

      const instruction = new TransactionInstruction({
        programId: GAME_PROGRAM_ID,
        keys: [
          { pubkey: playerPublicKey, isSigner: true, isWritable: false },
          { pubkey: gameState, isSigner: false, isWritable: true },
          { pubkey: SYSVAR_RECENT_BLOCKHASHES_PUBKEY, isSigner: false, isWritable: false }
        ],
        data
      });

      return new Transaction().add(instruction);
    } catch (error) {
      console.error('Failed to create spin wheel transaction:', error);
      throw error;
    }
  }

  async settleBets(
    playerPublicKey: PublicKey,
    winningNumber: RouletteNumber,
    tokenMint: PublicKey
  ): Promise<Transaction> {
    try {
      const [gameState] = await PublicKey.findProgramAddress(
        [Buffer.from('game'), playerPublicKey.toBuffer()],
        GAME_PROGRAM_ID
      );

      const data = Buffer.alloc(5);
      data.writeUInt8(GameInstruction.SettleBets, 0);
      data.writeUInt32LE(winningNumber, 1);

      const instruction = new TransactionInstruction({
        programId: GAME_PROGRAM_ID,
        keys: [
          { pubkey: playerPublicKey, isSigner: true, isWritable: false },
          { pubkey: gameState, isSigner: false, isWritable: true },
          { pubkey: HOUSE_WALLET, isSigner: false, isWritable: true },
          { pubkey: tokenMint, isSigner: false, isWritable: false }
        ],
        data
      });

      return new Transaction().add(instruction);
    } catch (error) {
      console.error('Failed to create settle bets transaction:', error);
      throw error;
    }
  }

  async withdrawWinnings(
    playerPublicKey: PublicKey,
    amount: number,
    tokenMint: PublicKey
  ): Promise<Transaction> {
    try {
      const [gameState] = await PublicKey.findProgramAddress(
        [Buffer.from('game'), playerPublicKey.toBuffer()],
        GAME_PROGRAM_ID
      );

      const data = Buffer.alloc(9);
      data.writeUInt8(GameInstruction.WithdrawWinnings, 0);
      data.writeBigUInt64LE(BigInt(amount), 1);

      const instruction = new TransactionInstruction({
        programId: GAME_PROGRAM_ID,
        keys: [
          { pubkey: playerPublicKey, isSigner: true, isWritable: false },
          { pubkey: gameState, isSigner: false, isWritable: true },
          { pubkey: tokenMint, isSigner: false, isWritable: false }
        ],
        data
      });

      return new Transaction().add(instruction);
    } catch (error) {
      console.error('Failed to create withdraw winnings transaction:', error);
      throw error;
    }
  }

  private encodeBetType(betType: string): number {
    switch (betType) {
      case 'number': return 0;
      case 'color': return 1;
      case 'odds_evens': return 2;
      case 'dozen': return 3;
      default: return 0;
    }
  }

  async getGameState(playerPublicKey: PublicKey): Promise<any> {
    try {
      const [gameState] = await PublicKey.findProgramAddress(
        [Buffer.from('game'), playerPublicKey.toBuffer()],
        GAME_PROGRAM_ID
      );

      const accountInfo = await this.connection.getAccountInfo(gameState);
      if (!accountInfo) {
        return null;
      }

      // Parse game state data
      return this.parseGameState(accountInfo.data);
    } catch (error) {
      console.error('Failed to get game state:', error);
      return null;
    }
  }

  private parseGameState(data: Buffer): any {
    // Parse the game state data structure
    // This would depend on how the Solana program stores the data
    return {
      isInitialized: data.readUInt8(0) === 1,
      player: new PublicKey(data.slice(1, 33)),
      currentBets: [], // Would parse bet array
      totalBetAmount: data.readBigUInt64LE(33),
      gamePhase: data.readUInt8(41),
      winningNumber: data.readUInt32LE(42)
    };
  }
}

export const gameProgram = new GameProgram();
