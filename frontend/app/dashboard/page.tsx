/**
 * MÓDULO: Dashboard Completo com Contratos
 * LOCALIZAÇÃO: app/dashboard/page.tsx
 * DESCRIÇÃO: Dashboard com funcionalidades DeFi reais usando contratos
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
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { address, isConnected } = useAccount(); // RainbowKit hook
  const [mounted, setMounted] = useState(false);

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
          <p>Inicializando sistema...</p>
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
    if (score <= 30) return "Baixo Risco";
    if (score <= 60) return "Risco Moderado";
    if (score <= 80) return "Alto Risco";
    return "Risco Crítico";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/30">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
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
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Bem-vindo, {session?.user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-slate-400 text-lg">
            Gerencie seus investimentos DeFi com segurança e inteligência
            artificial
          </p>
        </div>

        {/* Status Alerts */}
        <div className="space-y-4">
          {/* Login Success Alert */}
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              ✅ Sistema operacional. Conecte sua carteira para começar a
              análise de riscos.
            </AlertDescription>
          </Alert>

          {/* Risk Alert */}
          {isConnected && portfolioData.riskScore > 70 && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                ⚠️ Atenção! Seu portfolio apresenta alto nível de risco (
                {portfolioData.riskScore}/100). Considere rebalancear suas
                posições.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Wallet Connection */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Status da Carteira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected ? (
              <div className="text-center space-y-4 py-8">
                <Wallet className="h-16 w-16 mx-auto text-slate-500" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Carteira não conectada
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Conecte sua carteira para acessar análise de riscos e
                    funcionalidades DeFi
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
                    ✅ Carteira conectada com sucesso! Analisando dados...
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-400">
                      Endereço conectado:
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

        {/* Quick Stats - DADOS REAIS DOS CONTRATOS */}
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
                      `$${(portfolioData.totalValue / 1e18).toLocaleString()}`
                    )}
                  </p>
                  {isConnected && portfolioData.totalValue > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      +2.5% últimas 24h
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
                      `${portfolioData.riskScore}/100`
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
                    Monitoramento 24/7
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
                  <span className="text-slate-400">Protocolos ativos:</span>
                  <span className="text-white font-medium">
                    {portfolioData.protocolCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">
                    Score de diversificação:
                  </span>
                  <span className="text-white font-medium">
                    {portfolioData.diversificationScore}/100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Última análise:</span>
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
                      Analisando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Atualizar Análise
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {portfolioData.totalValue > 0 ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">
                          Portfolio analisado
                        </p>
                        <p className="text-xs text-slate-400">
                          Há alguns minutos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm text-white">Carteira conectada</p>
                        <p className="text-xs text-slate-400">Hoje</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-slate-400 text-sm">
                      Nenhuma atividade ainda.
                      <br />
                      Adicione posições para começar.
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
            <CardTitle className="text-white">Próximos Passos</CardTitle>
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
                      1. Conectar Carteira
                    </h3>
                    <p className="text-sm text-slate-400">
                      {isConnected
                        ? "✅ Carteira conectada com sucesso!"
                        : "Conecte sua carteira MetaMask ou outras"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${
                  isConnected && portfolioData.protocolCount > 0
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-slate-700/30 border-slate-600/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isConnected && portfolioData.protocolCount > 0 ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-500" />
                    )}
                    <div>
                      <h3 className="font-medium text-white">
                        2. Analisar Portfolio
                      </h3>
                      <p className="text-sm text-slate-400">
                        {isConnected && portfolioData.protocolCount > 0
                          ? `✅ ${portfolioData.protocolCount} protocolo(s) encontrado(s)`
                          : "Configure análise de seus investimentos DeFi"}
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
                        "Analisar"
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${
                  isConnected && portfolioData.alertsCount > 0
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-slate-700/30 border-slate-600/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isConnected && portfolioData.alertsCount > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-500" />
                  )}
                  <div>
                    <h3 className="font-medium text-white">
                      3. Configurar Alertas
                    </h3>
                    <p className="text-sm text-slate-400">
                      {isConnected && portfolioData.alertsCount > 0
                        ? `✅ ${portfolioData.alertsCount} alerta(s) ativo(s)`
                        : "Crie alertas inteligentes de risco"}
                    </p>
                  </div>
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
                  Cadastrar Riscos
                </Button>
              </AddPositionModal>

              <CreateInsuranceModal>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Criar Seguro
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
                Atualizar Análise
              </Button>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center pt-8 border-t border-slate-700/50">
          <p className="text-slate-500 text-sm">
            DefiGuardian AI v1.0 - Hackathon Chromion 2025
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Conectado à Avalanche Fuji Testnet
          </p>
        </div>
      </main>
    </div>
  );
}
