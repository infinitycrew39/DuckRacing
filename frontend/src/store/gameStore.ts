import { create } from 'zustand';
import { GameState, RaceState, Duck, Race, PlayerBet, PlayerStats, RaceInfo } from '../types';

const DUCK_DATA: Duck[] = [
  { id: 0, name: 'Quackers', emoji: '🦆', color: 'text-yellow-500', position: 0, selected: false },
  { id: 1, name: 'Splash', emoji: '🦆', color: 'text-blue-500', position: 0, selected: false },
  { id: 2, name: 'Waddle', emoji: '🦆', color: 'text-green-500', position: 0, selected: false },
  { id: 3, name: 'Floaty', emoji: '🦆', color: 'text-purple-500', position: 0, selected: false },
];

interface GameStore extends GameState {
  // Actions
  setConnected: (connected: boolean) => void;
  setAccount: (account: string | null) => void;
  setBalance: (balance: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRaceState: (state: RaceState) => void;
  setCurrentRace: (race: RaceInfo | null) => void;
  setPlayerBet: (bet: PlayerBet | null) => void;
  setPlayerStats: (stats: PlayerStats | null) => void;
  setRaceHistory: (history: Race[]) => void;
  setWinner: (winner: number | null) => void;
  setAnimationWinner: (winner: number | null) => void;
  selectDuck: (duckId: number) => void;
  clearDuckSelection: () => void;
  resetRace: () => void;
  updateDuckPositions: (positions: number[]) => void;
  // Add animationWinner property
  animationWinner: number | null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  raceState: RaceState.WAITING,
  currentRace: null,
  playerBet: null,
  playerStats: null,
  raceHistory: [],
  ducks: DUCK_DATA,
  winner: null,
  animationWinner: null,
  isConnected: false,
  account: null,
  balance: '0',
  loading: false,
  error: null,

  // Actions
  setConnected: (connected) => set({ isConnected: connected }),
  
  setAccount: (account) => set({ account }),
  
  setBalance: (balance) => set({ balance }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setRaceState: (raceState) => set({ raceState }),
  
  setCurrentRace: (currentRace) => set({ currentRace }),
  
  setPlayerBet: (playerBet) => set({ playerBet }),
  
  setPlayerStats: (playerStats) => set({ playerStats }),
  
  setRaceHistory: (raceHistory) => set({ raceHistory }),
  
  setWinner: (winner) => set({ winner }),
  
  setAnimationWinner: (winner) => {
    // Store animation winner to use when ending race
    set({ animationWinner: winner });
  },
  
  selectDuck: (duckId) => {
    const { ducks } = get();
    const updatedDucks = ducks.map(duck => ({
      ...duck,
      selected: duck.id === duckId
    }));
    set({ ducks: updatedDucks });
  },
  
  clearDuckSelection: () => {
    const { ducks } = get();
    const updatedDucks = ducks.map(duck => ({
      ...duck,
      selected: false
    }));
    set({ ducks: updatedDucks });
  },
  
  resetRace: () => {
    const { ducks } = get();
    const resetDucks = ducks.map(duck => ({
      ...duck,
      position: 0,
      selected: false
    }));
    set({ 
      ducks: resetDucks,
      winner: null,
      animationWinner: null,
      // Don't change race state here as it will be set by the event listener
    });
  },
  
  updateDuckPositions: (positions) => {
    const { ducks } = get();
    const updatedDucks = ducks.map((duck, index) => ({
      ...duck,
      position: positions[index] || 0
    }));
    set({ ducks: updatedDucks });
  },
}));
