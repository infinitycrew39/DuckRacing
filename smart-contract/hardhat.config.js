require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

// Fix SSL issues for Rise Testnet
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const { vars } = require("hardhat/config");
const path = require("path");
// Get variables from Hardhat vars with error handling
let PRIVATE_KEY;
let RPC_URL;

try {
  PRIVATE_KEY = vars.get("PRIVATE_KEY");
} catch (error) {
  console.warn("⚠️ PRIVATE_KEY not set in Hardhat vars");
  PRIVATE_KEY = process.env.PRIVATE_KEY;
}

try {
  RPC_URL = vars.get("RPC_URL");
} catch (error) {
  RPC_URL = "https://testnet.riselabs.xyz";
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20", // Thay đổi từ 0.8.24 thành 0.8.20
    settings: {
      // compilerPath: path.resolve(__dirname, "node_modules", "solc", "soljson.js"),
      // viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
        
      },
      
    },
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    riseTestnet: {
      url: RPC_URL || "https://testnet.riselabs.xyz",
      // url: "https://rpc.testnet.riselabs.xyz",
      chainId: 11155931,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 6000000,
      gasPrice: 200000000,
      timeout: 300000
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};