import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress,
  getAccount,
  TokenAccountNotFoundError,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import { SOLANA_RPC_URL, GAME_TOKEN_MINT } from './config';

export class WalletAdapter {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  }

  async getConnection(): Promise<Connection> {
    return this.connection;
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get SOL balance:', error);
      throw error;
    }
  }

  async getTokenBalance(walletPublicKey: PublicKey, tokenMint: PublicKey): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(tokenMint, walletPublicKey);
      const account = await getAccount(this.connection, tokenAccount);
      return Number(account.amount);
    } catch (error) {
      if (error instanceof TokenAccountNotFoundError) {
        return 0;
      }
      console.error('Failed to get token balance:', error);
      throw error;
    }
  }

  async createTokenAccount(
    walletPublicKey: PublicKey, 
    tokenMint: PublicKey
  ): Promise<Transaction> {
    const tokenAccount = await getAssociatedTokenAddress(tokenMint, walletPublicKey);
    
    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        walletPublicKey, // payer
        tokenAccount, // associated token account
        walletPublicKey, // owner
        tokenMint // mint
      )
    );

    return transaction;
  }

  async sendTransaction(
    transaction: Transaction,
    wallet: any
  ): Promise<string> {
    try {
      // Get latest blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign and send transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      // Confirm transaction
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async airdropSol(publicKey: PublicKey, amount: number = 1): Promise<string> {
    try {
      const signature = await this.connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );
      
      await this.connection.confirmTransaction(signature, 'confirmed');
      return signature;
    } catch (error) {
      console.error('Failed to airdrop SOL:', error);
      throw error;
    }
  }

  async validateTransaction(signature: string): Promise<boolean> {
    try {
      const transaction = await this.connection.getTransaction(signature);
      return transaction !== null && transaction.meta?.err === null;
    } catch (error) {
      console.error('Failed to validate transaction:', error);
      return false;
    }
  }
}

export const walletAdapter = new WalletAdapter();
