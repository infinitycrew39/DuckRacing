import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useGameStore } from '../store/gameStore';
import { getProvider, handleContractError, formatEther } from '../utils/web3';
import { RaceState } from '../types';
import toast from 'react-hot-toast';
// import { DuckRacingAddresses } from "../contracts/FHECounterAddresses";
import { DuckRacingAddresses } from "../contracts/DuckRacingAddresses";
import { HamsterRacingABI } from "../contracts/HamsterRacing";
// This will be replaced with the actual contract address and ABI after deployment
let contractAddress = "";
let contractABI: any[] = [];

try {
  // Force use localhost address since we're running hardhat node
  contractAddress = DuckRacingAddresses["11155931"].address;
  contractABI = HamsterRacingABI.abi;
  console.log('📍 Using hardhat localhost contract address:', contractAddress);
} catch (error) {
  console.warn('Contract data not found. Please deploy the contract first.', error);
}

export const useContract = () => {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const eventListenersSetup = useRef(false);
  const lastRewardToastRef = useRef<string>('');
  const deadlineTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    account,
    animationWinner,
    setCurrentRace,
    setPlayerBet,
    setPlayerStats,
    setRaceHistory,
    setRaceState,
    setWinner,
    setError,
    setLoading: setGlobalLoading,
    setBalance
  } = useGameStore();

  // Initialize contract
  useEffect(() => {
    const initContract = async () => {
      if (!account || !contractAddress || !contractABI.length) {
        setContract(null);
        return;
      }

      try {
        const provider = getProvider();
        if (!provider) {
          throw new Error('Provider not available');
        }

        console.log('🔧 Initializing contract:', contractAddress);
        
        // Check network using ethers provider
        try {
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);
          const network = await ethersProvider.getNetwork();
          console.log('🌐 Current network chainId:', network.chainId);
          
          // For localhost/hardhat, chainId should be 1337 or 31337
          if (network.chainId !== 1337n && network.chainId !== 31337n) {
            console.warn('⚠️ Not on localhost network. Current:', network.chainId, 'Expected: 1337 or 31337');
          }
          
          // Test contract code
          const code = await ethersProvider.getCode(contractAddress);
          console.log('📝 Contract code length:', code.length);
          if (code === '0x') {
            throw new Error('No contract deployed at this address on current network');
          }
        } catch (error) {
          console.error('❌ Network/Contract validation failed:', error);
          // Don't throw here, continue with contract creation
        }
        
        const signer = await provider.getSigner();
        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
        
        setContract(contractInstance);
        
        // Check if current account is owner
        try {
          const contractOwner = await contractInstance.owner();
          const isCurrentUserOwner = contractOwner.toLowerCase() === account.toLowerCase();
          setIsOwner(isCurrentUserOwner);
          console.log('👤 Owner check:', {
            contractOwner,
            currentAccount: account,
            isOwner: isCurrentUserOwner
          });
        } catch (error) {
          console.error('❌ Error checking owner:', error);
          setIsOwner(false);
        }
        
        console.log('✅ Contract initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing contract:', error);
        setContract(null);
      }
    };

    initContract();
  }, [account]);

  // Load initial data
  useEffect(() => {
    if (contract && account) {
      console.log('🔄 Setting up contract data and event listeners...');
      loadGameData();
      setupEventListeners();
      
      // Load balance initially and whenever contract or account changes
      loadBalance();
    }
    
    return () => {
      if (contract) {
        console.log('🧹 Cleaning up event listeners...');
        contract.removeAllListeners();
        eventListenersSetup.current = false;
        lastRewardToastRef.current = '';
      }
      
      // Clear deadline timer
      if (deadlineTimerRef.current) {
        console.log('🧹 Clearing deadline timer...');
        clearInterval(deadlineTimerRef.current);
        deadlineTimerRef.current = null;
      }
    };
  }, [contract, account]);

  const loadGameData = async () => {
    if (!contract) return;

    try {
      setGlobalLoading(true);
      
      console.log('📊 Loading game data...');
      
      // Load current race info
      await loadCurrentRace();
      
      // Load player stats
      await loadPlayerStats();
      
      // Load race history
      await loadRaceHistory();
      
      // Load current balance
      await loadBalance();
      
      console.log('✅ Game data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading game data:', error);
      setError(handleContractError(error));
    } finally {
      setGlobalLoading(false);
    }
  };

  // Load wallet balance
  const loadBalance = async () => {
    if (!account) return;

    try {
      const provider = getProvider();
      if (!provider) return;

      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const balance = await ethersProvider.getBalance(account);
      const balanceInEth = ethers.formatEther(balance);
      
      console.log('💰 Balance updated:', balanceInEth, 'ETH');
      setBalance(balanceInEth);
      
    } catch (error) {
      console.error('❌ Error loading balance:', error);
    }
  };

  // Setup deadline timer to check race state
  const setupDeadlineTimer = (deadline: number) => {
    // Clear existing timer
    if (deadlineTimerRef.current) {
      clearInterval(deadlineTimerRef.current);
    }

    // Check deadline every 1 second
    deadlineTimerRef.current = setInterval(async () => {
      const now = Date.now() / 1000;
      const timeLeft = deadline - now;
      
      console.log('⏰ Deadline check:', {
        deadline,
        now,
        timeLeft,
        expired: timeLeft <= 0
      });

      if (timeLeft <= 0) {
        console.log('⏰ Deadline reached! Auto-ending race...');
        
        // Clear the timer first
        if (deadlineTimerRef.current) {
          clearInterval(deadlineTimerRef.current);
          deadlineTimerRef.current = null;
        }
        
        // Automatically end the race when deadline is reached
        try {
          console.log('🏁 Setting race state to RACING for animation...');
          setRaceState(RaceState.RACING);
          
          // Show notification that deadline has passed
          toast('Betting deadline reached! Race is starting...', {
            id: 'deadline-reached',
            duration: 3000,
            icon: '⏰'
          });
          
          // Auto end race after exactly 20 seconds to allow race animation to complete
          setTimeout(async () => {
            try {
              console.log('🏁 20-second animation completed. Race ready to be ended by owner.');
              
              // Don't auto-end, just show notification for owner to manually end
              if (contract && account && isOwner) {
                toast('🏁 Race animation completed! Click "End Race" to finalize results.', {
                  id: 'race-ready-to-end',
                  duration: 10000,
                  icon: '🏁'
                });
              } else {
                console.log('⚠️ Current user is not owner, waiting for owner to end race');
                toast('🏁 Race completed! Waiting for owner to end race and distribute rewards...', {
                  id: 'race-completed-wait-owner',
                  duration: 8000,
                  icon: '⏳'
                });
              }
            } catch (error) {
              console.error('❌ Error in race completion logic:', error);
            }
          }, 20000); // 20 second delay for full race animation
          
        } catch (error) {
          console.error('❌ Error in deadline handler:', error);
          setRaceState(RaceState.RACING);
        }
      }
    }, 1000);
  };

  const loadCurrentRace = async () => {
    if (!contract) return;

    try {
      console.log('🔍 Loading current race info...');
      console.log('Contract address:', contractAddress);
      console.log('Contract instance:', !!contract);
      
      // Check if contract is deployed by calling a simple view function first
      try {
        const owner = await contract.owner();
        console.log('Contract owner:', owner);
      } catch (error) {
        console.error('Contract not deployed or address incorrect:', error);
        throw new Error('Contract not deployed at this address');
      }
      
      const [id, inProgress, deadline, totalPot, totalBets, hamsterBets] = await contract.getCurrentRaceInfo();
      
      console.log('� Raw data from contract:', {
        id: id.toString(),
        inProgress,
        deadline: deadline.toString(),
        totalPot: totalPot.toString(),
        totalBets: totalBets.toString(),
        hamsterBets: hamsterBets.map((bet: any) => bet.toString())
      });
      
      console.log('�📊 Race info loaded:', {
        id: Number(id),
        inProgress,
        deadline: Number(deadline),
        totalPot: formatEther(totalPot),
        totalBets: Number(totalBets),
        hamsterBets: hamsterBets.map((bet: any) => formatEther(bet))
      });
      
      const raceInfo = {
        id: Number(id),
        inProgress,
        deadline: Number(deadline),
        totalPot: formatEther(totalPot),
        totalBets: Number(totalBets),
        hamsterBets: hamsterBets.map((bet: any) => {
          try {
            return formatEther(bet);
          } catch (error) {
            console.warn('Error formatting duck bet:', bet, error);
            return '0.0000';
          }
        })
      };
      
      setCurrentRace(raceInfo);
      
      if (inProgress) {
        const now = Date.now() / 1000;
        if (now < raceInfo.deadline) {
          setRaceState(RaceState.BETTING);
          // Setup timer to automatically transition to RACING when deadline is reached
          setupDeadlineTimer(raceInfo.deadline);
        } else {
          setRaceState(RaceState.RACING);
        }
      } else {
        setRaceState(RaceState.WAITING);
        // Clear any existing deadline timer when no race is in progress
        if (deadlineTimerRef.current) {
          clearInterval(deadlineTimerRef.current);
          deadlineTimerRef.current = null;
        }
      }

      // Load player bet for current race
      if (inProgress && account) {
        const [duckId, amount, hasBet] = await contract.getPlayerBet(account);
        
        if (hasBet) {
          setPlayerBet({
            duckId: Number(duckId),
            amount: formatEther(amount),
            hasBet: true
          });
        } else {
          // Clear player bet if no bet found for current race
          setPlayerBet(null);
        }
      } else {
        // Clear player bet if no race is in progress
        setPlayerBet(null);
      }
      
    } catch (error) {
      console.error('Error loading current race:', error);
      // Don't throw the error to prevent app crash, just log it
      setError(`Contract error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadPlayerStats = async () => {
    if (!contract || !account) return;

    try {
      const stats = await contract.getPlayerStats(account);
      
      console.log('🔍 Raw player stats from contract:', {
        totalBets: stats.totalBets.toString(),
        totalWinnings: stats.totalWinnings.toString(),
        racesWon: stats.racesWon.toString(),
        racesPlayed: stats.racesPlayed.toString()
      });
      
      const formattedStats = {
        totalBets: formatEther(stats.totalBets),
        totalWinnings: formatEther(stats.totalWinnings),
        racesWon: Number(stats.racesWon),
        racesPlayed: Number(stats.racesPlayed)
      };
      
      console.log('📊 Formatted player stats:', formattedStats);
      setPlayerStats(formattedStats);
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  const loadRaceHistory = async () => {
    if (!contract) return;

    try {
      const history = await contract.getRaceHistory();
      
      const formattedHistory = history.map((race: any) => ({
        id: Number(race.id),
        winnerDuck: Number(race.winnerDuck || race.winnerHamster || 0), // Handle both field names and default to 0 if undefined
        totalPot: formatEther(race.totalPot),
        timestamp: Number(race.timestamp),
        totalBets: Number(race.totalBets)
      }));
      
      console.log('📊 Formatted race history:', formattedHistory);
      setRaceHistory(formattedHistory);
    } catch (error) {
      console.error('Error loading race history:', error);
    }
  };

  const setupEventListeners = () => {
    if (!contract) return;

    // Prevent setting up listeners multiple times
    if (eventListenersSetup.current) {
      console.log('🔄 Event listeners already setup, skipping...');
      return;
    }

    console.log('🎧 Setting up event listeners...');
    
    // Remove all existing listeners first to prevent duplicates
    contract.removeAllListeners();
    
    // Clear any previous reward toast history when setting up new listeners
    lastRewardToastRef.current = '';

    contract.on('RaceStarted', (raceId: any) => {
      console.log('🏁 Race started event received:', Number(raceId));
      setRaceState(RaceState.BETTING);
      
      // Clear previous race data when new race starts
      setPlayerBet(null);
      setWinner(null);
      lastRewardToastRef.current = ''; // Clear reward toast history
      
      // Reset duck positions and clear selection using store action
      const { resetRace } = useGameStore.getState();
      resetRace();
      
      loadCurrentRace();
      
      // Use unique toast ID to prevent duplicates
      const toastId = `race-started-${Number(raceId)}`;
      toast.success('New race started! Place your bets!', { id: toastId });
    });

    contract.on('BetPlaced', (player: string, raceId: any, duckId: any, amount: any) => {
      console.log('🎯 Bet placed event received:', { player, raceId: Number(raceId), duckId: Number(duckId), amount });
      
      // Only show toast for the current player and use unique ID to prevent duplicates
      if (player.toLowerCase() === account?.toLowerCase()) {
        const toastId = `bet-${player.slice(-6)}-${Number(raceId)}-${Number(duckId)}`;
        toast.success(`Bet placed on Hamster ${Number(duckId) + 1}!`, { id: toastId });
        
        setPlayerBet({
          duckId: Number(duckId),
          amount: formatEther(amount),
          hasBet: true
        });
      }
      
      // Update tất cả data cùng lúc
      console.log('🔄 BetPlaced event: updating race data and balance...');
      loadCurrentRace();
      
      // Chỉ update balance cho player hiện tại
      if (player.toLowerCase() === account?.toLowerCase()) {
        setTimeout(() => {
          loadBalance();
        }, 500);
      }
    });

    contract.on('RaceEnded', (raceId: any, winnerDuck: any) => {
      console.log('🏁 Race ended event received:', { raceId: Number(raceId), winnerDuck: Number(winnerDuck) });
      setWinner(Number(winnerDuck));
      setRaceState(RaceState.FINISHED);
      
      // Use unique toast ID to prevent duplicates
      const toastId = `race-ended-${Number(raceId)}-${Number(winnerDuck)}`;
      toast.success(`Hamster ${Number(winnerDuck) + 1} wins the race!`, { id: toastId });
      
      // Reload data after race ends with debounce
      setTimeout(() => {
        console.log('🔄 Reloading game data after race end...');
        loadGameData();
      }, 2000);
      
      // Update balance after race ends (in case user won)
      setTimeout(() => {
        console.log('💰 Updating balance after race end...');
        loadBalance();
      }, 3000);
    });

    contract.on('RewardDistributed', (player: string, amount: any) => {
      console.log('💰 Reward distributed event received:', { 
        player, 
        amount, 
        isCurrentPlayer: player.toLowerCase() === account?.toLowerCase(),
        currentAccount: account 
      });
      
      if (player.toLowerCase() === account?.toLowerCase()) {
        // Use player address and amount to create unique toast ID
        const amountStr = formatEther(amount);
        const toastId = `reward-${player.slice(-8)}-${amountStr.replace('.', '')}`;
        
        console.log('🔍 Reward toast check:', {
          toastId,
          lastRewardToast: lastRewardToastRef.current,
          isDuplicate: lastRewardToastRef.current === toastId
        });
        
        // Prevent duplicate reward toasts for the same amount
        if (lastRewardToastRef.current === toastId) {
          console.log('🚫 Duplicate reward toast prevented:', toastId);
          return;
        }
        
        lastRewardToastRef.current = toastId;
        console.log('🎉 Showing reward toast with ID:', toastId);
        
        toast.success(`Congratulations! You won ${amountStr} ETH!`, { 
          id: toastId,
          duration: 5000, // Show longer for reward notifications
          icon: '🎉'
        });
        
        // Update balance after receiving reward
        setTimeout(() => {
          console.log('💰 Updating balance after reward distribution...');
          loadBalance();
        }, 2000);
        
        // Clear the ref after some time to allow future rewards
        setTimeout(() => {
          if (lastRewardToastRef.current === toastId) {
            lastRewardToastRef.current = '';
            console.log('🧹 Cleared reward toast ref after timeout');
          }
        }, 10000);
      }
    });

    eventListenersSetup.current = true;
    console.log('✅ Event listeners setup completed');
  };

  const placeBet = async (duckId: number, betAmount: string) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    // Prevent double-clicking/calling while already processing
    if (loading) {
      console.log('⏳ Bet already in progress, please wait...');
      return;
    }

    try {
      setLoading(true);
      
      console.log(`🎯 Placing bet on hamster ${duckId} with ${betAmount} ETH`);
      
      const tx = await contract.placeBet(duckId, {
        value: ethers.parseEther(betAmount)
      });
      
      // Use unique toast ID for this transaction
      const loadingToastId = `placing-bet-${tx.hash}`;
      toast.loading('Transaction submitted, waiting for confirmation...', { id: loadingToastId });
      
      // Chờ transaction confirm hoàn toàn trên blockchain
      await tx.wait();
      
      // Update the same toast to success
      toast.success('Bet confirmed on blockchain!', { id: loadingToastId });
      
      // Reload tất cả data cùng lúc: race info (Total Pot, Total Bets) và balance
      console.log('� Updating all data: race info, balance, and player stats...');
      await loadCurrentRace();
      await loadBalance();
      await loadPlayerStats();
      
    } catch (error: any) {
      console.error('❌ Error placing bet:', error);
      
      const errorMessage = handleContractError(error);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startRace = async () => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    // Prevent double-clicking/calling while already processing
    if (loading) {
      console.log('⏳ Race starting already in progress, please wait...');
      return;
    }

    try {
      setLoading(true);
      
      const tx = await contract.startRace();
      
      // Use unique toast ID for this transaction
      const loadingToastId = `starting-race-${tx.hash}`;
      toast.loading('Starting race...', { id: loadingToastId });
      
      await tx.wait();
      
      toast.success('Race started!', { id: loadingToastId });
      
    } catch (error: any) {
      console.error('Error starting race:', error);
      const errorMessage = handleContractError(error);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const endRace = async () => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    // Prevent double-clicking/calling while already processing
    if (loading) {
      console.log('⏳ Race ending already in progress, please wait...');
      return;
    }

    try {
      setLoading(true);
      
      // Use winner from race animation instead of random
      // @ts-ignore - temporary ignore typescript error for animationWinner
      const winnerFromAnimation = animationWinner !== null ? animationWinner : Math.floor(Math.random() * 4);
      console.log('� Using animation winner:', winnerFromAnimation);
      
      const tx = await contract.emergencyEndRace(winnerFromAnimation);
      
      // Use unique toast ID for this transaction
      const loadingToastId = `ending-race-${tx.hash}`;
      toast.loading('Ending race...', { id: loadingToastId });
      
      await tx.wait();
      
      toast.success('Race ended! Waiting for results...', { id: loadingToastId });
      
    } catch (error: any) {
      console.error('Error ending race:', error);
      const errorMessage = handleContractError(error);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = useCallback(() => {
    if (contract && account) {
      loadGameData();
    }
  }, [contract, account]);

  return {
    contract,
    loading,
    isOwner,
    placeBet,
    startRace,
    endRace,
    refreshData,
    loadCurrentRace,
    contractAddress,
    isContractReady: Boolean(contract && contractAddress)
  };
};
