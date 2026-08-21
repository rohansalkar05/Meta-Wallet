import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { getProfileApi } from '../services/api';
import { 
  User, Mail, ShieldCheck, LogOut, Loader2, KeyRound, CheckCircle2, 
  Wallet, Copy, Check, RefreshCw, AlertTriangle, ExternalLink, Network, Coins
} from 'lucide-react';

// BNB Smart Chain Testnet Configuration
const BSC_TESTNET_CONFIG = {
  chainIdHex: '0x61',
  chainIdDecimal: 97,
  chainName: 'BNB Smart Chain Testnet',
  nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
  rpcUrls: ['https://bsc-testnet.publicnode.com'],
  blockExplorerUrls: ['https://testnet.bscscan.com/']
};

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // 1. Authentication User State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // 2. Web3 Wallet State
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0.00 tBNB');
  const [rawBalanceWei, setRawBalanceWei] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [copied, setCopied] = useState(false);

  // -------------------------------------------------------------
  // AUTHENTICATION PROFILE FETCH
  // -------------------------------------------------------------
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const data = await getProfileApi(token);
        setUser(data.user);
      } catch (err) {
        console.error('Profile fetch error:', err.message);
        setAuthError('Session expired or invalid token. Please log in again.');
        localStorage.removeItem('authToken');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } finally {
        setAuthLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Handle Application Logout (Clears JWT, redirects to /login)
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login', { replace: true });
  };

  // -------------------------------------------------------------
  // WEB3 WALLET LOGIC & METAMASK EVENT HANDLERS
  // -------------------------------------------------------------
  
  // Update wallet state (Address, Balance, Network)
  const updateWalletData = useCallback(async (walletAddress) => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      
      setChainId(currentChainId);
      
      const wrongNet = currentChainId !== BSC_TESTNET_CONFIG.chainIdDecimal;
      setIsWrongNetwork(wrongNet);
      setNetworkName(wrongNet ? `Chain ${currentChainId} (Switch Required)` : BSC_TESTNET_CONFIG.chainName);

      if (walletAddress) {
        setAccount(walletAddress);
        setIsConnected(true);

        // Fetch native tBNB balance using ethers.js v6
        const rawBalance = await provider.getBalance(walletAddress);
        setRawBalanceWei(rawBalance.toString());
        
        const formattedEther = ethers.formatEther(rawBalance);
        // Format to 4 decimal places for clean UI
        const formattedDisplay = `${parseFloat(formattedEther).toFixed(4)} tBNB`;
        setBalance(formattedDisplay);
      }
    } catch (err) {
      console.error('Error updating wallet data:', err);
      setWalletError('Failed to fetch wallet information.');
    }
  }, []);

  // Switch network to BNB Smart Chain Testnet
  const switchToBscTestnet = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      setWalletError('');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_TESTNET_CONFIG.chainIdHex }]
      });
    } catch (switchError) {
      // Error code 4902 indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: BSC_TESTNET_CONFIG.chainIdHex,
              chainName: BSC_TESTNET_CONFIG.chainName,
              nativeCurrency: BSC_TESTNET_CONFIG.nativeCurrency,
              rpcUrls: BSC_TESTNET_CONFIG.rpcUrls,
              blockExplorerUrls: BSC_TESTNET_CONFIG.blockExplorerUrls
            }]
          });
        } catch (addError) {
          console.error('Failed to add BNB Testnet network:', addError);
          setWalletError('User rejected adding BNB Smart Chain Testnet.');
        }
      } else if (switchError.code === 4001) {
        setWalletError('User rejected switching network to BNB Smart Chain Testnet.');
      } else {
        console.error('Failed to switch network:', switchError);
        setWalletError('Could not switch to BNB Smart Chain Testnet.');
      }
    }
  };

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setWalletError('MetaMask is not installed. Please install MetaMask to connect your wallet.');
      return;
    }

    setIsConnecting(true);
    setWalletError('');

    try {
      // 1. Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts && accounts.length > 0) {
        const targetAccount = accounts[0];
        
        // 2. Prompt network switch if not on BNB Testnet
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== BSC_TESTNET_CONFIG.chainIdDecimal) {
          await switchToBscTestnet();
        }

        // 3. Update state
        await updateWalletData(targetAccount);
      }
    } catch (err) {
      if (err.code === 4001) {
        setWalletError('Wallet connection rejected by user.');
      } else {
        console.error('MetaMask connection error:', err);
        setWalletError(err.message || 'Failed to connect MetaMask wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Initialize Web3 & Listen for MetaMask Events
  useEffect(() => {
    const isInstalled = typeof window.ethereum !== 'undefined';
    setHasMetaMask(isInstalled);

    if (isInstalled) {
      // Check if accounts are already connected
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
        if (accounts && accounts.length > 0) {
          updateWalletData(accounts[0]);
        }
      }).catch(console.error);

      // Event listener for Account changes
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          setIsConnected(false);
          setAccount('');
          setBalance('0.00 tBNB');
          setRawBalanceWei('0');
        } else {
          updateWalletData(accounts[0]);
        }
      };

      // Event listener for Network / Chain changes
      const handleChainChanged = (_chainId) => {
        // Refresh wallet state on network change
        window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
          if (accounts && accounts.length > 0) {
            updateWalletData(accounts[0]);
          } else {
            updateWalletData(null);
          }
        });
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [updateWalletData]);

  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format short address (e.g. 0x1234...abcd)
  const formatShortAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="spinner" size={42} />
        <p>Loading your profile and wallet dashboard...</p>
      </div>
    );
  }

  // Auth Error Screen
  if (authError) {
    return (
      <div className="auth-container">
        <div className="auth-card glass-card text-center">
          <div className="alert alert-error">
            <span>{authError}</span>
          </div>
          <p className="subtitle">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* ------------------------------------------------------------- */}
      {/* TOP NAVBAR                                                     */}
      {/* ------------------------------------------------------------- */}
      <header className="dashboard-header glass-card">
        <div className="brand-badge">
          <ShieldCheck className="icon-glow" size={26} />
          <span>Web3 Financial Terminal</span>
        </div>

        <div className="nav-actions">
          <div className="status-pill active-pill">
            <CheckCircle2 size={16} />
            <span>Authenticated: {user?.name}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-logout">
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN DASHBOARD CONTENT                                         */}
      {/* ------------------------------------------------------------- */}
      <main className="dashboard-content">
        
        {/* Welcome & Authenticated User Banner */}
        <div className="welcome-banner glass-card">
          <div className="user-avatar-large">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="welcome-text">
            <h1>Welcome back, {user?.name}!</h1>
            <p className="subtitle">
              User ID: <span className="font-mono">#{user?.id}</span> | Email: {user?.email}
            </p>
          </div>
          <div className="session-badge">
            <ShieldCheck size={16} />
            <span>Session JWT Active</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* WEB3 WALLET TERMINAL SECTION                                  */}
        {/* ------------------------------------------------------------- */}
        <div className="web3-terminal-section glass-card">
          <div className="terminal-header">
            <div className="terminal-title">
              <Wallet className="icon-glow" size={24} />
              <h2>MetaMask Web3 Wallet</h2>
            </div>
            
            {/* MetaMask Connection Controls */}
            {!isConnected ? (
              <button 
                onClick={connectWallet} 
                disabled={isConnecting || !hasMetaMask}
                className="btn btn-primary btn-connect-wallet"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="spinner" size={18} />
                    <span>Connecting Wallet...</span>
                  </>
                ) : (
                  <>
                    <Wallet size={18} />
                    <span>Connect MetaMask</span>
                  </>
                )}
              </button>
            ) : (
              <div className="wallet-connected-badge">
                <span className="dot-green"></span>
                <span>Wallet Connected</span>
              </div>
            )}
          </div>

          {/* Wallet Error Alert */}
          {walletError && (
            <div className="alert alert-error">
              <AlertTriangle size={18} />
              <span>{walletError}</span>
            </div>
          )}

          {/* Wrong Network Warning Banner */}
          {isConnected && isWrongNetwork && (
            <div className="alert alert-warning">
              <AlertTriangle size={18} />
              <span>You are connected to an unsupported network (Chain ID: {chainId}). Please switch to BNB Smart Chain Testnet (Chain ID: 97).</span>
              <button onClick={switchToBscTestnet} className="btn btn-warning-action">
                <RefreshCw size={14} />
                <span>Switch to BNB Testnet</span>
              </button>
            </div>
          )}

          {/* Fallback Notice if MetaMask is not installed */}
          {!hasMetaMask && (
            <div className="alert alert-error">
              <AlertTriangle size={18} />
              <span>MetaMask extension is not detected in your browser. Please install MetaMask to access Web3 wallet features.</span>
            </div>
          )}

          {/* Web3 Wallet Grid Cards */}
          <div className="wallet-grid">
            
            {/* Card 1: Wallet Address */}
            <div className="wallet-card">
              <div className="card-header-row">
                <span className="card-label">Connected Wallet Address</span>
                <User size={16} className="text-muted" />
              </div>
              <div className="card-value-box">
                {isConnected ? (
                  <div className="address-display">
                    <span className="address-full font-mono">{account}</span>
                    <button 
                      onClick={copyAddressToClipboard} 
                      className={`btn-copy ${copied ? 'copied' : ''}`}
                      title="Copy Address"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-muted italic">Wallet Not Connected</span>
                )}
              </div>
            </div>

            {/* Card 2: Native Wallet Balance */}
            <div className="wallet-card">
              <div className="card-header-row">
                <span className="card-label">Native Wallet Balance</span>
                <Coins size={16} className="text-muted" />
              </div>
              <div className="card-value-box">
                {isConnected ? (
                  <div>
                    <div className="balance-large font-mono">{balance}</div>
                    <small className="raw-wei-text font-mono">Raw Wei: {rawBalanceWei}</small>
                  </div>
                ) : (
                  <span className="text-muted italic">0.00 tBNB</span>
                )}
              </div>
            </div>

            {/* Card 3: Blockchain Network Info */}
            <div className="wallet-card">
              <div className="card-header-row">
                <span className="card-label">Target Network</span>
                <Network size={16} className="text-muted" />
              </div>
              <div className="card-value-box">
                <div className="network-info-row">
                  <span className="network-name-badge">
                    {BSC_TESTNET_CONFIG.chainName}
                  </span>
                  <span className="chain-id-pill font-mono">
                    Chain ID: {BSC_TESTNET_CONFIG.chainIdDecimal} ({BSC_TESTNET_CONFIG.chainIdHex})
                  </span>
                </div>
                <div className="network-meta font-mono">
                  <span>RPC: bsc-testnet.publicnode.com</span>
                  <span>Currency: tBNB</span>
                </div>
              </div>
            </div>

            {/* Card 4: Explorer Link & Contract Info */}
            <div className="wallet-card">
              <div className="card-header-row">
                <span className="card-label">Block Explorer & Contracts</span>
                <ExternalLink size={16} className="text-muted" />
              </div>
              <div className="card-value-box">
                {isConnected && account ? (
                  <a 
                    href={`${BSC_TESTNET_CONFIG.blockExplorerUrls[0]}address/${account}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="link-explorer"
                  >
                    <span>View Address on BscScan</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span className="text-muted italic">Connect wallet to view explorer records</span>
                )}
                <div className="hardhat-note">
                  <small>Hardhat 3 / Solidity 0.8.28 files preserved in <code>hardhat/</code></small>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
