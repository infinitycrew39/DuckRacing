const fs = require('fs');
const path = require('path');

// This script sets up the frontend after contract deployment
// Run with: node scripts/setup-frontend.js <contract-address>

const contractAddress = process.argv[2];

if (!contractAddress) {
  console.error('Please provide contract address');
  console.error('Usage: node scripts/setup-frontend.js <contract-address>');
  process.exit(1);
}

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Create .env file from .env.example if it doesn't exist
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('Created .env file from .env.example');
}

// Update contract address in .env
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(
    /REACT_APP_CONTRACT_ADDRESS=.*/,
    `REACT_APP_CONTRACT_ADDRESS=${contractAddress}`
  );
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated contract address in .env: ${contractAddress}`);
}

console.log('Frontend setup complete!');
console.log('Remember to:');
console.log('1. Make sure the contract ABI is updated in src/contracts/DuckRacing.json');
console.log('2. Start the development server with: npm run dev');
