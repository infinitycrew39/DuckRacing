import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useGameStore } from './store/gameStore';
import { connectWallet, getCurrentAccount, getBalance, isMetaMaskInstalled } from './utils/web3';
import Header from './components/Header';
import RaceTrack from './components/RaceTrack';
import BettingPanel from './components/BettingPanel';
import Leaderboard from './components/Leaderboard';
import PlayerStats from './components/PlayerStats';
import WalletInfo from './components/WalletInfo';
import toast from 'react-hot-toast';

function App() {
  const {
    isConnected,
    setConnected,
    setAccount,
    setBalance,
    setError,
    error
  } = useGameStore();

  // Check for existing connection on app load
  useEffect(() => {
    const checkConnection = async () => {
      if (isMetaMaskInstalled()) {
        const currentAccount = await getCurrentAccount();
        if (currentAccount) {
          setAccount(currentAccount);
          setConnected(true);
          
          try {
            const balance = await getBalance(currentAccount);
            setBalance(balance);
          } catch (error) {
            console.error('Error getting balance:', error);
          }
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setConnected(false);
          setAccount(null);
          setBalance('0');
        } else {
          setAccount(accounts[0]);
          getBalance(accounts[0]).then(setBalance).catch(console.error);
        }
      });

      window.ethereum.on('chainChanged', () => {
        // Reload the page when chain changes
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [setConnected, setAccount, setBalance]);

  const handleConnectWallet = async () => {
    try {
      const account = await connectWallet();
      if (account) {
        setAccount(account);
        setConnected(true);
        setError(null);
        
        const balance = await getBalance(account);
        setBalance(balance);
        
        toast.success('Wallet connected successfully!');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setError(error.message);
      toast.error(error.message);
    }
  };

  if (!isMetaMaskInstalled()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-6">🦆</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Duck Racing</h1>
          <p className="text-gray-600 mb-6">
            You need MetaMask to play this game. Please install MetaMask browser extension to continue.
          </p>
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            Install MetaMask
          </a>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-6">🦆</div>
          <h1 className="text-3xl font-bold text-gradient mb-4">Duck Racing</h1>
          <p className="text-gray-600 mb-6">
            Connect your MetaMask wallet to start betting on duck races!
          </p>
          <button
            onClick={handleConnectWallet}
            className="btn-primary w-full"
          >
            Connect Wallet
          </button>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Top Row - Wallet Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WalletInfo />
          </div>
          <div className="lg:col-span-1">
            <PlayerStats />
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Betting Panel */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <BettingPanel />
          </div>

          {/* Center - Race Track */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <RaceTrack />
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-1 order-3 lg:order-3">
            <Leaderboard />
          </div>
        </div>
      </main>

      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity,
          },
        }}
      />
    </div>
  );
}

export default App;
