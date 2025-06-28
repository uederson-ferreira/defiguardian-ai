/**
 * MÓDULO: AuthContext Corrigido
 * LOCALIZAÇÃO: contexts/AuthContext.tsx
 * DESCRIÇÃO: Remove auto-conexão automática, apenas conexão manual
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { ethers } from "ethers";

interface User {
  address: string;
  nonce?: string;
  chainId?: number;
  balance?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  connecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  switchNetwork: (chainId: number) => Promise<void>;
  getBalance: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading] = useState(false); // 🔧 FIX: Não loading inicial
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("wallet_address");
    }
    setUser(null);
    setError(null);
    toast.success("Desconectado com sucesso!");
  }, []);

  const handleAccountsChanged = useCallback((data: unknown) => {
    const accounts = data as string[];
    if (accounts.length === 0) {
      logout();
    } else if (user && accounts[0] !== user.address) {
      // 🔧 FIX: NÃO reconectar automaticamente, apenas deslogar
      console.log("🔄 Conta alterada, fazendo logout...");
      logout();
    }
  }, [user, logout]);

  const handleChainChanged = useCallback((data: unknown) => {
    const chainId = data as string;
    // 🔧 FIX: Não recarregar página, apenas atualizar chainId
    if (user) {
      setUser((prev) =>
        prev ? { ...prev, chainId: parseInt(chainId, 16) } : null
      );
    }
  }, [user]);

  const handleDisconnect = useCallback(() => {
    logout();
  }, [logout]);

  const setupEventListeners = useCallback(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("disconnect", handleDisconnect);
    }
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

  const removeEventListeners = useCallback(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("disconnect", handleDisconnect);
    }
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

  // 🔧 FIX: Apenas setup de listeners, SEM auto-conexão
  useEffect(() => {
    setupEventListeners();
    return () => {
      removeEventListeners();
    };
  }, [setupEventListeners, removeEventListeners]);

  // 🔧 FIX: Função MANUAL para conectar wallet (não automática)
  const connectWallet = async () => {
    if (connecting) return;
    
    // Prevent SSR issues
    if (typeof window === "undefined") {
      setError("Wallet connection not available on server");
      return;
    }

    try {
      setConnecting(true);
      setError(null);

      // Check if MetaMask is installed
      if (!window.ethereum) {
        const error = "MetaMask não encontrado. Por favor, instale o MetaMask.";
        setError(error);
        toast.error(error);
        return;
      }

      // Request wallet connection
      const accountsResponse = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const accounts = accountsResponse as string[];

      if (!accounts.length) {
        throw new Error("Nenhuma conta encontrada");
      }

      const address = accounts[0];
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      // Generate login message
      const nonce = Math.floor(Math.random() * 1000000).toString();
      const message = `Sign this message to authenticate with DefiGuardian.\n\nNonce: ${nonce}`;

      let signature;
      try {
        const signer = await provider.getSigner();
        signature = await signer.signMessage(message);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          err.code === 4001
        ) {
          const error = "Assinatura rejeitada pelo usuário";
          setError(error);
          toast.error(error);
          return;
        }
        throw err;
      }

      // Login with signature
      const loginResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address,
            signature,
            message,
          }),
        }
      );

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        throw new Error(`Login failed: ${loginResponse.status} ${errorText}`);
      }

      const loginData = await loginResponse.json();

      if (loginData.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", loginData.token);
          localStorage.setItem("wallet_address", address);
        }

        setUser({
          address,
          chainId: Number(network.chainId),
          balance: ethers.formatEther(balance),
        });

        toast.success("Carteira conectada com sucesso!");
      } else {
        throw new Error(loginData.error || "Login failed");
      }
    } catch (error: unknown) {
      console.error("Wallet connection failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Falha ao conectar carteira";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setConnecting(false);
    }
  };



  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const switchNetwork = async (chainId: number) => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 4902
      ) {
        throw new Error("Network not added to MetaMask");
      }
      throw error;
    }
  };

  const getBalance = async (): Promise<string | null> => {
    try {
      if (!window.ethereum || !user?.address) {
        return null;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(user.address);
      const formattedBalance = ethers.formatEther(balance);

      updateUser({ balance: formattedBalance });
      return formattedBalance;
    } catch (error) {
      console.error("Failed to get balance:", error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    connecting,
    error,
    connectWallet,
    logout,
    updateUser,
    switchNetwork,
    getBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
