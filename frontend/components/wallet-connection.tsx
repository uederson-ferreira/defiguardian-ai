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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Copy,
  LogOut,
  Github,
  Chrome,
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
    "auth" | "wallet" | "network" | "complete"
  >("auth");
  const [showLogin, setShowLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated && web3Connected && isCorrectNetwork) {
      setConnectionStep("complete");
      onSuccess?.();
    } else if (isAuthenticated && web3Connected && !isCorrectNetwork) {
      setConnectionStep("network");
    } else if (isAuthenticated) {
      setConnectionStep("wallet");
    } else {
      setConnectionStep("auth");
    }
  }, [isAuthenticated, web3Connected, isCorrectNetwork, onSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simular login bem-sucedido
    toast.success("Login realizado com sucesso!");
    setConnectionStep("wallet");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simular cadastro bem-sucedido
    toast.success("Cadastro realizado com sucesso!");
    setConnectionStep("wallet");
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      if (isAuthenticated) {
        await initializeProvider();
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToCorrectNetwork();
      toast.success("Rede alterada com sucesso!");
    } catch (error: any) {
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
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
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

  const isLoading = authLoading || web3Loading || connecting;
  const hasError = authError || web3Error;
  const shortAddress = user?.address
    ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}`
    : "";

  if (compact && isAuthenticated && web3Connected && isCorrectNetwork) {
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

  // Tela de Autenticação
  if (connectionStep === "auth") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <CardTitle>Bem-vindo ao ChainPlayWeb3</CardTitle>
          <CardDescription>
            Entre ou crie sua conta para jogar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Supabase Conectado</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Autenticação completa disponível com login social
            </p>
          </div>

          <Tabs value={showLogin ? "login" : "register"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="login" 
                onClick={() => setShowLogin(true)}
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                onClick={() => setShowLogin(false)}
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Entrar
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  OU CONTINUE COM
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="outline" onClick={handleLogin}>
                <Chrome className="h-4 w-4 mr-2" />
                Google
              </Button>
              <Button variant="outline" onClick={handleLogin}>
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            </div>
            
            <Button 
              variant="link" 
              className="w-full mt-4 text-sm"
              onClick={handleLogin}
            >
              Continuar sem login (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Conexão da Carteira
        </CardTitle>
        <CardDescription>
          Conecte sua carteira para acessar o RiskGuardian
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Wallet Connection */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              connectionStep === "wallet" && isLoading
                ? "bg-blue-100 text-blue-600"
                : isAuthenticated
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {connectionStep === "wallet" && isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isAuthenticated ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <span className="text-sm font-medium">1</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Conectar Carteira</p>
            <p className="text-xs text-muted-foreground">
              {isAuthenticated
                ? "Carteira conectada"
                : "Conecte sua carteira MetaMask"}
            </p>
          </div>
          {!isAuthenticated && (
            <Button
              onClick={handleConnectWallet}
              disabled={isLoading}
              size="sm"
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Conectar"
              )}
            </Button>
          )}
        </div>

        {/* Step 2: Network Check */}
        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                connectionStep === "network" && web3Loading
                  ? "bg-blue-100 text-blue-600"
                  : isCorrectNetwork
                  ? "bg-green-100 text-green-600"
                  : "bg-yellow-100 text-yellow-600"
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
              <p className="text-sm font-medium">Rede Correta</p>
              <p className="text-xs text-muted-foreground">
                {isCorrectNetwork
                  ? "Conectado à Avalanche Fuji"
                  : "Altere para Avalanche Fuji"}
              </p>
            </div>
            {!isCorrectNetwork && (
              <Button
                onClick={handleSwitchNetwork}
                disabled={web3Loading}
                size="sm"
                variant="outline"
              >
                Alterar Rede
              </Button>
            )}
          </div>
        )}

        {/* Connected State */}
        {isAuthenticated && isCorrectNetwork && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Endereço:</span>
              <div className="flex items-center gap-1">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {shortAddress}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewOnExplorer}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {showBalance && user?.balance && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Saldo:</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm">
                    {parseFloat(user.balance).toFixed(4)} AVAX
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
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

            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Desconectar
            </Button>
          </div>
        )}

        {/* Error Display */}
        {hasError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{authError || web3Error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
