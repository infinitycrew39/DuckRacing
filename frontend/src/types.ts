// Game Types
export enum RaceState {
  WAITING = 'waiting',
  BETTING = 'betting',
  RACING = 'racing',
  FINISHED = 'finished'
}

export interface Duck {
  id: number;
  name: string;
  emoji: string;
  color: string;
  position: number;
  selected: boolean;
}

export interface Race {
  id: number;
  winnerDuck: number;
  totalPot: string;
  timestamp: number;
  totalBets: number;
}

export interface RaceInfo {
  id: number;
  inProgress: boolean;
  deadline: number;
  totalPot: string;
  totalBets: number;
  hamsterBets: string[];
}

export interface PlayerBet {
  duckId: number;
  amount: string;
  hasBet: boolean;
}

export interface PlayerStats {
  totalBets: string;
  totalWinnings: string;
  racesWon: number;
  racesPlayed: number;
}

// Game State
export interface GameState {
  raceState: RaceState;
  currentRace: RaceInfo | null;
  playerBet: PlayerBet | null;
  playerStats: PlayerStats | null;
  raceHistory: Race[];
  ducks: Duck[];
  winner: number | null;
  isConnected: boolean;
  account: string | null;
  balance: string;
  loading: boolean;
  error: string | null;
}

// Web3 Types
export interface Web3Provider {
  getSigner(): Promise<any>;
  getBalance(address: string): Promise<any>;
  waitForTransaction(txHash: string): Promise<any>;
  getBlockNumber(): Promise<number>;
}

export interface ContractError {
  code: number;
  message: string;
  data?: any;
  reason?: string;
}

// Contract Event Types
export interface RaceStartedEvent {
  raceId: number;
  timestamp: number;
}

export interface BetPlacedEvent {
  player: string;
  raceId: number;
  duckId: number;
  amount: string;
}

export interface RaceEndedEvent {
  raceId: number;
  winnerDuck: number;
  timestamp: number;
}

export interface RewardDistributedEvent {
  player: string;
  amount: string;
}
