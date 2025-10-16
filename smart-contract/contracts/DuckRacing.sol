// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBase.sol";

/**
 * @title DuckRacing
 * @dev A decentralized duck racing game with betting functionality
 * Players can bet on ducks and receive rewards for correct predictions
 */
contract DuckRacing is Ownable, ReentrancyGuard, VRFConsumerBase {
    // Chainlink VRF variables
    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomResult;
    
    // Game constants
    uint8 public constant TOTAL_DUCKS = 4;
    uint256 public constant MIN_BET = 0.00001 ether;
    uint256 public constant HOUSE_EDGE = 5; // 5% house edge
    
    // Game state
    uint256 public currentRaceId;
    bool public raceInProgress;
    uint256 public bettingDeadline;
    uint256 public constant BETTING_DURATION = 5 minutes;
    
    // Race data structures
    struct Race {
        uint256 id;
        uint8 winnerDuck;
        uint256 totalPot;
        uint256 timestamp;
        uint256 totalBets;
        mapping(uint8 => uint256) duckBets; // duckId => total bet amount
        mapping(address => Bet) playerBets;
        address[] players;
    }
    
    struct Bet {
        uint8 duckId;
        uint256 amount;
        bool claimed;
    }
    
    struct RaceResult {
        uint256 id;
        uint8 winnerDuck;
        uint256 totalPot;
        uint256 timestamp;
        uint256 totalBets;
    }
    
    struct PlayerStats {
        uint256 totalBets;
        uint256 totalWinnings;
        uint256 racesWon;
        uint256 racesPlayed;
    }
    
    // Storage
    mapping(uint256 => Race) public races;
    mapping(address => PlayerStats) public playerStats;
    mapping(bytes32 => uint256) public requestToRace;
    
    uint256[] public raceHistory;
    
    // Events
    event RaceStarted(uint256 indexed raceId, uint256 timestamp);
    event BetPlaced(address indexed player, uint256 indexed raceId, uint8 duckId, uint256 amount);
    event RaceEnded(uint256 indexed raceId, uint8 winnerDuck, uint256 timestamp);
    event RewardDistributed(address indexed player, uint256 amount);
    event RandomnessRequested(bytes32 requestId, uint256 raceId);
    
    /**
     * @dev Constructor
     * @param _vrfCoordinator VRF Coordinator address
     * @param _link LINK token address
     * @param _keyHash Key hash for VRF
     * @param _fee Fee for VRF request
     */
    constructor(
        address _vrfCoordinator,
        address _link,
        bytes32 _keyHash,
        uint256 _fee
    ) VRFConsumerBase(_vrfCoordinator, _link) Ownable() {
        keyHash = _keyHash;
        fee = _fee;
        currentRaceId = 1;
    }
    
    /**
     * @dev Place a bet on a specific duck
     * @param _duckId Duck ID to bet on (0-3)
     */
    function placeBet(uint8 _duckId) external payable nonReentrant {
        require(_duckId < TOTAL_DUCKS, "Invalid duck ID");
        require(msg.value >= MIN_BET, "Bet amount too low");
        require(raceInProgress, "No active race");
        require(block.timestamp < bettingDeadline, "Betting period ended");
        
        Race storage race = races[currentRaceId];
        require(race.playerBets[msg.sender].amount == 0, "Already placed bet for this race");
        
        // Record the bet
        race.playerBets[msg.sender] = Bet({
            duckId: _duckId,
            amount: msg.value,
            claimed: false
        });
        
        race.players.push(msg.sender);
        race.duckBets[_duckId] += msg.value;
        race.totalPot += msg.value;
        race.totalBets++;
        
        // Update player stats
        playerStats[msg.sender].totalBets += msg.value;
        playerStats[msg.sender].racesPlayed++;
        
        emit BetPlaced(msg.sender, currentRaceId, _duckId, msg.value);
    }
    
    /**
     * @dev Start a new race (only owner)
     */
    function startRace() external onlyOwner {
        require(!raceInProgress, "Race already in progress");
        
        // Initialize new race
        Race storage newRace = races[currentRaceId];
        newRace.id = currentRaceId;
        newRace.timestamp = block.timestamp;
        
        raceInProgress = true;
        bettingDeadline = block.timestamp + BETTING_DURATION;
        
        emit RaceStarted(currentRaceId, block.timestamp);
    }
    
    /**
     * @dev End the race and request randomness for winner selection
     */
    function endRace() external onlyOwner {
        require(raceInProgress, "No active race");
        require(block.timestamp >= bettingDeadline, "Betting period not ended");
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK tokens");
        
        bytes32 requestId = requestRandomness(keyHash, fee);
        requestToRace[requestId] = currentRaceId;
        
        emit RandomnessRequested(requestId, currentRaceId);
    }
    
    /**
     * @dev Fulfill randomness callback from Chainlink VRF
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        uint256 raceId = requestToRace[requestId];
        require(raceId != 0, "Invalid request");
        
        Race storage race = races[raceId];
        
        // Determine winner (0-3)
        uint8 winnerDuck = uint8(randomness % TOTAL_DUCKS);
        race.winnerDuck = winnerDuck;
        
        // Distribute rewards
        _distributeRewards(raceId, winnerDuck);
        
        // Finalize race
        raceInProgress = false;
        raceHistory.push(raceId);
        currentRaceId++;
        
        emit RaceEnded(raceId, winnerDuck, block.timestamp);
    }
    
    /**
     * @dev Distribute rewards to winners
     */
    function _distributeRewards(uint256 _raceId, uint8 _winnerDuck) internal {
        Race storage race = races[_raceId];
        
        if (race.totalPot == 0 || race.duckBets[_winnerDuck] == 0) {
            return; // No bets or no winners
        }
        
        uint256 houseAmount = (race.totalPot * HOUSE_EDGE) / 100;
        uint256 rewardPool = race.totalPot - houseAmount;
        
        // Send house edge to owner
        if (houseAmount > 0) {
            payable(owner()).transfer(houseAmount);
        }
        
        // Distribute rewards proportionally to winners
        for (uint256 i = 0; i < race.players.length; i++) {
            address player = race.players[i];
            Bet storage bet = race.playerBets[player];
            
            if (bet.duckId == _winnerDuck && !bet.claimed) {
                uint256 playerReward = (bet.amount * rewardPool) / race.duckBets[_winnerDuck];
                
                bet.claimed = true;
                playerStats[player].totalWinnings += playerReward;
                playerStats[player].racesWon++;
                
                payable(player).transfer(playerReward);
                emit RewardDistributed(player, playerReward);
            }
        }
    }
    
    /**
     * @dev Get race history
     */
    function getRaceHistory() external view returns (RaceResult[] memory) {
        RaceResult[] memory history = new RaceResult[](raceHistory.length);
        
        for (uint256 i = 0; i < raceHistory.length; i++) {
            uint256 raceId = raceHistory[i];
            Race storage race = races[raceId];
            
            history[i] = RaceResult({
                id: race.id,
                winnerDuck: race.winnerDuck,
                totalPot: race.totalPot,
                timestamp: race.timestamp,
                totalBets: race.totalBets
            });
        }
        
        return history;
    }
    
    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address _player) external view returns (PlayerStats memory) {
        return playerStats[_player];
    }
    
    /**
     * @dev Get current race info
     */
    function getCurrentRaceInfo() external view returns (
        uint256 id,
        bool inProgress,
        uint256 deadline,
        uint256 totalPot,
        uint256 totalBets,
        uint256[TOTAL_DUCKS] memory duckBets
    ) {
        Race storage race = races[currentRaceId];
        uint256[TOTAL_DUCKS] memory bets;
        
        for (uint8 i = 0; i < TOTAL_DUCKS; i++) {
            bets[i] = race.duckBets[i];
        }
        
        return (
            currentRaceId,
            raceInProgress,
            bettingDeadline,
            race.totalPot,
            race.totalBets,
            bets
        );
    }
    
    /**
     * @dev Get player's bet for current race
     */
    function getPlayerBet(address _player) external view returns (uint8 duckId, uint256 amount, bool hasBet) {
        if (raceInProgress) {
            Bet storage bet = races[currentRaceId].playerBets[_player];
            return (bet.duckId, bet.amount, bet.amount > 0);
        }
        return (0, 0, false);
    }
    
    /**
     * @dev Emergency function to end race without randomness (owner only)
     * Should only be used in case of VRF failure
     */
    function emergencyEndRace(uint8 _winnerDuck) external onlyOwner {
        require(raceInProgress, "No active race");
        require(_winnerDuck < TOTAL_DUCKS, "Invalid duck ID");
        
        Race storage race = races[currentRaceId];
        race.winnerDuck = _winnerDuck;
        
        _distributeRewards(currentRaceId, _winnerDuck);
        
        raceInProgress = false;
        raceHistory.push(currentRaceId);
        currentRaceId++;
        
        emit RaceEnded(currentRaceId - 1, _winnerDuck, block.timestamp);
    }
    
    /**
     * @dev Withdraw LINK tokens (owner only)
     */
    function withdrawLink() external onlyOwner {
        require(LINK.transfer(owner(), LINK.balanceOf(address(this))), "Unable to transfer");
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {}
}
