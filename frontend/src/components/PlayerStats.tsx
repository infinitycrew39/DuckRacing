import React from 'react';
import { useGameStore } from '../store/gameStore';

const PlayerStats: React.FC = () => {
  const { playerStats } = useGameStore();

  if (!playerStats) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Player Stats</h2>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">📊</div>
          <p>No stats available yet.</p>
          <p className="text-sm">Place your first bet to get started!</p>
        </div>
      </div>
    );
  }

  // Safe calculations with NaN handling
  const winRate = playerStats.racesPlayed > 0 && !isNaN(playerStats.racesPlayed) && !isNaN(playerStats.racesWon)
    ? ((playerStats.racesWon / playerStats.racesPlayed) * 100).toFixed(1)
    : '0.0';

  const totalBets = parseFloat(playerStats.totalBets) || 0;
  const totalWinnings = parseFloat(playerStats.totalWinnings) || 0;
  const profit = isNaN(totalWinnings) || isNaN(totalBets) 
    ? '0.00000' 
    : (totalWinnings - totalBets).toFixed(5);

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Player Stats</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{playerStats.racesPlayed}</div>
          <div className="text-sm text-gray-600">Races Played</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{playerStats.racesWon}</div>
          <div className="text-sm text-gray-600">Races Won</div>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{winRate}%</div>
          <div className="text-sm text-gray-600">Win Rate</div>
        </div>
        
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className={`text-2xl font-bold ${parseFloat(profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(profit) >= 0 ? '+' : ''}{profit}
          </div>
          <div className="text-sm text-gray-600">Profit (ETH)</div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Bets:</span>
          <span className="font-semibold">{isNaN(totalBets) ? '0.00000' : totalBets.toFixed(5)} ETH</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Total Winnings:</span>
          <span className="font-semibold">{isNaN(totalWinnings) ? '0.00000' : totalWinnings.toFixed(5)} ETH</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
