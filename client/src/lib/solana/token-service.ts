import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  transfer,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferInstruction
} from '@solana/spl-token';
import { SOLANA_RPC_URL, GAME_CONFIG } from './config';

export class TokenService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  }

  async createGameToken(
    payer: PublicKey,
    authority: PublicKey
  ): Promise<{ mint: PublicKey; transaction: Transaction }> {
    try {
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;

      const transaction = new Transaction();
      
      // Calculate minimum rent for mint account
      const mintRent = await this.connection.getMinimumBalanceForRentExemption(82);
      
      // Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: mint,
          space: 82,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Initialize mint
      transaction.add(
        createMintToInstruction(
          mint,
          authority,
          authority,
          0, // Initial supply
          [],
          TOKEN_PROGRAM_ID
        )
      );

      return { mint, transaction };
    } catch (error) {
      console.error('Failed to create game token:', error);
      throw error;
    }
  }

  async createPlayerTokenAccount(
    playerPublicKey: PublicKey,
    tokenMint: PublicKey
  ): Promise<Transaction> {
    try {
      const associatedTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        playerPublicKey
      );

      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          playerPublicKey, // payer
          associatedTokenAccount, // associated token account
          playerPublicKey, // owner
          tokenMint // mint
        )
      );

      return transaction;
    } catch (error) {
      console.error('Failed to create player token account:', error);
      throw error;
    }
  }

  async mintTokensToPlayer(
    tokenMint: PublicKey,
    playerPublicKey: PublicKey,
    amount: number,
    authority: PublicKey
  ): Promise<Transaction> {
    try {
      const playerTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        playerPublicKey
      );

      const transaction = new Transaction().add(
        createMintToInstruction(
          tokenMint,
          playerTokenAccount,
          authority,
          amount * Math.pow(10, GAME_CONFIG.tokenDecimals),
          []
        )
      );

      return transaction;
    } catch (error) {
      console.error('Failed to mint tokens to player:', error);
      throw error;
    }
  }

  async transferTokensToHouse(
    tokenMint: PublicKey,
    playerPublicKey: PublicKey,
    housePublicKey: PublicKey,
    amount: number
  ): Promise<Transaction> {
    try {
      const playerTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        playerPublicKey
      );
      
      const houseTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        housePublicKey
      );

      const transaction = new Transaction().add(
        createTransferInstruction(
          playerTokenAccount,
          houseTokenAccount,
          playerPublicKey,
          amount * Math.pow(10, GAME_CONFIG.tokenDecimals),
          []
        )
      );

      return transaction;
    } catch (error) {
      console.error('Failed to transfer tokens to house:', error);
      throw error;
    }
  }

  async transferTokensToPlayer(
    tokenMint: PublicKey,
    housePublicKey: PublicKey,
    playerPublicKey: PublicKey,
    amount: number
  ): Promise<Transaction> {
    try {
      const houseTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        housePublicKey
      );
      
      const playerTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        playerPublicKey
      );

      const transaction = new Transaction().add(
        createTransferInstruction(
          houseTokenAccount,
          playerTokenAccount,
          housePublicKey,
          amount * Math.pow(10, GAME_CONFIG.tokenDecimals),
          []
        )
      );

      return transaction;
    } catch (error) {
      console.error('Failed to transfer tokens to player:', error);
      throw error;
    }
  }

  async getTokenAccountBalance(
    tokenAccount: PublicKey
  ): Promise<number> {
    try {
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return balance.value.uiAmount || 0;
    } catch (error) {
      console.error('Failed to get token account balance:', error);
      return 0;
    }
  }

  async validateTokenAccount(
    playerPublicKey: PublicKey,
    tokenMint: PublicKey
  ): Promise<boolean> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(tokenMint, playerPublicKey);
      const accountInfo = await this.connection.getAccountInfo(tokenAccount);
      return accountInfo !== null;
    } catch (error) {
      console.error('Failed to validate token account:', error);
      return false;
    }
  }
}

export const tokenService = new TokenService();
