import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet as useWalletStore } from '../../lib/stores/useWallet';
import { Button } from '../ui/button';
import { Wallet, LogOut, Copy, Check } from 'lucide-react';

const WalletButton: React.FC = () => {
  const { wallet, connected, connecting, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { setWalletAddress, setConnected, balance } = useWalletStore();
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toString());
      setConnected(true);
    } else {
      setConnected(false);
    }
  }, [connected, publicKey, setWalletAddress, setConnected]);

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const copyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connected && publicKey) {
    return (
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* Balance Display */}
        <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-yellow-500/30">
          <div className="text-xs text-gray-400">Balance</div>
          <div className="text-sm font-bold text-yellow-400">{balance.toFixed(2)} SOL</div>
        </div>

        {/* Wallet Info */}
        <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg border border-green-500/30 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <div>
            <div className="text-xs text-gray-400">Connected</div>
            <div className="text-sm font-mono flex items-center gap-1">
              {shortenAddress(publicKey.toString())}
              <button
                onClick={copyAddress}
                className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Disconnect Button */}
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        onClick={handleConnect}
        disabled={connecting}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-2 shadow-lg"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    </div>
  );
};

export default WalletButton;