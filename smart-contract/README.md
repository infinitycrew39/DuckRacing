# 🦆 Duck Racing - Smart Contract

A decentralized duck racing game smart contract built with Solidity, featuring betting mechanics and automated reward distribution.

## 📋 Contract Overview

The DuckRacing smart contract enables:
- **Decentralized Betting**: Players can bet ETH on any of 4 ducks
- **Automated Rewards**: Winners receive proportional payouts automatically
- **Transparent Statistics**: All game data is stored on-chain
- **Security**: Built with OpenZeppelin contracts and ReentrancyGuard

## 🛠️ Tech Stack

- **Solidity**: ^0.8.20
- **Hardhat**: Development framework
- **OpenZeppelin**: Security and access control contracts
- **Ethers.js**: JavaScript library for contract interaction

## 🚀 Installation and Deployment

### Step 1: Install Dependencies

```bash
cd smart-contract
npm install
```

### Step 2: Environment Configuration

Create `.env` file in smart-contract directory:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key
REPORT_GAS=true
```

Or use Hardhat configuration variables (recommended):

```bash
npx hardhat vars set PRIVATE_KEY
npx hardhat vars set RPC_URL
```

### Step 3: Compile Contract

```bash
npx hardhat compile
```

### Step 4: Run Tests

```bash
npx hardhat test
```

## 🏠 Local Development

### 1. Run Local Hardhat Network

Terminal 1 - Start local blockchain:
```bash
npx hardhat node
```

Terminal 2 - Deploy contract:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Interact with Local Contract

```bash
# Run console for interaction
npx hardhat console --network localhost

# In console:
const contract = await ethers.getContractAt("DuckRacing", "CONTRACT_ADDRESS");
await contract.startRace();
```

### 3. Connect Frontend to Local

Update file `frontend/src/contracts/contract-address.json`:
```json
{
  "address": "0x0...",
  "network": "localhost",
  "chainId": 1337
}
```

In MetaMask:
- Add network: `http://localhost:8545`
- Chain ID: `1337`
- Import account with private key from Hardhat

## 🌐 Deploy to Testnet

### Rise Testnet (Recommended)

```bash
# Deploy
npx hardhat run scripts/deploy.js --network riseTestnet

# Verify contract (if block explorer available)
npx hardhat verify --network riseTestnet DEPLOYED_CONTRACT_ADDRESS
```

**Rise Testnet Configuration:**
- Network Name: Rise Testnet
- RPC URL: `https://testnet.riselabs.xyz`
- Chain ID: `11155931`
- Currency: ETH

### Sepolia Testnet

```bash
# Deploy
npx hardhat run scripts/deploy.js --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

**Sepolia Configuration:**
- Network Name: Sepolia
- RPC URL: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`
- Chain ID: `11155111`
- Currency: ETH
- Block Explorer: `https://sepolia.etherscan.io`

### Get Test ETH

**Rise Testnet:**
- Access Rise Testnet faucet (if available)
- Or contact team to receive test ETH

**Sepolia:**
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)

## 🔧 Network Configuration

File `hardhat.config.js` is already configured:

```javascript
module.exports = {
  networks: {
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    
    // Rise Testnet
    riseTestnet: {
      url: "https://testnet.riselabs.xyz",
      chainId: 11155931,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 6000000,
      gasPrice: 200000000
    },
    
    // Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
```

## 🔍 Verify Deployment

### 1. Verify Contract is Deployed

```bash
# Check contract address
npx hardhat run scripts/checkDeployment.js --network <network_name>
```

### 2. Basic Interaction

```bash
# Start race
npx hardhat run scripts/startRace.js --network <network_name>

# Check status
npx hardhat run scripts/checkStatus.js --network <network_name>
```

### 3. Update Frontend

After successful deployment, contract address will be automatically saved to:
```
frontend/src/contracts/contract-address.json
```

## 🐛 Troubleshooting

### Common Errors:

**1. "insufficient funds for intrinsic transaction cost"**
```bash
# Solution: Check ETH balance
npx hardhat run scripts/checkBalance.js --network <network_name>
```

**2. "nonce too high"**
```bash
# Solution: Reset MetaMask account
# Settings > Advanced > Reset Account
```

**3. "contract not deployed"**
```bash
# Solution: Check deployment again
npx hardhat run scripts/deploy.js --network <network_name>
```

**4. "network not configured"**
```bash
# Solution: Check hardhat.config.js and .env
```

### Debug Commands:

```bash
# Check account balance
npx hardhat run scripts/checkBalance.js --network <network_name>

# Check network connection
npx hardhat run scripts/testNetwork.js --network <network_name>

# Recompile if errors
npx hardhat clean
npx hardhat compile
```

## 📝 Available Scripts

- `deploy.js` - Deploy contract
- `checkBalance.js` - Check balance
- `testNetwork.js` - Test network connection
- `startRace.js` - Start new race
- `checkStatus.js` - Check game status

---

**Happy deploying! 🚀**