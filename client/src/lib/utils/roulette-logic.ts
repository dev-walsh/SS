import { RouletteNumber, Bet } from '../../types/game';

export class RouletteLogic {
  // European roulette wheel order
  private static readonly WHEEL_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
    24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];

  private static readonly RED_NUMBERS = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
  ];

  private static readonly BLACK_NUMBERS = [
    2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
  ];

  /**
   * Generate a random winning number based on wheel physics
   */
  public static generateWinningNumber(
    wheelRotation: number,
    ballPosition: number
  ): RouletteNumber {
    // Combine wheel rotation and ball position for randomness
    const totalRotation = (wheelRotation + ballPosition) % (Math.PI * 2);
    
    // Normalize to 0-1 range
    const normalizedPosition = totalRotation / (Math.PI * 2);
    
    // Get index in wheel order
    const segmentIndex = Math.floor(normalizedPosition * this.WHEEL_ORDER.length);
    
    return this.WHEEL_ORDER[segmentIndex] as RouletteNumber;
  }

  /**
   * Get the color of a number
   */
  public static getNumberColor(number: RouletteNumber): 'red' | 'black' | 'green' {
    if (number === 0) return 'green';
    if (this.RED_NUMBERS.includes(number)) return 'red';
    return 'black';
  }

  /**
   * Check if a number is odd
   */
  public static isOdd(number: RouletteNumber): boolean {
    return number !== 0 && number % 2 === 1;
  }

  /**
   * Check if a number is even
   */
  public static isEven(number: RouletteNumber): boolean {
    return number !== 0 && number % 2 === 0;
  }

  /**
   * Get the dozen of a number (1-12, 13-24, 25-36)
   */
  public static getDozen(number: RouletteNumber): 1 | 2 | 3 | null {
    if (number === 0) return null;
    return Math.ceil(number / 12) as 1 | 2 | 3;
  }

  /**
   * Get the column of a number (1, 2, or 3)
   */
  public static getColumn(number: RouletteNumber): 1 | 2 | 3 | null {
    if (number === 0) return null;
    const remainder = number % 3;
    if (remainder === 1) return 1;
    if (remainder === 2) return 2;
    return 3;
  }

  /**
   * Check if a bet wins for the given number
   */
  public static isBetWinning(bet: Bet, winningNumber: RouletteNumber): boolean {
    switch (bet.type) {
      case 'number':
        return bet.value === winningNumber;

      case 'color':
        if (winningNumber === 0) return false;
        const color = this.getNumberColor(winningNumber);
        return bet.value === color;

      case 'odds_evens':
        if (winningNumber === 0) return false;
        if (bet.value === 'odd') return this.isOdd(winningNumber);
        if (bet.value === 'even') return this.isEven(winningNumber);
        return false;

      case 'dozen':
        const dozen = this.getDozen(winningNumber);
        return dozen === bet.value;

      case 'column':
        const column = this.getColumn(winningNumber);
        return column === bet.value;

      case 'high_low':
        if (winningNumber === 0) return false;
        if (bet.value === 'low') return winningNumber >= 1 && winningNumber <= 18;
        if (bet.value === 'high') return winningNumber >= 19 && winningNumber <= 36;
        return false;

      default:
        return false;
    }
  }

  /**
   * Calculate total winnings for a set of bets
   */
  public static calculateWinnings(bets: Bet[], winningNumber: RouletteNumber): number {
    let totalWinnings = 0;

    bets.forEach(bet => {
      if (this.isBetWinning(bet, winningNumber)) {
        // Winnings = bet amount * payout ratio + original bet
        totalWinnings += bet.amount * (bet.payout + 1);
      }
    });

    return totalWinnings;
  }

  /**
   * Get payout odds for different bet types
   */
  public static getPayoutOdds(betType: string): number {
    const payouts: Record<string, number> = {
      'number': 35,      // Straight up
      'split': 17,       // Split bet
      'street': 11,      // Street bet
      'corner': 8,       // Corner bet
      'line': 5,         // Line bet
      'dozen': 2,        // Dozen bet
      'column': 2,       // Column bet
      'color': 1,        // Red/Black
      'odds_evens': 1,   // Odd/Even
      'high_low': 1      // High/Low
    };

    return payouts[betType] || 1;
  }

  /**
   * Validate bet amount and type
   */
  public static validateBet(bet: Bet, maxBet: number, minBet: number): boolean {
    // Check amount limits
    if (bet.amount < minBet || bet.amount > maxBet) {
      return false;
    }

    // Check valid bet types and values
    switch (bet.type) {
      case 'number':
        return typeof bet.value === 'number' && 
               bet.value >= 0 && 
               bet.value <= 36;

      case 'color':
        return bet.value === 'red' || bet.value === 'black';

      case 'odds_evens':
        return bet.value === 'odd' || bet.value === 'even';

      case 'dozen':
        return bet.value === 1 || bet.value === 2 || bet.value === 3;

      case 'high_low':
        return bet.value === 'high' || bet.value === 'low';

      default:
        return false;
    }
  }

  /**
   * Generate random number with cryptographic randomness
   */
  public static generateSecureRandomNumber(): RouletteNumber {
    // Use crypto.getRandomValues for secure randomness
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    
    // Map to 0-36 range
    const randomIndex = array[0] % 37;
    return randomIndex as RouletteNumber;
  }

  /**
   * Get neighbors of a number on the wheel
   */
  public static getNeighbors(number: RouletteNumber, count: number = 2): RouletteNumber[] {
    const index = this.WHEEL_ORDER.indexOf(number);
    if (index === -1) return [];

    const neighbors: RouletteNumber[] = [];
    
    for (let i = -count; i <= count; i++) {
      if (i === 0) continue; // Skip the number itself
      
      const neighborIndex = (index + i + this.WHEEL_ORDER.length) % this.WHEEL_ORDER.length;
      neighbors.push(this.WHEEL_ORDER[neighborIndex] as RouletteNumber);
    }

    return neighbors;
  }
}
