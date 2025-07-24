import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useRoulette } from '../../lib/stores/useRoulette';
import { useTokens } from '../../lib/stores/useTokens';
import { useWallet } from '../../lib/stores/useWallet';
import { BetType, RouletteNumber } from '../../types/game';

const BettingInterface: React.FC = () => {
  const { 
    gamePhase, 
    currentBets, 
    placeBet, 
    clearBets, 
    spinWheel,
    winningNumber 
  } = useRoulette();
  
  const { balance, deductTokens } = useTokens();
  const { isConnected } = useWallet();
  
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedBetType, setSelectedBetType] = useState<BetType>('number');

  // Roulette numbers layout
  const numbers: RouletteNumber[] = Array.from({ length: 37 }, (_, i) => i as RouletteNumber);
  
  // Red and black numbers
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  const getNumberColor = (num: number) => {
    if (num === 0) return 'green';
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  const handleNumberBet = (number: RouletteNumber) => {
    if (gamePhase !== 'betting' || betAmount > balance) return;
    
    placeBet({
      type: 'number',
      value: number,
      amount: betAmount,
      payout: 35
    });
  };

  const handleColorBet = (color: 'red' | 'black') => {
    if (gamePhase !== 'betting' || betAmount > balance) return;
    
    placeBet({
      type: 'color',
      value: color,
      amount: betAmount,
      payout: 1
    });
  };

  const handleOddsEvenBet = (type: 'odd' | 'even') => {
    if (gamePhase !== 'betting' || betAmount > balance) return;
    
    placeBet({
      type: 'odds_evens',
      value: type,
      amount: betAmount,
      payout: 1
    });
  };

  const handleDozenBet = (dozen: 1 | 2 | 3) => {
    if (gamePhase !== 'betting' || betAmount > balance) return;
    
    placeBet({
      type: 'dozen',
      value: dozen,
      amount: betAmount,
      payout: 2
    });
  };

  const handleSpin = () => {
    if (currentBets.length === 0) return;
    
    // Deduct total bet amount from balance
    const totalBetAmount = currentBets.reduce((sum, bet) => sum + bet.amount, 0);
    deductTokens(totalBetAmount);
    
    spinWheel();
  };

  const getTotalBetAmount = () => {
    return currentBets.reduce((sum, bet) => sum + bet.amount, 0);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Betting Controls */}
        <Card className="bg-black/80 border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-yellow-400">Betting Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-white text-sm mb-2 block">Bet Amount</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min={1}
                max={balance}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => setBetAmount(10)}
                variant={betAmount === 10 ? "default" : "outline"}
                className="text-sm"
              >
                10
              </Button>
              <Button
                onClick={() => setBetAmount(50)}
                variant={betAmount === 50 ? "default" : "outline"}
                className="text-sm"
              >
                50
              </Button>
              <Button
                onClick={() => setBetAmount(100)}
                variant={betAmount === 100 ? "default" : "outline"}
                className="text-sm"
              >
                100
              </Button>
              <Button
                onClick={() => setBetAmount(balance)}
                variant="outline"
                className="text-sm"
              >
                Max
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSpin}
                disabled={gamePhase !== 'betting' || currentBets.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Spin ({currentBets.length} bets)
              </Button>
              <Button
                onClick={clearBets}
                disabled={gamePhase !== 'betting'}
                variant="outline"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Number Grid */}
        <Card className="bg-black/80 border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-yellow-400">Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-13 gap-1 mb-4">
              {/* Zero */}
              <Button
                onClick={() => handleNumberBet(0)}
                disabled={gamePhase !== 'betting'}
                className="h-8 text-xs bg-green-600 hover:bg-green-700 col-span-13"
              >
                0
              </Button>
              
              {/* Numbers 1-36 */}
              {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => (
                <Button
                  key={num}
                  onClick={() => handleNumberBet(num as RouletteNumber)}
                  disabled={gamePhase !== 'betting'}
                  className={`h-8 text-xs ${
                    getNumberColor(num) === 'red' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  } ${winningNumber === num ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  {num}
                </Button>
              ))}
            </div>
            
            {/* Outside Bets */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleColorBet('red')}
                disabled={gamePhase !== 'betting'}
                className="bg-red-600 hover:bg-red-700 text-xs"
              >
                Red (1:1)
              </Button>
              <Button
                onClick={() => handleColorBet('black')}
                disabled={gamePhase !== 'betting'}
                className="bg-gray-800 hover:bg-gray-700 text-xs"
              >
                Black (1:1)
              </Button>
              <Button
                onClick={() => handleOddsEvenBet('odd')}
                disabled={gamePhase !== 'betting'}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                Odd (1:1)
              </Button>
              <Button
                onClick={() => handleOddsEvenBet('even')}
                disabled={gamePhase !== 'betting'}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                Even (1:1)
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                onClick={() => handleDozenBet(1)}
                disabled={gamePhase !== 'betting'}
                className="bg-purple-600 hover:bg-purple-700 text-xs"
              >
                1st 12 (2:1)
              </Button>
              <Button
                onClick={() => handleDozenBet(2)}
                disabled={gamePhase !== 'betting'}
                className="bg-purple-600 hover:bg-purple-700 text-xs"
              >
                2nd 12 (2:1)
              </Button>
              <Button
                onClick={() => handleDozenBet(3)}
                disabled={gamePhase !== 'betting'}
                className="bg-purple-600 hover:bg-purple-700 text-xs"
              >
                3rd 12 (2:1)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Bets */}
        <Card className="bg-black/80 border-yellow-500/50">
          <CardHeader>
            <CardTitle className="text-yellow-400">Current Bets</CardTitle>
          </CardHeader>
          <CardContent>
            {currentBets.length === 0 ? (
              <p className="text-gray-400 text-sm">No bets placed</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {currentBets.map((bet, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                    <div className="text-white text-sm">
                      <div>{bet.type}: {bet.value}</div>
                      <div className="text-xs text-gray-400">Payout: {bet.payout}:1</div>
                    </div>
                    <Badge variant="outline" className="text-yellow-400">
                      {bet.amount} tokens
                    </Badge>
                  </div>
                ))}
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between items-center text-white font-bold">
                    <span>Total:</span>
                    <span className="text-yellow-400">{getTotalBetAmount()} tokens</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BettingInterface;
