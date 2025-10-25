# 🐹 Hamster Racing - Frontend

A decentralized hamster racing game built on blockchain with betting and reward functionality.

## 📋 Description

Hamster Racing is an exciting blockchain game where players can:
- Bet on their favorite hamsters
- Watch live races
- Receive rewards for correct predictions
- Track personal statistics and leaderboards

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Framer Motion
- **Blockchain**: Ethereum + Ethers.js v6
- **State Management**: Zustand
- **Notifications**: React Hot Toast
- **Smart Contract**: Solidity with Chainlink VRF

## 📦 System Requirements

- Node.js >= 16.0.0
- npm or yarn
- MetaMask browser extension
- Ethereum network connection (testnet or mainnet)

## 🚀 Installation Guide

### 1. Clone repository

```bash
git clone <repository-url>
cd HamsterRacing/frontend
```

### 2. Install dependencies

```bash
npm install
```

or

```bash
yarn install
```

### 3. Environment configuration

Create `.env.local` file in the frontend folder:

```env
VITE_CONTRACT_ADDRESS=<smart_contract_address>
VITE_NETWORK_ID=<network_id>
```

### 4. Run the application

```bash
npm run dev
```

or

```bash
yarn dev
```

The application will run at `http://localhost:5173`

## 🎮 How to Play

### Step 1: Preparation
1. **Install MetaMask**: Download and install MetaMask extension from [metamask.io](https://metamask.io/)
2. **Connect Wallet**: Click "Connect Wallet" to connect your MetaMask wallet
3. **Ensure ETH Balance**: You need ETH in your wallet to place bets (minimum 0.00001 ETH)

### Step 2: Join the Race
1. **Wait for Race Start**: Admin will start a new race
2. **Select Hamster**: Choose one of 4 hamsters (Hamster 1-4) to bet on
3. **Enter Bet Amount**: Enter the amount of ETH you want to bet (minimum 0.00001 ETH)
4. **Confirm Transaction**: Click "Place Bet" and confirm in MetaMask

### Step 3: View Results
1. **Wait for Betting Period End**: You have 5 minutes to place bets
2. **Watch the Race**: Follow the live race on the interface
3. **Receive Rewards**: If you predict correctly, rewards will be automatically transferred to your wallet

### Step 4: Track Statistics
- **Player Stats**: View races participated, win rate, total bets
- **Leaderboard**: View top player rankings
- **Race History**: View history of past races

## 💰 Reward Mechanism

- **House Edge**: 5% of total pot will be deducted as operating fee
- **Reward Distribution**: Remaining 95% is distributed to correct bettors
- **Reward Ratio**: Depends on total betting amount on the winning hamster

### Reward Calculation Formula:
```
Reward = (Your Bet Amount / Total Bets on Winning Hamster) × (95% of Total Pot)
```

## 🎯 Key Features

### 🎲 Betting System
- Minimum bet of 0.00001 ETH
- Betting time: 5 minutes per race
- Support for 4 hamsters to choose from

### 🏁 Fair Racing
- Uses Chainlink VRF for random number generation
- Results cannot be predicted in advance
- Completely transparent on blockchain

### 📊 Statistics & Leaderboard
- Track personal statistics
- Leaderboard by total winnings
- Race history

### 💱 Wallet Management
- Display ETH balance
- Track current wallet address
- Automatic updates when account changes

## 🔧 Available Scripts

### `npm run dev`
Runs the app in development mode at `http://localhost:5173`

### `npm run build`
Builds the app for production

### `npm run preview`
Preview the production build

### `npm run lint`
Check and fix code style errors

### `npm test`
Run the test suite

## 🐛 Troubleshooting

### MetaMask won't connect
- Ensure MetaMask extension is installed
- Refresh the page and try again
- Check that the blockchain network is configured correctly

### Transaction failed
- Check that you have enough ETH to pay gas fees
- Ensure you're on the correct network
- Try increasing gas price in MetaMask

### Not receiving rewards
- Check if you bet on the correct winning hamster
- Wait for transaction confirmation on blockchain
- Contact support if the issue persists

## 🔐 Security

- **Audited Smart Contract**: Code has been thoroughly reviewed
- **No Private Key Storage**: Uses MetaMask to sign transactions
- **Transparency**: All transactions are public on blockchain
- **ReentrancyGuard**: Protection against reentrancy attacks

## 📱 Responsive Design

The application is designed to be responsive, supporting all devices:
- 📱 Mobile phones
- 📱 Tablets  
- 💻 Desktop computers

## 🤝 Contributing

All contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

## 📞 Support

If you encounter issues or have questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Have fun playing and good luck! 🍀**
