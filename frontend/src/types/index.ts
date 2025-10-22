export interface Race {
  id: number;
  winnerDuck: number;
  totalPot: string;
  timestamp: number;
  totalBets: number;
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

export interface RaceInfo {
  id: number;
  inProgress: boolean;
  deadline: number;
  totalPot: string;
  totalBets: number;
  duckBets: string[];
}

export interface Duck {
  id: number;
  name: string;
  emoji: string;
  color: string;
  position: number;
  selected: boolean;
}

export enum RaceState {
  WAITING = 'waiting',
  BETTING = 'betting',
  RACING = 'racing',
  FINISHED = 'finished'
}

export interface GameState {
  raceState: RaceState;
  currentRace: RaceInfo | null;
  playerBet: PlayerBet | null;
  playerStats: PlayerStats | null;
  raceHistory: Race[];
  ducks: Duck[];
  winner: number | null;
  animationWinner: number | null;
  isConnected: boolean;
  account: string | null;
  balance: string;
  loading: boolean;
  error: string | null;
}

export interface ContractError extends Error {
  code?: string;
  data?: any;
  reason?: string;
}

export interface TransactionResponse {
  hash: string;
  wait: () => Promise<any>;
}

export interface Web3Provider {
  getSigner: () => any;
  getNetwork: () => Promise<{ chainId: number }>;
}
