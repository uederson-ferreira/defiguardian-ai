"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
    setupEventListeners();
    return () => {
      removeEventListeners();
    };
  }, []);

  const setupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("disconnect", handleDisconnect);
    }
  };

  const removeEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      window.ethereum.removeListener("disconnect", handleDisconnect);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      logout();
    } else if (user && accounts[0] !== user.address) {
      // Account changed, reconnect
      connectWallet();
    }
  };

  const handleChainChanged = (chainId: string) => {
    // Reload the page when chain changes
    window.location.reload();
  };

  const handleDisconnect = () => {
    logout();
  };

  const checkAuthStatus = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("auth_token");
      const address = localStorage.getItem("wallet_address");

      if (token && address) {
        // Check if wallet is still connected
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({
              method: "eth_accounts",
            });
            if (accounts.includes(address)) {
              const provider = new ethers.BrowserProvider(window.ethereum);
              const network = await provider.getNetwork();
              const balance = await provider.getBalance(address);

              setUser({
                address,
                chainId: Number(network.chainId),
                balance: ethers.formatEther(balance),
              });
            } else {
              // Wallet disconnected, clear auth
              localStorage.removeItem("auth_token");
              localStorage.removeItem("wallet_address");
            }
          } catch (err) {
            console.warn("Failed to check wallet connection:", err);
            setUser({ address });
          }
        } else {
          setUser({ address });
        }
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setError("Failed to check authentication status");
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    if (connecting) return;

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

      // Check if MetaMask is unlocked
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length === 0) {
          // MetaMask is locked, request access
          await window.ethereum.request({ method: "eth_requestAccounts" });
        }
      } catch (err: any) {
        if (err.code === 4001) {
          const error = "Conexão rejeitada pelo usuário";
          setError(error);
          toast.error(error);
          return;
        }
        throw err;
      }

      // Get accounts
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        const error = "Nenhuma conta encontrada";
        setError(error);
        toast.error(error);
        return;
      }

      const address = accounts[0];

      // Get network and balance info
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      // Get nonce from backend with retry logic
      let nonceResponse;
      let retries = 3;

      while (retries > 0) {
        try {
          nonceResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/nonce`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ address }),
            }
          );

          if (nonceResponse.ok) break;

          if (retries === 1) {
            throw new Error(
              `Failed to get nonce: ${nonceResponse.status} ${nonceResponse.statusText}`
            );
          }

          retries--;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (err) {
          if (retries === 1) throw err;
          retries--;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!nonceResponse || !nonceResponse.ok) {
        throw new Error("Failed to get nonce from server");
      }

      const { data } = await nonceResponse.json();
      const { message } = data;

      // Sign message with user-friendly error handling
      let signature;
      try {
        signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, address],
        });
      } catch (err: any) {
        if (err.code === 4001) {
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
        localStorage.setItem("auth_token", loginData.token);
        localStorage.setItem("wallet_address", address);

        setUser({
          address,
          chainId: Number(network.chainId),
          balance: ethers.formatEther(balance),
        });

        toast.success("Carteira conectada com sucesso!");
      } else {
        throw new Error(loginData.error || "Login failed");
      }
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      const errorMessage = error.message || "Falha ao conectar carteira";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setConnecting(false);
    }
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
    } catch (error: any) {
      if (error.code === 4902) {
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

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const logout = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("auth_token");

      if (token) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.warn("Failed to logout from server:", error);
        }
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("wallet_address");
      setUser(null);
      setError(null);
      toast.success("Desconectado com sucesso");
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
