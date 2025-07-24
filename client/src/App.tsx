import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
  TrustWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';
import "@fontsource/inter";
import "@solana/wallet-adapter-react-ui/styles.css";

// Import game components
import RouletteWheel from "./components/game/RouletteWheel";
import BettingInterface from "./components/game/BettingInterface";
import GameUI from "./components/game/GameUI";
import WalletButton from "./components/game/WalletButton";
import RouletteTable from "./components/game/RouletteTable";
import ParticleEffects from "./components/game/ParticleEffects";
import SoundManager from "./components/game/SoundManager";

// Import stores
import { useRoulette } from "./lib/stores/useRoulette";
import { useWallet as useWalletStore } from "./lib/stores/useWallet";

// Import Telegram integration
import "./lib/telegram/telegram-webapp";

// Define control keys for the game
const controls = [
  { name: "rotate", keys: ["KeyR"] },
  { name: "zoom", keys: ["KeyZ"] },
  { name: "spin", keys: ["Space"] },
  { name: "clear", keys: ["KeyC"] },
];

const queryClient = new QueryClient();

// Configure Solana network and wallets with Trust Wallet support
const network = WalletAdapterNetwork.Devnet; // Use devnet for development
const endpoint = clusterApiUrl(network);
const wallets = [
  new PhantomWalletAdapter(),
  new TrustWalletAdapter(), // Trust Wallet is now supported!
  new SolflareWalletAdapter(),
  new TorusWalletAdapter(),
];

// Main App component
function App() {
  const { gamePhase } = useRoulette();
  const { isConnected } = useWalletStore();
  const [showCanvas, setShowCanvas] = useState(false);

  // Show the canvas once everything is loaded
  useEffect(() => {
    setShowCanvas(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
              {/* Wallet Button - Always visible */}
              <WalletButton />
              
              {showCanvas && (
                <KeyboardControls map={controls}>
                  {/* Main game canvas - always show */}
                  {(
                    <>
                      <Canvas
                        shadows
                        camera={{
                          position: [0, 8, 12],
                          fov: 45,
                          near: 0.1,
                          far: 1000
                        }}
                        gl={{
                          antialias: true,
                          powerPreference: "high-performance"
                        }}
                      >
                        <color attach="background" args={["#0a0f1a"]} />

                        {/* Lighting setup */}
                        <ambientLight intensity={0.3} />
                        <directionalLight 
                          position={[10, 10, 5]} 
                          intensity={1}
                          castShadow
                          shadow-mapSize-width={2048}
                          shadow-mapSize-height={2048}
                        />
                        <pointLight position={[0, 5, 0]} intensity={0.8} />

                        <Suspense fallback={null}>
                          {/* Game components */}
                          <RouletteWheel />
                          <RouletteTable />
                          <ParticleEffects />
                        </Suspense>
                      </Canvas>

                      {/* UI Overlays */}
                      <GameUI />
                      <BettingInterface />
                    </>
                  )}

                  {/* Audio manager */}
                  <SoundManager />
                </KeyboardControls>
              )}
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}

export default App;
