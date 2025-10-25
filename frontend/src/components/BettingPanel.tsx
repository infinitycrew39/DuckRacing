import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useContract } from '../hooks/useContract';
import { RaceState } from '../types';
import { formatAddress } from '../utils/web3';
import toast from 'react-hot-toast';

const BettingPanel: React.FC = () => {
  const [betAmount, setBetAmount] = useState('0.00001');
  const [selectedHamster, setSelectedHamster] = useState<number | null>(null);
  
  const {
    raceState,
    currentRace,
    playerBet,
    ducks,
    account,
    balance,
    loading: globalLoading
  } = useGameStore();

  const { placeBet, startRace, endRace, loading: contractLoading, isContractReady, isOwner } = useContract();

  const isLoading = globalLoading || contractLoading;

  // Get selected hamster from store and handle race state changes
  React.useEffect(() => {
    const selected = ducks.find(duck => duck.selected);
    setSelectedHamster(selected ? selected.id : null);
    
    // Reset local form when new race starts
    if (raceState === RaceState.BETTING && !playerBet?.hasBet) {
      setBetAmount('0.00001');
    }
  }, [ducks, raceState, playerBet]);

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetAmount(e.target.value);
  };

  const handlePlaceBet = async () => {
    if (!isContractReady) {
      toast.error('Contract not ready. Please refresh the page.');
      return;
    }

    if (selectedHamster === null) {
      toast.error('Please select a hamster first!');
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error('Please enter a valid bet amount!');
      return;
    }

    if (parseFloat(betAmount) < 0.00001) {
      toast.error('Minimum bet is 0.00001 ETH!');
      return;
    }

    if (parseFloat(betAmount) > parseFloat(balance)) {
      toast.error('Insufficient balance!');
      return;
    }

    // Prevent double-clicking while bet is being processed
    if (isLoading) {
      console.log('⏳ Bet already in progress...');
      return;
    }

    try {
      await placeBet(selectedHamster, betAmount);
      
      // Reset form after successful bet (optional)
      // setSelectedHamster(null);
      // setBetAmount('0.00001');
      
    } catch (error: any) {
      console.error('Error placing bet:', error);
      // Error is already handled in placeBet function
    }
  };

  const handleStartRace = async () => {
    if (!isContractReady) {
      toast.error('Contract not ready. Please refresh the page.');
      return;
    }

    // Prevent double-clicking while race is being started
    if (isLoading) {
      console.log('⏳ Race start already in progress...');
      return;
    }

    try {
      await startRace();
    } catch (error: any) {
      console.error('Error starting race:', error);
    }
  };

  const handleEndRace = async () => {
    if (!isContractReady) {
      toast.error('Contract not ready. Please refresh the page.');
      return;
    }

    // Prevent double-clicking while race is being ended
    if (isLoading) {
      console.log('⏳ Race end already in progress...');
      return;
    }

    try {
      await endRace();
    } catch (error: any) {
      console.error('Error ending race:', error);
    }
  };

  const canPlaceBet = () => {
    const now = Date.now() / 1000;
    console.log('🔍 CanPlaceBet check:', {
      raceState,
      hasPlayerBet: playerBet?.hasBet,
      selectedHamster,
      isLoading,
      currentRace: !!currentRace,
      deadline: currentRace?.deadline,
      now,
      timeLeft: currentRace ? currentRace.deadline - now : 0
    });
    
    // Allow betting during BETTING or RACING states, but not FINISHED or WAITING
    const canBetInCurrentState = raceState === RaceState.BETTING || raceState === RaceState.RACING;
    
    return canBetInCurrentState && 
           !playerBet?.hasBet && 
           selectedHamster !== null && 
           !isLoading &&
           currentRace &&
           now < currentRace.deadline;
  };

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Betting Panel</h2>
        <p className="text-gray-600 text-sm">
          {account ? `Connected: ${formatAddress(account)}` : 'Not connected'}
        </p>
      </div>

      {/* Current Balance */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Balance:</span>
          <span className="font-bold text-lg text-blue-600">
            {(() => {
              const balanceNum = parseFloat(balance);
              return isNaN(balanceNum) ? '0.00000' : balanceNum.toFixed(5);
            })()} ETH
          </span>
        </div>
      </div>

      {/* Hamster Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Your Hamster:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ducks.map((duck) => (
            <button
              key={duck.id}
              onClick={() => {
                const canSelectHamster = raceState === RaceState.BETTING || raceState === RaceState.RACING;
                if (canSelectHamster) {
                  useGameStore.getState().selectDuck(duck.id);
                }
              }}
              disabled={!(raceState === RaceState.BETTING || raceState === RaceState.RACING) || isLoading}
              className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                duck.selected
                  ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${
                (raceState === RaceState.BETTING || raceState === RaceState.RACING) && !isLoading
                  ? 'cursor-pointer hover:shadow-md'
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className={`text-2xl mb-1 ${duck.color}`}>{duck.emoji}</div>
              <div className="text-xs font-medium text-gray-700">{duck.name}</div>
              {currentRace && (
                <div className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const betAmount = parseFloat(currentRace.hamsterBets[duck.id] || '0');
                    return isNaN(betAmount) ? '0.00000' : betAmount.toFixed(5);
                  })()} ETH
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bet Amount */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Bet Amount (ETH):
        </label>
        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={handleBetAmountChange}
            min="0.00001"
            step="0.00001"
            disabled={!(raceState === RaceState.BETTING || raceState === RaceState.RACING) || isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="0.00001"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            ETH
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Min: 0.00001 ETH</span>
          <span>Max: {(() => {
            const balanceNum = parseFloat(balance);
            return isNaN(balanceNum) ? '0.00000' : balanceNum.toFixed(5);
          })()} ETH</span>
        </div>
        
        {/* Quick bet buttons */}
        <div className="flex space-x-2 mt-2">
          {['0.00001', '0.0001', '0.001'].map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={!(raceState === RaceState.BETTING || raceState === RaceState.RACING) || isLoading || parseFloat(amount) > parseFloat(balance || '0')}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {amount}
            </button>
          ))}
        </div>
      </div>

      {/* Current Bet Display */}
      {playerBet?.hasBet && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Your Current Bet</h3>
          <div className="text-sm text-green-700">
            <p>Hamster: {ducks.find(d => d.id === playerBet.duckId)?.name} #{playerBet.duckId + 1}</p>
            <p>Amount: {(() => {
              const betAmount = parseFloat(playerBet.amount);
              return isNaN(betAmount) ? '0.00000' : betAmount.toFixed(5);
            })()} ETH</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Place Bet Button */}
        <button
          onClick={handlePlaceBet}
          disabled={!canPlaceBet() || isLoading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Placing Bet...
            </span>
          ) : playerBet?.hasBet ? (
            'Bet Placed ✅'
          ) : (
            'Place Bet 🎯'
          )}
        </button>

        {/* Owner Controls (for testing) */}
        {raceState === RaceState.WAITING && isOwner && (
          <button
            onClick={handleStartRace}
            disabled={isLoading}
            className="w-full btn-secondary"
          >
            {isLoading ? 'Starting...' : 'Start Race (Owner)'}
          </button>
        )}

        {/* Show End Race button only for owner when deadline has passed and race is still in progress */}
        {raceState === RaceState.RACING && currentRace && Date.now() / 1000 >= currentRace.deadline && isOwner && (
          <button
            onClick={handleEndRace}
            disabled={isLoading}
            className="w-full btn-warning animate-pulse"
          >
            {isLoading ? 'Ending Race...' : '🏁 End Race & Distribute Rewards (Owner)'}
          </button>
        )}
        
        {/* Show info for non-owners when race should end */}
        {raceState === RaceState.RACING && currentRace && Date.now() / 1000 >= currentRace.deadline && !isOwner && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 text-center">
              🏁 Race completed! Waiting for owner to end race and distribute rewards...
            </p>
          </div>
        )}
      </div>

      {/* Race Status */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status:</span>
            <span className={`font-semibold ${
              raceState === RaceState.BETTING ? 'text-green-600' :
              raceState === RaceState.RACING ? 'text-yellow-600' :
              raceState === RaceState.FINISHED ? 'text-blue-600' :
              'text-gray-600'
            }`}>
              {raceState === RaceState.WAITING && 'Waiting for Race'}
              {raceState === RaceState.BETTING && 'Betting Open (5 min)'}
              {raceState === RaceState.RACING && 'Racing in Progress (20s)'}
              {raceState === RaceState.FINISHED && 'Race Finished'}
            </span>
          </div>
          
          {currentRace && (
            <>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600">Total Pot:</span>
                <span className="font-semibold">{(() => {
                  const potAmount = parseFloat(currentRace.totalPot);
                  return isNaN(potAmount) ? '0.00000' : potAmount.toFixed(5);
                })()} ETH</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600">Total Bets:</span>
                <span className="font-semibold">{currentRace.totalBets}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BettingPanel;
