import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet as useWalletStore } from '../../lib/stores/useWallet';
import { Wallet, Shield, Coins, Gamepad2 } from 'lucide-react';

const WalletConnection: React.FC = () => {
  const { wallet, connected, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { setWalletAddress, setConnected } = useWalletStore();

  React.useEffect(() => {
    if (connected && wallet?.adapter.publicKey) {
      setWalletAddress(wallet.adapter.publicKey.toString());
      setConnected(true);
    } else {
      setConnected(false);
    }
  }, [connected, wallet, setWalletAddress, setConnected]);

  const handleConnect = () => {
    setVisible(true);
  };

  if (connected) {
    return null; // Don't show if already connected
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border-yellow-500/50 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-yellow-400" />
          </div>
          <CardTitle className="text-2xl text-white">
            Connect Your Wallet
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Connect your Solana wallet to start playing the roulette game
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm">Secure Solana Integration</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">Play-to-Earn Tokens</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Gamepad2 className="w-5 h-5 text-blue-400" />
              <span className="text-sm">AAA Gaming Experience</span>
            </div>
          </div>

          {/* Connect Button */}
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 text-lg"
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>

          {/* Supported Wallets */}
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-2">Supported Wallets:</p>
            <div className="flex justify-center gap-4 text-gray-500 text-xs">
              <span>Phantom</span>
              <span>•</span>
              <span>Solflare</span>
              <span>•</span>
              <span>And more</span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-300 text-xs text-center">
              🔒 Your wallet remains secure. We never store your private keys.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletConnection;
