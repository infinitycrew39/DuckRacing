import React from 'react';
import { useGameStore } from '../store/gameStore';
import { RaceState } from '../types';

const Header: React.FC = () => {
  const { raceState, currentRace } = useGameStore();

  const getRaceStatusText = () => {
    switch (raceState) {
      case RaceState.WAITING:
        return 'Waiting for race to start...';
      case RaceState.BETTING:
        return 'Betting is open!';
      case RaceState.RACING:
        return 'Race in progress!';
      case RaceState.FINISHED:
        return 'Race finished!';
      default:
        return 'Duck Racing';
    }
  };

  const getRaceStatusColor = () => {
    switch (raceState) {
      case RaceState.WAITING:
        return 'text-gray-600';
      case RaceState.BETTING:
        return 'text-green-600';
      case RaceState.RACING:
        return 'text-yellow-600';
      case RaceState.FINISHED:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <header className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🦆</div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Duck Racing</h1>
              <p className={`text-sm ${getRaceStatusColor()}`}>
                {getRaceStatusText()}
              </p>
            </div>
          </div>

          {/* Race Info */}
          {currentRace && (
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-gray-500">Race #</div>
                <div className="font-semibold">{currentRace.id}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Total Pot</div>
                <div className="font-semibold">{(() => {
                  const potAmount = parseFloat(currentRace.totalPot);
                  return isNaN(potAmount) ? '0.00000' : potAmount.toFixed(5);
                })()} ETH</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500">Total Bets</div>
                <div className="font-semibold">{currentRace.totalBets}</div>
              </div>
              {(raceState === RaceState.BETTING || raceState === RaceState.RACING) && (
                <div className="text-center">
                  <div className="text-gray-500">Betting Ends</div>
                  <div className="font-semibold">
                    <CountdownTimer deadline={currentRace.deadline} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Race Info */}
          {currentRace && (
            <div className="md:hidden flex items-center space-x-3 text-xs">
              <div className="text-center">
                <div className="text-gray-500">Race #{currentRace.id}</div>
                <div className="font-semibold">{(() => {
                  const potAmount = parseFloat(currentRace.totalPot);
                  return isNaN(potAmount) ? '0.00000' : potAmount.toFixed(5);
                })()} ETH</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Countdown Timer Component
const CountdownTimer: React.FC<{ deadline: number }> = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = deadline - now;

      if (remaining <= 0) {
        setTimeLeft('0:00');
        return;
      }

      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return <span className={timeLeft === '0:00' ? 'text-red-600' : ''}>{timeLeft}</span>;
};

export default Header;
