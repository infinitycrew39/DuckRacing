const { ethers } = require("hardhat");

async function testContract() {
  console.log('🔍 Testing contract connection...');
  
  // Connect to localhost
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  
  try {
    // Check if there's code at the address
    const code = await provider.getCode(contractAddress);
    console.log('Contract code length:', code.length);
    
    if (code === '0x') {
      console.log('❌ No contract deployed at this address');
      return false;
    } else {
      console.log('✅ Contract found at address');
      
      // Try to call a simple view function
      const abi = [
        "function owner() view returns (address)",
        "function getCurrentRaceInfo() view returns (uint256, bool, uint256, uint256, uint256, uint256[4])"
      ];
      
      const contract = new ethers.Contract(contractAddress, abi, provider);
      
      try {
        const owner = await contract.owner();
        console.log('Contract owner:', owner);
        
        const raceInfo = await contract.getCurrentRaceInfo();
        console.log('Race info:', {
          id: Number(raceInfo[0]),
          inProgress: raceInfo[1],
          deadline: Number(raceInfo[2]),
          totalPot: ethers.formatEther(raceInfo[3]),
          totalBets: Number(raceInfo[4]),
          duckBets: raceInfo[5].map(bet => ethers.formatEther(bet))
        });
        
        return true;
      } catch (error) {
        console.log('❌ Error calling contract functions:', error.message);
        return false;
      }
    }
  } catch (error) {
    console.log('❌ Error connecting to contract:', error.message);
    return false;
  }
}

testContract();
