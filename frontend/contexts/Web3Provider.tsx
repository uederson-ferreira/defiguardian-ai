"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import { CHAIN_CONFIG } from "@/lib/web3-config";

interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  initializeProvider: () => Promise<void>;
  switchToCorrectNetwork: () => Promise<void>;
  addNetwork: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCorrectNetwork = chainId === CHAIN_CONFIG.chainId;
  const isConnected = !!provider && !!signer;

  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = (newChainId: string) => {
        setChainId(parseInt(newChainId, 16));
        // Reinitialize provider when chain changes
        initializeProvider();
      };

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // Disconnected
          setProvider(null);
          setSigner(null);
          setChainId(null);
        } else {
          // Account changed, reinitialize
          initializeProvider();
        }
      };

      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
        window.ethereum?.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, []);

  const initializeProvider = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      const providerSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(providerSigner);
      setChainId(Number(network.chainId));
    } catch (error: any) {
      console.error("Failed to initialize Web3 provider:", error);
      setError(error.message || "Failed to initialize Web3");
      setProvider(null);
      setSigner(null);
      setChainId(null);
    } finally {
      setLoading(false);
    }
  };

  const switchToCorrectNetwork = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CHAIN_CONFIG.chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, try to add it
        await addNetwork();
      } else {
        throw error;
      }
    }
  };

  const addNetwork = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${CHAIN_CONFIG.chainId.toString(16)}`,
            chainName: CHAIN_CONFIG.chainName,
            nativeCurrency: CHAIN_CONFIG.nativeCurrency,
            rpcUrls: [CHAIN_CONFIG.rpcUrl],
            blockExplorerUrls: [CHAIN_CONFIG.blockExplorer],
          },
        ],
      });
    } catch (error: any) {
      console.error("Failed to add network:", error);
      throw error;
    }
  };

  const value: Web3ContextType = {
    provider,
    signer,
    chainId,
    isCorrectNetwork,
    isConnected,
    loading,
    error,
    initializeProvider,
    switchToCorrectNetwork,
    addNetwork,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
