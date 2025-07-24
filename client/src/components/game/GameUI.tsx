import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useRoulette } from '../../lib/stores/useRoulette';
import { useTokens } from '../../lib/stores/useTokens';
import { useWallet } from '../../lib/stores/useWallet';
import { useAudio } from '../../lib/stores/useAudio';
import { Volume2, VolumeX, Trophy, Coins } from 'lucide-react';

const GameUI: React.FC = () => {
  const { 
    gamePhase, 
    winningNumber, 
    lastWinnings, 
    gameStats,
    resetGame 
  } = useRoulette();
  
  const { balance, totalEarned } = useTokens();
  const { walletAddress, disconnect } = useWallet();
  const { isMuted, toggleMute } = useAudio();

  const getPhaseDisplay = () => {
    switch (gamePhase) {
      case 'waiting':
        return { text: 'Connect Wallet', color: 'bg-gray-600' };
      case 'betting':
        return { text: 'Place Your Bets', color: 'bg-green-600' };
      case 'spinning':
        return { text: 'Spinning...', color: 'bg-yellow-600' };
      case 'result':
        return { text: 'Round Complete', color: 'bg-blue-600' };
      default:
        return { text: 'Ready', color: 'bg-gray-600' };
    }
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const phase = getPhaseDisplay();

  return (
    <div className="fixed top-0 left-0 right-0 p-4 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-start">
        
        {/* Left Panel - Game Status */}
        <Card className="bg-black/90 border-yellow-500/50 min-w-[300px]">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Game Phase */}
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Status:</span>
                <Badge className={`${phase.color} text-white`}>
                  {phase.text}
                </Badge>
              </div>

              {/* Winning Number */}
              {winningNumber !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Winning Number:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      winningNumber === 0 ? 'bg-green-600' : 
                      [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(winningNumber) 
                        ? 'bg-red-600' : 'bg-gray-800'
                    }`}>
                      {winningNumber}
                    </div>
                  </div>
                </div>
              )}

              {/* Last Winnings */}
              {lastWinnings > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Last Win:</span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    +{lastWinnings} tokens
                  </Badge>
                </div>
              )}

              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-center bg-gray-800/50 p-2 rounded">
                  <div className="text-gray-400">Rounds</div>
                  <div className="text-white font-bold">{gameStats.totalRounds}</div>
                </div>
                <div className="text-center bg-gray-800/50 p-2 rounded">
                  <div className="text-gray-400">Wins</div>
                  <div className="text-white font-bold">{gameStats.totalWins}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Wallet & Controls */}
        <Card className="bg-black/90 border-yellow-500/50 min-w-[300px]">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Wallet Info */}
              {walletAddress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Wallet:</span>
                    <span className="text-gray-400 text-sm font-mono">
                      {formatWalletAddress(walletAddress)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      Balance:
                    </span>
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      {balance.toLocaleString()} tokens
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      Total Earned:
                    </span>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {totalEarned.toLocaleString()} tokens
                    </Badge>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2 pt-2 border-t border-gray-700">
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>

                <Button
                  onClick={resetGame}
                  variant="outline"
                  size="sm"
                  disabled={gamePhase === 'spinning'}
                >
                  New Game
                </Button>

                <Button
                  onClick={disconnect}
                  variant="destructive"
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full-width result banner */}
      {gamePhase === 'result' && winningNumber !== null && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <Card className="bg-black/95 border-yellow-500 border-2 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white">Round Complete!</h2>
                
                <div className="flex items-center justify-center gap-4">
                  <span className="text-xl text-white">Winning Number:</span>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${
                    winningNumber === 0 ? 'bg-green-600' : 
                    [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(winningNumber) 
                      ? 'bg-red-600' : 'bg-gray-800'
                  }`}>
                    {winningNumber}
                  </div>
                </div>

                {lastWinnings > 0 && (
                  <div className="text-center">
                    <div className="text-green-400 text-2xl font-bold">
                      🎉 You Won {lastWinnings} Tokens! 🎉
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => useRoulette.getState().startNewRound()}
                  className="bg-green-600 hover:bg-green-700 text-lg px-8 py-2"
                >
                  Play Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GameUI;
