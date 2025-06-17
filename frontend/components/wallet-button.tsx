// frontend/src/components/wallet-button.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Wallet, 
  LogOut, 
  Loader2, 
  Copy, 
  ExternalLink,
  ChevronDown 
} from 'lucide-react';

export function WalletButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Check connection status on mount and storage changes
  useEffect(() => {
    const checkConnection = () => {
      const token = localStorage.getItem('auth_token');
      const address = localStorage.getItem('wallet_address');
      
      console.log('🔍 Checking wallet connection:', { token: !!token, address });
      
      if (token && address) {
        setIsConnected(true);
        setWalletAddress(address);
        console.log('✅ Wallet is connected:', address);
      } else {
        setIsConnected(false);
        setWalletAddress('');
        console.log('❌ Wallet not connected');
      }
    };

    // Initial check
    checkConnection();

    // Listen for storage changes (when other tabs login/logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'wallet_address') {
        checkConnection();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const connectWallet = async (): Promise<string | null> => {
    try {
      if (!window.ethereum) {
        alert('MetaMask not found! Please install MetaMask.');
        return null;
      }

      console.log('🦊 Requesting MetaMask connection...');
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      console.log('✅ MetaMask connected:', address);
      return address;
    } catch (error) {
      console.error('❌ MetaMask connection failed:', error);
      throw error;
    }
  };

  const login = async (address: string): Promise<void> => {
    try {
      console.log('🔐 Starting login process for:', address);

      // 1. Request nonce
      const nonceResponse = await fetch('http://localhost:8002/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }

      const nonceData = await nonceResponse.json();
      const { message } = nonceData.data;

      console.log('📝 Message to sign:', message);

      // 2. Sign message
      const signature = await window.ethereum?.request({
        method: 'personal_sign',
        params: [message, address],
      });

      console.log('✍️ Message signed');

      // 3. Login with signature
      const loginResponse = await fetch('http://localhost:8002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, message }),
      });

      if (!loginResponse.ok) {
        throw new Error('Login failed');
      }

      const loginData = await loginResponse.json();

      if (loginData.success) {
        // Store credentials
        localStorage.setItem('auth_token', loginData.token);
        localStorage.setItem('wallet_address', address);
        
        // Update state
        setIsConnected(true);
        setWalletAddress(address);
        
        console.log('🎉 Login successful!');
      } else {
        throw new Error(loginData.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      
      // 1. Connect wallet
      const address = await connectWallet();
      if (!address) return;

      // 2. Login with signature
      await login(address);
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      alert('Connection failed. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Try to call backend logout
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          await fetch('http://localhost:8002/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (err) {
          console.log('Backend logout failed, proceeding with local cleanup');
        }
      }
      
      // Clear storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('wallet_address');
      
      // Update state
      setIsConnected(false);
      setWalletAddress('');
      setShowDropdown(false);
      
      console.log('👋 Logged out successfully');
      
      // Redirect to home
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Loading state
  if (loading) {
    return (
      <Button disabled className="opacity-50">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Connected state
  if (isConnected && walletAddress) {
    return (
      <div className="flex items-center gap-3">
        {/* Connected Badge */}
        <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          Connected
        </Badge>

        {/* Wallet Dropdown */}
        <div className="relative">
          <Button 
            variant="outline" 
            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {shortenAddress(walletAddress)}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-700 rounded-md shadow-lg backdrop-blur-md z-50">
              {/* Address Info */}
              <div className="px-3 py-2 border-b border-slate-700">
                <p className="text-sm text-slate-400">Wallet Address</p>
                <p className="text-sm font-mono text-white">{walletAddress}</p>
              </div>
              
              {/* Actions */}
              <div className="py-1">
                <button 
                  onClick={copyAddress}
                  className="w-full px-3 py-2 text-left text-white hover:bg-slate-800 flex items-center text-sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                
                <button 
                  onClick={() => window.open(`https://etherscan.io/address/${walletAddress}`, '_blank')}
                  className="w-full px-3 py-2 text-left text-white hover:bg-slate-800 flex items-center text-sm"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Etherscan
                </button>
                
                <div className="border-t border-slate-700 my-1"></div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center text-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect Wallet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Disconnected state
  return (
    <Button 
      onClick={handleConnect} 
      disabled={connecting}
      className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
    >
      {connecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </>
      )}
    </Button>
  );
}