import { ethers } from 'ethers';
import { Web3Provider } from '../types';

// Contract configuration
export const NETWORKS = {
  riseTestnet: {
    chainId: 11155931,
    name: 'Rise Testnet',
    currency: 'ETH',
    rpcUrl: 'https://rpc.testnet.riselabs.xyz',
    blockExplorer: 'https://testnet.riselabs.xyz',
    faucet: 'https://faucet.testnet.riselabs.xyz', // If available
  },
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  LOCALHOST: {
    chainId: 1337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: ''
  }
};

export const TARGET_NETWORK = NETWORKS.LOCALHOST;

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
};

/**
 * Get the Web3 provider from MetaMask
 */
export const getProvider = (): Web3Provider | null => {
  if (!isMetaMaskInstalled()) {
    return null;
  }
  
  return new ethers.BrowserProvider(window.ethereum);
};

/**
 * Connect to MetaMask wallet
 */
export const connectWallet = async (): Promise<string | null> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask.');
    }

    // Check if we're on the correct network
    await checkNetwork();

    return accounts[0];
  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    throw new Error(error.message || 'Failed to connect wallet');
  }
};

/**
 * Check and switch to the correct network
 */
export const checkNetwork = async (): Promise<void> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainId, 16);

    if (currentChainId !== TARGET_NETWORK.chainId) {
      await switchNetwork();
    }
  } catch (error: any) {
    console.error('Error checking network:', error);
    throw new Error('Failed to check network');
  }
};

/**
 * Switch to the target network
 */
export const switchNetwork = async (): Promise<void> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${TARGET_NETWORK.chainId.toString(16)}` }],
    });
  } catch (error: any) {
    // If the network doesn't exist, add it
    if (error.code === 4902) {
      await addNetwork();
    } else {
      throw new Error('Failed to switch network');
    }
  }
};

/**
 * Add the target network to MetaMask
 */
export const addNetwork = async (): Promise<void> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${TARGET_NETWORK.chainId.toString(16)}`,
          chainName: TARGET_NETWORK.name,
          rpcUrls: [TARGET_NETWORK.rpcUrl],
          blockExplorerUrls: TARGET_NETWORK.blockExplorer ? [TARGET_NETWORK.blockExplorer] : null,
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18,
          },
        },
      ],
    });
  } catch (error: any) {
    console.error('Error adding network:', error);
    throw new Error('Failed to add network');
  }
};

/**
 * Get the current account from MetaMask
 */
export const getCurrentAccount = async (): Promise<string | null> => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

/**
 * Get the balance of an account
 */
export const getBalance = async (address: string): Promise<string> => {
  const provider = getProvider();
  if (!provider) {
    throw new Error('Provider not available');
  }

  try {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    throw new Error('Failed to get balance');
  }
};

/**
 * Format Wei to Ether with specified decimal places (default 5 for ETH display)
 */
export const formatEther = (wei: string | number, decimals: number = 5): string => {
  try {
    // Handle null, undefined, or invalid inputs
    if (wei === null || wei === undefined || wei === '' || wei === 'NaN') {
      return '0.00000';
    }
    
    // Convert to string and handle BigNumber objects
    const weiStr = wei.toString();
    
    // Check if the string is a valid number
    if (!/^\d+$/.test(weiStr) && !/^\d*\.?\d*$/.test(weiStr)) {
      console.warn('Invalid wei value:', wei);
      return '0.00000';
    }
    
    const etherValue = ethers.formatEther(weiStr);
    const parsed = parseFloat(etherValue);
    
    // Check for NaN or Infinity
    if (isNaN(parsed) || !isFinite(parsed)) {
      console.warn('Invalid ether conversion:', wei, '->', etherValue);
      return '0.00000';
    }
    
    return parsed.toFixed(decimals);
  } catch (error) {
    console.error('Error formatting ether:', error, 'Wei:', wei);
    return '0.00000';
  }
};

/**
 * Parse Ether to Wei
 */
export const parseEther = (ether: string): string => {
  return ethers.parseEther(ether).toString();
};

/**
 * Format address to display format (0x1234...5678)
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Handle contract errors and return user-friendly messages
 */
export const handleContractError = (error: any): string => {
  console.error('Contract error:', error);

  if (error.code === 4001) {
    return 'Transaction was rejected by user';
  }

  if (error.code === -32603 && error.data?.message) {
    const message = error.data.message;
    
    if (message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    
    if (message.includes('execution reverted')) {
      const reason = message.split('execution reverted: ')[1];
      return reason || 'Transaction failed';
    }
  }

  if (error.reason) {
    return error.reason;
  }

  if (error.message) {
    if (error.message.includes('user rejected')) {
      return 'Transaction was rejected by user';
    }
    
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }
    
    return error.message;
  }

  return 'An unexpected error occurred';
};

/**
 * Wait for transaction confirmation
 */
export const waitForTransaction = async (txHash: string): Promise<any> => {
  const provider = getProvider();
  if (!provider) {
    throw new Error('Provider not available');
  }

  try {
    const receipt = await provider.waitForTransaction(txHash);
    return receipt;
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    throw new Error('Transaction failed');
  }
};

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default {
  isMetaMaskInstalled,
  getProvider,
  connectWallet,
  checkNetwork,
  switchNetwork,
  addNetwork,
  getCurrentAccount,
  getBalance,
  formatEther,
  parseEther,
  formatAddress,
  handleContractError,
  waitForTransaction,
};
