# Overview

This is a 3D roulette casino game built with React Three Fiber (R3F) for the frontend 3D rendering and Express.js for the backend API. The application integrates with the Solana blockchain for cryptocurrency transactions and uses Drizzle ORM with PostgreSQL for data persistence. The game features immersive 3D graphics, particle effects, sound management, and real-time wallet integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **3D Rendering**: React Three Fiber (@react-three/fiber) with drei utilities
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand stores for game state, wallet connection, audio, and token management
- **Blockchain Integration**: Solana wallet adapters (Phantom, Solflare)
- **Build Tool**: Vite with custom configuration for 3D assets
- **Package Management**: npm with ES modules

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with express-session
- **API Design**: RESTful endpoints with validation using Zod
- **Blockchain**: Solana Web3.js integration for transaction handling
- **Development**: tsx for TypeScript execution, hot reload with Vite

## Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle with schema-first approach
- **Local Storage**: Browser localStorage for user preferences
- **File Storage**: JSON files for game states and statistics during development
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

# Key Components

## Game Engine
- **RouletteWheel**: 3D wheel rendering with physics simulation
- **BettingInterface**: Interactive betting controls and number grid
- **GameUI**: HUD displaying game status, balance, and controls
- **ParticleEffects**: Visual effects for wheel spinning and winning celebrations
- **SoundManager**: Audio management for background music and sound effects

## Blockchain Integration
- **WalletConnection**: Solana wallet adapter integration
- **TokenService**: Game token balance management and transactions
- **HouseWallet**: Server-side wallet for collecting bets and paying winnings
- **TransactionHandling**: Secure transaction signing and verification

## State Management
- **useRoulette**: Game state (phase, bets, winning numbers, spin logic)
- **useWallet**: Wallet connection status and address management
- **useTokens**: Token balance tracking and transaction history
- **useAudio**: Sound effects and background music control

## API Services
- **Game Routes** (`/api/game`): Game session management, bet placement, wheel spinning
- **Solana Routes** (`/api/solana`): Wallet balance queries, transaction processing
- **User Routes** (`/api/user`): User account management and statistics

# Data Flow

1. **Game Initialization**: User connects Solana wallet → Frontend validates connection → Backend creates game session
2. **Betting Phase**: User places bets → Frontend updates local state → Backend validates and stores bets
3. **Spinning Phase**: User spins wheel → 3D animation plays → Backend calculates winning number → Results displayed
4. **Transaction Processing**: Winnings calculated → Solana transactions created → User signs transactions → Tokens transferred
5. **State Synchronization**: Game state persisted to database → Frontend state updated → Statistics tracked

# External Dependencies

## Frontend Dependencies
- **@solana/wallet-adapter-react**: Wallet connection management
- **@radix-ui/\***: Accessible UI component primitives
- **@react-three/fiber**: React Three.js integration
- **@react-three/drei**: Three.js utilities and helpers
- **@tanstack/react-query**: Server state management
- **three**: 3D graphics library

## Backend Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver
- **@solana/web3.js**: Solana blockchain interaction
- **drizzle-orm**: Type-safe database ORM
- **express**: Web server framework
- **zod**: Runtime type validation

## Development Dependencies
- **typescript**: Type checking and compilation
- **vite**: Build tool and development server
- **tailwindcss**: Utility-first CSS framework
- **tsx**: TypeScript execution for Node.js

# Deployment Strategy

## Development Environment
- **Frontend**: Vite development server with HMR
- **Backend**: tsx with auto-reload on file changes
- **Database**: Neon PostgreSQL serverless database
- **Environment Variables**: DATABASE_URL, SOLANA_RPC_URL, GAME_TOKEN_MINT

## Production Build
- **Frontend**: Static asset generation via `vite build`
- **Backend**: ESBuild bundling for Node.js deployment
- **Database Migrations**: Drizzle Kit for schema updates
- **Asset Handling**: Support for GLTF/GLB 3D models and audio files

## Key Configuration Files
- **drizzle.config.ts**: Database connection and migration settings
- **vite.config.ts**: Frontend build configuration with 3D asset support
- **tsconfig.json**: TypeScript compilation settings for monorepo
- **tailwind.config.ts**: CSS framework configuration with custom design tokens

The application follows a modern full-stack architecture with strong type safety, blockchain integration, and immersive 3D gaming experience. The modular design allows for easy extension of game features and blockchain functionality.