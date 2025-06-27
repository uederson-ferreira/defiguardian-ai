/**
 * MÓDULO: Web3Provider Corrigido
 * LOCALIZAÇÃO: contexts/Web3Provider.tsx
 * DESCRIÇÃO: Provider Web3 SEM auto-conexão, apenas conexão manual
 */

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
  disconnect: () => void;
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

  // 🔧 FIX: Apenas listeners, SEM auto-inicialização
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleChainChanged = (newChainId: string) => {
        const parsedChainId = parseInt(newChainId, 16);
        setChainId(parsedChainId);
        console.log('🔄 Chain changed to:', parsedChainId);
        
        // 🔧 FIX: NÃO reinicializar automaticamente
        // Apenas atualizar o chainId
      };

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // Disconnected
          console.log('🔌 Wallet disconnected');
          disconnect();
        } else {
          // Account changed
          console.log('👤 Account changed to:', accounts[0]);
          // 🔧 FIX: NÃO reinicializar automaticamente
          // Usuário deve conectar manualmente
        }
      };

      const handleDisconnect = () => {
        console.log('🔌 Wallet disconnect event');
        disconnect();
      };

      // Setup listeners
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("disconnect", handleDisconnect);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener("chainChanged", handleChainChanged);
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, []);

  // 🔧 FIX: Função MANUAL para inicializar provider
  const initializeProvider = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("MetaMask não está instalado");
      }

      console.log('🔗 Inicializando Web3 provider...');

      // Verificar se já há contas conectadas
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });

      if (accounts.length === 0) {
        // Solicitar conexão
        const newAccounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (newAccounts.length === 0) {
          throw new Error("Nenhuma conta selecionada");
        }
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      const providerSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(providerSigner);
      setChainId(Number(network.chainId));

      console.log('✅ Web3 provider inicializado:', {
        chainId: Number(network.chainId),
        account: await providerSigner.getAddress()
      });

      toast.success("Web3 conectado com sucesso!");

    } catch (error: any) {
      console.error("❌ Falha ao inicializar Web3 provider:", error);
      setError(error.message || "Falha ao inicializar Web3");
      setProvider(null);
      setSigner(null);
      setChainId(null);
      toast.error(error.message || "Falha ao conectar Web3");
    } finally {
      setLoading(false);
    }
  };

  const switchToCorrectNetwork = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask não encontrado");
      }

      console.log('🔄 Mudando para rede correta...');

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CHAIN_CONFIG.chainId.toString(16)}` }],
      });

      toast.success("Rede alterada com sucesso!");

    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, try to add it
        await addNetwork();
      } else {
        console.error("❌ Erro ao mudar rede:", error);
        toast.error("Falha ao mudar rede");
        throw error;
      }
    }
  };

  const addNetwork = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask não encontrado");
      }

      console.log('➕ Adicionando rede...');

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

      toast.success("Rede adicionada com sucesso!");

    } catch (error: any) {
      console.error("❌ Falha ao adicionar rede:", error);
      toast.error("Falha ao adicionar rede");
      throw error;
    }
  };

  const disconnect = () => {
    console.log('🔌 Desconectando Web3...');
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
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
    disconnect,
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