import React from 'react';
import { useGameStore } from '../store/gameStore';
import { formatAddress } from '../utils/web3';

const WalletInfo: React.FC = () => {
  const { account, balance } = useGameStore();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Wallet Info</h2>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-600 font-medium">Connected</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-600">Address:</span>
          <span className="font-mono text-sm">{account ? formatAddress(account) : '---'}</span>
        </div>
        
        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <span className="text-gray-600">Balance:</span>
          <span className="font-bold text-lg text-blue-600">{(() => {
            const balanceNum = parseFloat(balance);
            return isNaN(balanceNum) ? '0.00000' : balanceNum.toFixed(5);
          })()} ETH</span>
        </div>
      </div>
    </div>
  );
};

export default WalletInfo;
