// frontend/components/wallet-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import Image from 'next/image';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  detected?: boolean;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletType: string) => Promise<void>;
}

export function WalletModal({ isOpen, onClose, onSelectWallet }: WalletModalProps) {
  const [wallets, setWallets] = useState<WalletOption[]>([
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '/walletconnect-logo.svg',
    },
    {
      id: 'brave',
      name: 'Brave Wallet',
      icon: '/brave-logo.svg',
      detected: false,
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '/metamask-logo.svg',
      detected: false,
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '/coinbase-logo.svg',
      detected: false,
    },
    {
      id: 'rabby',
      name: 'Rabby Wallet',
      icon: '/rabby-logo.svg',
      detected: false,
    },
  ]);

  const [termsAccepted, setTermsAccepted] = useState(false);

  // Detect installed wallets
  useEffect(() => {
    const detectWallets = () => {
      const updatedWallets = [...wallets];
      
      // Detect MetaMask
      if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
        const metamaskIndex = updatedWallets.findIndex(w => w.id === 'metamask');
        if (metamaskIndex !== -1) {
          updatedWallets[metamaskIndex].detected = true;
        }
      }

      // Detect Brave Wallet
      if (typeof window !== 'undefined' && (navigator as any).brave && window.ethereum) {
        const braveIndex = updatedWallets.findIndex(w => w.id === 'brave');
        if (braveIndex !== -1) {
          updatedWallets[braveIndex].detected = true;
        }
      }

      // Detect Coinbase Wallet
      if (typeof window !== 'undefined' && (window.ethereum as any)?.isCoinbaseWallet) {
        const coinbaseIndex = updatedWallets.findIndex(w => w.id === 'coinbase');
        if (coinbaseIndex !== -1) {
          updatedWallets[coinbaseIndex].detected = true;
        }
      }

      setWallets(updatedWallets);
    };

    if (isOpen) {
      detectWallets();
    }
  }, [isOpen]);

  const handleWalletSelect = async (walletId: string) => {
    await onSelectWallet(walletId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white mb-4">Connect your wallet</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col space-y-2 mt-2">
          {/* Terms checkbox */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="terms" className="text-sm text-gray-300">
              I accept the Chainlink Foundation <span className="text-blue-500">Terms of Service</span>
            </label>
          </div>

          {/* Wallet options */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletSelect(wallet.id)}
                disabled={!termsAccepted}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 mb-2 relative">
                  <img 
                    src={wallet.icon} 
                    alt={`${wallet.name} logo`} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-sm font-medium">{wallet.name}</span>
                {wallet.detected && (
                  <span className="mt-1 px-2 py-0.5 text-xs bg-gray-700 rounded-full">Detected</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 mt-6">
          By connecting a wallet, you agree to Ronin's <span className="text-blue-500">Terms of Service</span> and
          consent to its <span className="text-blue-500">Privacy Policy</span>.
          <div className="mt-2">
            <a href="https://github.com/uederson-ferreira/riskguardian-ai" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-gray-400 hover:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-1" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub
            </a>
          </div>
          
          {/* GitHub Link */}
          <div className="flex justify-center mt-6">
            <a 
              href="https://github.com/uederson-ferreira/riskguardian-ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}