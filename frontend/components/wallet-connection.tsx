// frontend/src/components/wallet-connection.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Copy,
  LogOut,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Provider";
import { CHAIN_CONFIG } from "@/lib/web3-config";
import { toast } from "sonner";

interface WalletConnectionProps {
  onSuccess?: () => void;
  showBalance?: boolean;
  compact?: boolean;
}

export function WalletConnection({
  onSuccess,
  showBalance = true,
  compact = false,
}: WalletConnectionProps) {
  const {
    user,
    isAuthenticated,
    loading: authLoading,
    connecting,
    error: authError,
    connectWallet,
    logout,
    getBalance,
  } = useAuth();

  const {
    provider,
    signer,
    chainId,
    isCorrectNetwork,
    isConnected: web3Connected,
    loading: web3Loading,
    error: web3Error,
    initializeProvider,
    switchToCorrectNetwork,
  } = useWeb3();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStep, setConnectionStep] = useState<
    "wallet" | "network" | "complete"
  >("wallet");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (web3Connected && isCorrectNetwork) {
      setConnectionStep("complete");
      onSuccess?.();
    } else if (web3Connected && !isCorrectNetwork) {
      setConnectionStep("network");
    } else {
      setConnectionStep("wallet");
    }
  }, [web3Connected, isCorrectNetwork, onSuccess]);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      await initializeProvider();
      toast.success("Carteira conectada com sucesso!");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Falha ao conectar carteira");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToCorrectNetwork();
      toast.success("Rede alterada com sucesso!");
    } catch (error) {
      console.error("Failed to switch network:", error);
      toast.error("Falha ao trocar de rede");
    }
  };

  const handleRefreshBalance = async () => {
    if (!user?.address) return;
    
    setIsRefreshing(true);
    try {
      await getBalance();
      toast.success("Saldo atualizado!");
    } catch (error) {
      console.error("Failed to refresh balance:", error);
      toast.error("Falha ao atualizar saldo");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyAddress = () => {
    const address = user?.address;
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Endereço copiado!");
    }
  };

  const handleViewOnExplorer = () => {
    if (user?.address) {
      window.open(
        `${CHAIN_CONFIG.blockExplorer}/address/${user.address}`,
        "_blank"
      );
    }
  };

  const isLoading = authLoading || web3Loading || connecting || isConnecting;
  const hasError = authError || web3Error;
  const shortAddress = user?.address
    ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}`
    : "";

  // Compact version for header
  if (compact && web3Connected && isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          {shortAddress}
        </Badge>
        {showBalance && user?.balance && (
          <Badge variant="secondary">
            {parseFloat(user.balance).toFixed(4)} AVAX
          </Badge>
        )}
      </div>
    );
  }

  // Show error state
  if (hasError && !isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Erro de Conexão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {authError || web3Error || "Erro desconhecido"}
            </AlertDescription>
          </Alert>
          <Button
            onClick={handleConnectWallet}
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Main wallet connection interface
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-purple-400" />
          Conectar Carteira
        </CardTitle>
        <CardDescription>
          Conecte sua carteira para acessar recursos completos do DefiGuardian
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Wallet Connection */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              connectionStep === "wallet" && isLoading
                ? "bg-blue-100 text-blue-600"
                : web3Connected
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {connectionStep === "wallet" && isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : web3Connected ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <span className="text-sm font-medium">1</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Conectar Carteira</p>
            <p className="text-xs text-muted-foreground">
              {web3Connected
                ? "Carteira conectada"
                : "Conecte sua carteira MetaMask ou similar"}
            </p>
          </div>
          {!web3Connected && (
            <Button
              onClick={handleConnectWallet}
              disabled={isLoading}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Conectar"
              )}
            </Button>
          )}
        </div>

        {/* Step 2: Network Check */}
        {web3Connected && (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                connectionStep === "network" && web3Loading
                  ? "bg-blue-100 text-blue-600"
                  : isCorrectNetwork
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {connectionStep === "network" && web3Loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isCorrectNetwork ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Verificar Rede</p>
              <p className="text-xs text-muted-foreground">
                {isCorrectNetwork
                  ? `Conectado à ${CHAIN_CONFIG.chainName}`
                  : "Rede incorreta detectada"}
              </p>
            </div>
            {!isCorrectNetwork && (
              <Button
                onClick={handleSwitchNetwork}
                disabled={web3Loading}
                size="sm"
                variant="outline"
              >
                {web3Loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Trocar"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Connected State */}
        {web3Connected && isCorrectNetwork && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Carteira Conectada
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Endereço:</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {shortAddress}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyAddress}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {showBalance && user?.balance && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Saldo:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {parseFloat(user.balance).toFixed(4)} AVAX
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefreshBalance}
                      disabled={isRefreshing}
                      className="h-6 w-6 p-0"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Rede:</span>
                <Badge variant="secondary" className="text-xs">
                  {CHAIN_CONFIG.chainName}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewOnExplorer}
                className="flex-1"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Explorer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={logout}
                className="flex-1"
              >
                <LogOut className="mr-1 h-3 w-3" />
                Desconectar
              </Button>
            </div>
          </div>
        )}

        {/* Supported Wallets Info */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            Carteiras suportadas:
          </p>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div>• MetaMask, Coinbase, WalletConnect</div>
            <div>• Rainbow, Trust Wallet, Phantom</div>
            <div>• Injected wallets e extensões</div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            Powered by Wagmi - Conexão segura com carteiras Web3
          </p>
        </div>
      </CardContent>
    </Card>
  );
}