import React from 'react';
import { useGameStore } from '../store/gameStore';

const Leaderboard: React.FC = () => {
  const { raceHistory, currentRace } = useGameStore();

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Leaderboard</h2>
      
      {/* Current Race Info */}
      {currentRace && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Current Race #{currentRace.id}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total Pot:</span>
              <span className="font-semibold">{(() => {
                const potAmount = parseFloat(currentRace.totalPot);
                return isNaN(potAmount) ? '0.00000' : potAmount.toFixed(5);
              })()} ETH</span>
            </div>
            <div className="flex justify-between">
              <span>Total Bets:</span>
              <span className="font-semibold">{currentRace.totalBets}</span>
            </div>
          </div>
          
          {/* Hamster Betting Odds */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-600 mb-2">Betting Pool by Hamster:</h4>
            <div className="space-y-1">
              {currentRace.hamsterBets.map((bet, index) => {
                // Safe percentage calculation with proper error handling
                let percentage = '0.0';
                try {
                  const betAmount = parseFloat(bet);
                  const totalPot = parseFloat(currentRace.totalPot);
                  
                  if (totalPot > 0 && !isNaN(betAmount) && !isNaN(totalPot) && isFinite(betAmount) && isFinite(totalPot)) {
                    percentage = ((betAmount / totalPot) * 100).toFixed(1);
                  }
                } catch (error) {
                  console.warn('Error calculating percentage for hamster', index + 1, ':', error);
                  percentage = '0.0';
                }
                  
                return (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="flex items-center">
                      <span className="mr-2">🐹</span>
                      Hamster {index + 1}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-2">{(() => {
                        const betAmount = parseFloat(bet || '0');
                        return isNaN(betAmount) ? '0.00000' : betAmount.toFixed(5);
                      })()} ETH</span>
                      <span className="text-gray-500">({percentage}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Race History */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Recent Races</h3>
        
        {raceHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🏁</div>
            <p>No races completed yet.</p>
            <p className="text-sm">Be the first to participate!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {raceHistory.slice(-10).reverse().map((race) => (
              <div key={race.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">Race #{race.id}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(race.timestamp * 1000).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🏆</span>
                    <span className="text-sm font-medium">
                      {race.winnerDuck !== undefined && race.winnerDuck !== null && !isNaN(race.winnerDuck) 
                        ? `Hamster ${race.winnerDuck + 1} Won!`
                        : 'Race Completed!'
                      }
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {(() => {
                        const potAmount = parseFloat(race.totalPot);
                        return isNaN(potAmount) ? '0.00000' : potAmount.toFixed(5);
                      })()} ETH
                    </div>
                    <div className="text-xs text-gray-500">
                      {race.totalBets} bets
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Quick Stats */}
      {raceHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-semibold">{raceHistory.length}</div>
              <div className="text-gray-600">Total Races</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-semibold">
                {(raceHistory.reduce((sum, race) => sum + parseFloat(race.totalPot), 0)).toFixed(2)}
              </div>
              <div className="text-gray-600">Total Volume</div>
            </div>
          </div>
          
          {/* Most Winning Hamster */}
          {(() => {
            const hamsterWins = [0, 0, 0, 0];
            raceHistory.forEach(race => {
              if (race.winnerDuck !== undefined && race.winnerDuck !== null && !isNaN(race.winnerDuck) && race.winnerDuck >= 0 && race.winnerDuck < 4) {
                hamsterWins[race.winnerDuck]++;
              }
            });
            const topHamster = hamsterWins.indexOf(Math.max(...hamsterWins));
            const topWins = hamsterWins[topHamster];
            
            return topWins > 0 ? (
              <div className="mt-2 text-center p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-xs text-yellow-800">
                  🏆 Most Successful: Hamster {topHamster + 1} ({topWins} wins)
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
