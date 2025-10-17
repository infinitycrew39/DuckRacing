const { ethers } = require("hardhat");

async function main() {
  console.log("🦆 Deploying DuckRacing to Rise Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Mock VRF parameters for Rise Testnet (không có Chainlink VRF)
  const VRF_COORDINATOR = "0x0000000000000000000000000000000000000000";
  const LINK_TOKEN = "0x0000000000000000000000000000000000000000";
  const KEY_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const VRF_FEE = "0";
  
  console.log("⚠️ Using mock VRF parameters for Rise Testnet");
  
  // Deploy DuckRacing contract với đúng constructor
  const DuckRacing = await ethers.getContractFactory("DuckRacing");
  const duckRacing = await DuckRacing.deploy(
    VRF_COORDINATOR,
    LINK_TOKEN,
    KEY_HASH,
    VRF_FEE
  ); // Không cần { value: ... } vì constructor không payable
  
  await duckRacing.waitForDeployment();
  
  const contractAddress = await duckRacing.getAddress();
  console.log("✅ DuckRacing deployed to:", contractAddress);
  
  // Save contract info
  const fs = require("fs");
  const contractInfo = {
    address: contractAddress,
    network: "riseTestnet",
    chainId: 11155931,
    deployedAt: new Date().toISOString()
  };
  
  try {
    fs.writeFileSync(
      "../frontend/src/contracts/contract-address.json",
      JSON.stringify(contractInfo, null, 2)
    );
    console.log("📝 Contract address saved to frontend");
  } catch (error) {
    console.log("⚠️ Could not save to frontend, but deployment successful");
  }
  
  console.log("🎉 Deployment completed!");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});