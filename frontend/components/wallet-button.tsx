"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  LogOut,
  Copy,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import useWeb3Contracts from "@/hooks/useWeb3Contracts";
import { CHAIN_CONFIG } from "@/lib/web3-config";
import { toast } from "sonner";

export function WalletButton() {
  const {
    user,
    isAuthenticated,
    loading,
    connecting,
    error: authError,
    connectWallet,
    logout,
    switchNetwork,
    getBalance,
  } = useAuth();
  const {
    isConnected,
    account,
    chainId,
    loading: web3Loading,
    error: web3Error,
    initializeWeb3,
    switchToFujiNetwork,
  } = useWeb3Contracts();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnect = async () => {
    try {
      if (!isAuthenticated) {
        await connectWallet();
      } else {
        await initializeWeb3();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      if (CHAIN_CONFIG.chainId) {
        await switchNetwork(CHAIN_CONFIG.chainId);
        toast.success("Rede alterada com sucesso!");
      } else {
        await switchToFujiNetwork();
        toast.success("Rede alterada com sucesso!");
      }
    } catch (error) {
      console.error("Failed to switch network:", error);
      toast.error("Falha ao alterar rede");
    }
  };

  const handleRefreshBalance = async () => {
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
    const address = account || user?.address;
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Endereço copiado!");
    }
  };

  const handleViewOnExplorer = () => {
    const address = account || user?.address;
    if (address) {
      window.open(`${CHAIN_CONFIG.blockExplorer}/address/${address}`, "_blank");
    }
  };

  const isWrongNetwork = chainId && chainId !== CHAIN_CONFIG.chainId;
  const displayAddress = account || user?.address;
  const isLoading = loading || web3Loading || connecting;
  const hasError = authError || web3Error;

  // Show error state
  if (hasError && !isAuthenticated) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          variant="destructive"
          className="flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Tentar Novamente
        </Button>
        {authError && (
          <Alert variant="destructive" className="text-xs">
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {connecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {connecting ? "Conectando..." : "Conectar Carteira"}
      </Button>
    );
  }

  if (!isConnected || !displayAddress) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isLoading}
        variant="outline"
        className="flex items-center gap-2"
      >
        {web3Loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {web3Loading ? "Conectando Web3..." : "Conectar Web3"}
      </Button>
    );
  }

  const shortAddress = `${displayAddress.slice(0, 6)}...${displayAddress.slice(
    -4
  )}`;

  return (
    <div className="flex items-center gap-2">
      {isWrongNetwork && (
        <Button
          onClick={handleSwitchNetwork}
          variant="destructive"
          size="sm"
          className="flex items-center gap-1"
        >
          <AlertTriangle className="h-3 w-3" />
          Rede Incorreta
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span>{shortAddress}</span>
            {chainId === CHAIN_CONFIG.chainId && (
              <Badge variant="secondary" className="text-xs">
                Fuji
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">Carteira Conectada</p>
            <p className="text-xs text-muted-foreground font-mono">
              {displayAddress}
            </p>

            {user?.balance && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">Saldo:</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">
                    {parseFloat(user.balance).toFixed(4)} AVAX
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshBalance}
                    disabled={isRefreshing}
                    className="h-4 w-4 p-0"
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

            {chainId && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">Rede:</span>
                <Badge
                  variant={
                    chainId === CHAIN_CONFIG.chainId ? "default" : "destructive"
                  }
                  className="text-xs"
                >
                  {chainId === CHAIN_CONFIG.chainId
                    ? "Avalanche Fuji"
                    : `Chain ID: ${chainId}`}
                </Badge>
              </div>
            )}

            {hasError && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {authError || web3Error}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyAddress}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar Endereço
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewOnExplorer}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver no Explorer
          </DropdownMenuItem>
          {isWrongNetwork && (
            <DropdownMenuItem onClick={handleSwitchNetwork}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Alterar para Fuji
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Desconectar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
