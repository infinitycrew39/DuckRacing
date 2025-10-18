const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DuckRacing", function () {
  let duckRacing;
  let owner;
  let player1;
  let player2;
  let vrfCoordinator;
  let linkToken;
  
  const MOCK_VRF_COORDINATOR = "0x0000000000000000000000000000000000000001";
  const MOCK_LINK_TOKEN = "0x0000000000000000000000000000000000000002";
  const MOCK_KEY_HASH = "0x0000000000000000000000000000000000000000000000000000000000000001";
  const MOCK_FEE = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const DuckRacing = await ethers.getContractFactory("DuckRacing");
    duckRacing = await DuckRacing.deploy(
      MOCK_VRF_COORDINATOR,
      MOCK_LINK_TOKEN,
      MOCK_KEY_HASH,
      MOCK_FEE
    );
    await duckRacing.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await duckRacing.owner()).to.equal(owner.address);
    });

    it("Should initialize with race ID 1", async function () {
      expect(await duckRacing.currentRaceId()).to.equal(1);
    });

    it("Should start with no race in progress", async function () {
      expect(await duckRacing.raceInProgress()).to.equal(false);
    });
  });

  describe("Race Management", function () {
    it("Should allow owner to start a race", async function () {
      await expect(duckRacing.startRace())
        .to.emit(duckRacing, "RaceStarted")
        .withArgs(1, await time.latest());

      expect(await duckRacing.raceInProgress()).to.equal(true);
    });

    it("Should not allow non-owner to start a race", async function () {
      await expect(duckRacing.connect(player1).startRace())
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow starting a race when one is in progress", async function () {
      await duckRacing.startRace();
      await expect(duckRacing.startRace())
        .to.be.revertedWith("Race already in progress");
    });
  });

  describe("Betting", function () {
    beforeEach(async function () {
      await duckRacing.startRace();
    });

    it("Should allow placing a valid bet", async function () {
      const betAmount = ethers.parseEther("0.00001");
      const duckId = 1;

      await expect(duckRacing.connect(player1).placeBet(duckId, { value: betAmount }))
        .to.emit(duckRacing, "BetPlaced")
        .withArgs(player1.address, 1, duckId, betAmount);
    });

    it("Should reject bets below minimum", async function () {
      const betAmount = ethers.parseEther("0.000005"); // Below 0.00001 ETH minimum
      const duckId = 1;

      await expect(duckRacing.connect(player1).placeBet(duckId, { value: betAmount }))
        .to.be.revertedWith("Bet amount too low");
    });

    it("Should reject invalid duck IDs", async function () {
      const betAmount = ethers.parseEther("0.00001");
      const invalidDuckId = 5; // Only 0-3 are valid

      await expect(duckRacing.connect(player1).placeBet(invalidDuckId, { value: betAmount }))
        .to.be.revertedWith("Invalid duck ID");
    });

    it("Should reject multiple bets from same player", async function () {
      const betAmount = ethers.parseEther("0.00001");
      const duckId = 1;

      await duckRacing.connect(player1).placeBet(duckId, { value: betAmount });
      
      await expect(duckRacing.connect(player1).placeBet(duckId, { value: betAmount }))
        .to.be.revertedWith("Already placed bet for this race");
    });

    it("Should reject bets when no race is active", async function () {
      // No race started
      await expect(duckRacing.connect(player1).placeBet(1, { value: ethers.parseEther("0.00001") }))
        .to.be.revertedWith("No active race");
    });
  });

  describe("Game State Queries", function () {
    it("Should return correct current race info", async function () {
      const [id, inProgress, deadline, totalPot, totalBets, duckBets] = 
        await duckRacing.getCurrentRaceInfo();
      
      expect(id).to.equal(1);
      expect(inProgress).to.equal(false);
      expect(totalPot).to.equal(0);
      expect(totalBets).to.equal(0);
      expect(duckBets.length).to.equal(4);
    });

    it("Should return correct player stats", async function () {
      const stats = await duckRacing.getPlayerStats(player1.address);
      
      expect(stats.totalBets).to.equal(0);
      expect(stats.totalWinnings).to.equal(0);
      expect(stats.racesWon).to.equal(0);
      expect(stats.racesPlayed).to.equal(0);
    });

    it("Should return empty race history initially", async function () {
      const history = await duckRacing.getRaceHistory();
      expect(history.length).to.equal(0);
    });
  });

  describe("Integration Test", function () {
    it("Should handle a complete race cycle", async function () {
      // Start race
      await duckRacing.startRace();
      
      // Players place bets
      await duckRacing.connect(player1).placeBet(0, { value: ethers.parseEther("0.0001") });
      await duckRacing.connect(player2).placeBet(1, { value: ethers.parseEther("0.0002") });
      
      // Check race info
      const [, , , totalPot, totalBets] = await duckRacing.getCurrentRaceInfo();
      expect(totalPot).to.equal(ethers.parseEther("0.0003"));
      expect(totalBets).to.equal(2);
      
      // Fast forward past betting deadline
      await network.provider.send("evm_increaseTime", [301]); // 5 minutes + 1 second
      await network.provider.send("evm_mine");
      
      // Emergency end race (since we can't test VRF in local network)
      await duckRacing.emergencyEndRace(0); // Player1's duck wins
      
      // Check that race ended
      expect(await duckRacing.raceInProgress()).to.equal(false);
      expect(await duckRacing.currentRaceId()).to.equal(2);
      
      // Check race history
      const history = await duckRacing.getRaceHistory();
      expect(history.length).to.equal(1);
      expect(history[0].winnerDuck).to.equal(0);
    });
  });
});
