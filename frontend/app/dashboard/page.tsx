/**
 * MODULE: Complete Dashboard with Contracts
 * LOCATION: app/dashboard/page.tsx
 * DESCRIPTION: Dashboard with real DeFi functionalities using contracts
 */

"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useContracts } from "@/hooks/useContracts";
import { AddPositionModal } from "@/components/AddPositionModal";
import { CreateInsuranceModal } from "@/components/CreateInsuranceModal";
import { CreateAlertModal } from "@/components/CreateAlertModal";
import { AIChat } from "@/components/ai-chat";
import { PortfolioAnalysis } from "@/components/portfolio-analysis";
import { IndividualRisksInsurance } from "@/components/individual-risks-insurance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LogOut,
  Shield,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Loader2,
  Plus,
  CheckCircle,
  Bell,
  Settings,
  RefreshCw,
  BarChart3,
  Activity,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { address, isConnected } = useAccount(); // RainbowKit hook
  const [mounted, setMounted] = useState(false);
  const [alertsConfigured, setAlertsConfigured] = useState(false);

  // 🔥 Hook dos contratos inteligentes
  const {
    portfolioData,
    isLoading: isLoadingContracts,
    analyzePortfolio,
  } = useContracts();

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect se não autenticado
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.push("/login");
    }
  }, [mounted, status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Loading states
  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-400" />
          <p>Initializing system...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Vai redirecionar
  }

  // Função para obter cor do risk score
  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-green-400";
    if (score <= 60) return "text-yellow-400";
    if (score <= 80) return "text-orange-400";
    return "text-red-400";
  };

  const getRiskLevel = (score: number) => {
    if (score <= 30) return "Low Risk";
    if (score <= 60) return "Moderate Risk";
    if (score <= 80) return "High Risk";
    return "Critical Risk";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/30">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">DefiGuardian</span>
              <span className="text-purple-400 ml-1">AI</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <Bell className="h-4 w-4" />
              {portfolioData.alertsCount > 0 && (
                <Badge className="ml-1 bg-red-500 text-white text-xs px-1 py-0">
                  {portfolioData.alertsCount}
                </Badge>
              )}
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="bg-purple-600 text-white">
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-slate-400">{session?.user?.email}</p>
              </div>
            </div>

            {/* Logout */}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Welcome, {session?.user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-400 text-lg">
            Manage your DeFi investments safely with artificial intelligence
          </p>
        </div>

        {/* Status Alerts */}
        <div className="space-y-4">
          {/* Login Success Alert */}
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              ✅ System operational. Connect your wallet to start risk
              analysis.
            </AlertDescription>
          </Alert>

          {/* Risk Alert */}
          {isConnected && portfolioData.riskScore > 70 && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                ⚠️ Warning! Your portfolio shows high risk level (
                {portfolioData.riskScore}/100). Consider rebalancing your
                positions.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Wallet Connection */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected ? (
              <div className="text-center space-y-4 py-8">
                <Wallet className="h-16 w-16 mx-auto text-slate-500" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Wallet not connected
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Connect your wallet to access risk analysis and DeFi
                    functionalities
                  </p>

                  {/* RainbowKit Connect Button */}
                  <ConnectButton />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-400">
                    ✅ Wallet connected successfully! Analyzing data...
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-400">
                      Connected address:
                    </p>
                    <p className="text-white font-mono">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Avalanche Fuji Testnet
                    </p>
                  </div>

                  {/* RainbowKit Button (mostra saldo, rede, etc) */}
                  <ConnectButton />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats - REAL DATA FROM CONTRACTS */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Portfolio Value</p>
                  <p className="text-2xl font-bold text-white">
                    {isLoadingContracts ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `$${portfolioData.totalValue.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    )}
                  </p>
                  {isConnected && portfolioData.totalValue > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      +2.5% last 24h
                    </p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Risk Score</p>
                  <p
                    className={`text-2xl font-bold ${getRiskColor(
                      portfolioData.riskScore
                    )}`}
                  >
                    {isLoadingContracts ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `${Math.round(portfolioData.riskScore * 100) / 100}/100`
                    )}
                  </p>
                  <p
                    className={`text-xs mt-1 ${getRiskColor(
                      portfolioData.riskScore
                    )}`}
                  >
                    {getRiskLevel(portfolioData.riskScore)}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Alerts</p>
                  <p className="text-2xl font-bold text-white">
                    {isLoadingContracts ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      portfolioData.alertsCount
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    24/7 Monitoring
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Insights - Se conectado */}
        {isConnected && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                  Portfolio Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Active protocols:</span>
                  <span className="text-white font-medium">
                    {Math.round(portfolioData.protocolCount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    Diversification score:
                  </span>
                  <span className="text-white font-medium">
                    {Math.round(portfolioData.diversificationScore * 100) / 100}
                    /100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last analysis:</span>
                  <span className="text-white font-medium">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>

                <Button
                  onClick={analyzePortfolio}
                  disabled={isLoadingContracts}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoadingContracts ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Update Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {portfolioData.totalValue > 0 ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          Portfolio analyzed
                        </p>
                        <p className="text-xs text-slate-400">
                          A few minutes ago
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">Wallet connected</p>
                        <p className="text-xs text-slate-400">Today</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-sm">
                      No activity yet.
                      <br />
                      Add positions to get started.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Next Steps - COM FUNCIONALIDADES REAIS */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div
                className={`p-4 rounded-lg border-2 ${
                  isConnected
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-slate-700/30 border-slate-600/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-500" />
                  )}
                  <div>
                    <h3 className="font-medium text-white">
                      1. Connect Wallet
                    </h3>
                    <p className="text-sm text-slate-400">
                      {isConnected
                        ? "✅ Wallet connected successfully!"
                        : "Connect your MetaMask or other wallets"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${
                  isConnected && (portfolioData.protocolCount ?? 0) > 0
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-slate-700/30 border-slate-600/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isConnected && (portfolioData.protocolCount ?? 0) > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-500" />
                    )}
                    <div>
                      <h3 className="font-medium text-white">
                        2. Analyze Portfolio
                      </h3>
                      <p className="text-sm text-slate-400">
                        {isConnected && (portfolioData.protocolCount ?? 0) > 0
                          ? `✅ ${portfolioData.protocolCount} protocol(s) found`
                          : "Configure analysis of your DeFi investments"}
                      </p>
                    </div>
                  </div>
                  {isConnected && (
                    <Button
                      onClick={analyzePortfolio}
                      disabled={isLoadingContracts}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoadingContracts ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Analyze"
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${
                  isConnected &&
                  (portfolioData.alertsCount > 0 || alertsConfigured)
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-slate-700/30 border-slate-600/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isConnected &&
                    (portfolioData.alertsCount > 0 || alertsConfigured) ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-500" />
                    )}
                    <div>
                      <h3 className="font-medium text-white">
                        3. Configure Alerts
                      </h3>
                      <p className="text-sm text-slate-400">
                        {isConnected &&
                        (portfolioData.alertsCount > 0 || alertsConfigured)
                          ? `✅ ${portfolioData.alertsCount || 0} active alert(s)`
                          : "Create intelligent risk alerts"}
                      </p>
                    </div>
                  </div>
                  {isConnected && (
                    <CreateAlertModal>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        onClick={() => setAlertsConfigured(true)}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </CreateAlertModal>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons - MODAIS FUNCIONAIS */}
        {isConnected && (
          <div className="space-y-6">
            {/* Botões de Ação Principais */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AddPositionModal>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Register Risks
                </Button>
              </AddPositionModal>

              <CreateInsuranceModal>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Create Insurance
                </Button>
              </CreateInsuranceModal>
            </div>

            {/* Ações Secundárias */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <CreateAlertModal>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Configurar Alertas
                </Button>
              </CreateAlertModal>

              <Button
                variant="ghost"
                size="sm"
                onClick={analyzePortfolio}
                disabled={isLoadingContracts}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                {isLoadingContracts ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="mr-2 h-4 w-4" />
                )}
                Update Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Portfolio Analysis Component */}
        {isConnected && <PortfolioAnalysis />}

        {/* Individual Risks and Insurance */}
        {isConnected && <IndividualRisksInsurance />}

        {/* Footer Info */}
        <div className="text-center pt-8 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm">
            DefiGuardian AI v1.0 - Hackathon Chromion 2025
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Connected to Avalanche Fuji Testnet
          </p>
        </div>
      </main>

      {/* AI Chat Component */}
      <AIChat />
    </div>
  );
}
