import type { Express } from "express";
import { createServer, type Server } from "http";
import gameRoutes from "./routes/game";
import solanaRoutes from "./routes/solana";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Game routes - handle all roulette game logic
  app.use("/api/game", gameRoutes);

  // Solana blockchain routes - handle wallet and token operations
  app.use("/api/solana", solanaRoutes);

  // User management routes (existing)
  app.get("/api/user/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Failed to get user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/user", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const user = await storage.createUser({ username, password });
      res.status(201).json(user);
    } catch (error) {
      console.error("Failed to create user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Token management endpoints
  app.get("/api/tokens/stats", async (req, res) => {
    try {
      const { tokenService } = await import("./services/token-service");
      const stats = await tokenService.getTotalStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get token stats:", error);
      res.status(500).json({ error: "Failed to get token stats" });
    }
  });

  app.get("/api/tokens/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { tokenService } = await import("./services/token-service");
      const leaderboard = await tokenService.getTopPlayers(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Failed to get leaderboard:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  // House wallet endpoints
  app.get("/api/house/stats", async (req, res) => {
    try {
      const { houseWallet } = await import("./services/house-wallet");
      const stats = await houseWallet.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get house stats:", error);
      res.status(500).json({ error: "Failed to get house stats" });
    }
  });

  app.get("/api/house/transactions", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const { houseWallet } = await import("./services/house-wallet");
      const transactions = await houseWallet.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Failed to get house transactions:", error);
      res.status(500).json({ error: "Failed to get house transactions" });
    }
  });

  // Game statistics endpoints
  app.get("/api/stats/global", async (req, res) => {
    try {
      const { gameStateService } = await import("./services/game-state");
      const stats = await gameStateService.getGlobalStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get global stats:", error);
      res.status(500).json({ error: "Failed to get global stats" });
    }
  });

  app.get("/api/stats/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { gameStateService } = await import("./services/game-state");
      const leaderboard = await gameStateService.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Failed to get leaderboard:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  app.get("/api/stats/active-games", async (req, res) => {
    try {
      const { gameStateService } = await import("./services/game-state");
      const activeGames = await gameStateService.getActiveGames();
      res.json(activeGames);
    } catch (error) {
      console.error("Failed to get active games:", error);
      res.status(500).json({ error: "Failed to get active games" });
    }
  });

  // Admin endpoints (protected in production)
  app.post("/api/admin/reset-player/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      // Reset game state and token balance
      const { gameStateService } = await import("./services/game-state");
      const { tokenService } = await import("./services/token-service");
      
      await gameStateService.resetPlayerData(walletAddress);
      await tokenService.resetPlayerBalance(walletAddress);
      
      res.json({ message: `Reset data for ${walletAddress}` });
    } catch (error) {
      console.error("Failed to reset player:", error);
      res.status(500).json({ error: "Failed to reset player" });
    }
  });

  app.post("/api/admin/backup", async (req, res) => {
    try {
      const { tokenService } = await import("./services/token-service");
      const backupPath = await tokenService.backup();
      
      res.json({ 
        message: "Backup created successfully",
        backupPath: backupPath
      });
    } catch (error) {
      console.error("Failed to create backup:", error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ 
      error: "Internal server error",
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
