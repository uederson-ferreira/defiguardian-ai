"use client";

declare global {
  interface Window {
    refreshPortfolioData?: () => void;
  }
}

import { useEffect, useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Shield,
  DollarSign,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAccount } from "wagmi";
import useWeb3Contracts from "@/hooks/useWeb3Contracts";

interface PortfolioAnalysisProps {
  userAddress?: string;
}

interface PortfolioData {
  riskScore: number;
  analysis: string;
  positions: Array<{
    protocol: string;
    token: string;
    amount: string;
  }>;
  totalValue: string;
  assetAllocation: {
    assets: string[];
    percentages: number[];
  };
  // Additional computed properties
  protocolCount?: number;
  diversificationScore?: number;
  alertsCount?: number;
}

export function PortfolioAnalysis({ userAddress }: PortfolioAnalysisProps) {
  const { address, isConnected } = useAccount();
  const { analyzePortfolio, loading, error } = useWeb3Contracts();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);

  const targetAddress = userAddress || address;

  // Auto-refresh quando uma nova posição é adicionada
  const handleRefresh = useCallback(async () => {
    if (targetAddress) {
      const data = await analyzePortfolio(targetAddress);
      setPortfolioData(data);
    }
  }, [analyzePortfolio, targetAddress]);

  // Load portfolio data initially
  useEffect(() => {
    if (targetAddress && isConnected) {
      handleRefresh();
    }
  }, [targetAddress, isConnected, handleRefresh]);

  // Expor função de refresh para componentes pais
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.refreshPortfolioData = handleRefresh;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete window.refreshPortfolioData;
      }
    };
  }, [handleRefresh]);

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 30) return "text-green-600";
    if (riskScore < 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskBadgeVariant = (
    riskScore: number
  ): "default" | "secondary" | "destructive" => {
    if (riskScore < 30) return "default";
    if (riskScore < 70) return "secondary";
    return "destructive";
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore < 30) return "Baixo Risco";
    if (riskScore < 70) return "Risco Moderado";
    return "Alto Risco";
  };

  // Removido useEffect automático para evitar loop infinito
  // A análise será feita apenas quando o usuário clicar no botão

  if (!isConnected) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-700">Análise de Portfolio</CardTitle>
          <CardDescription className="text-gray-600">
            Conecte sua carteira no topo da página para analisar seu portfólio
            DeFi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-gray-300 bg-gray-100">
            <TrendingUp className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-700">
              ⚠️ Carteira não conectada. Use o botão de conexão no header da
              página.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Análise de Portfólio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Analisando portfólio...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Análise de Portfólio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="w-full mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!portfolioData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Análise de Portfólio
          </CardTitle>
          <CardDescription>
            Endereço: {targetAddress?.slice(0, 6)}...{targetAddress?.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nenhum dado de portfólio encontrado
            </p>
            <Button onClick={handleRefresh} disabled={loading}>
              Analisar Portfólio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Análise de Portfólio
          </CardTitle>
          <CardDescription>
            Endereço: {targetAddress?.slice(0, 6)}...{targetAddress?.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Risk Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score de Risco</span>
                <Badge variant={getRiskBadgeVariant(portfolioData.riskScore)}>
                  {getRiskLabel(portfolioData.riskScore)}
                </Badge>
              </div>
              <div className="space-y-1">
                <Progress value={portfolioData.riskScore} className="h-2" />
                <p
                  className={`text-2xl font-bold ${getRiskColor(
                    portfolioData.riskScore
                  )}`}
                >
                  {Math.round(Math.min(portfolioData.riskScore, 100) * 100) /
                    100}
                  %
                </p>
              </div>
            </div>

            {/* Total Value */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Valor Total</span>
              </div>
              <p className="text-2xl font-bold">
                $
                {parseFloat(portfolioData.totalValue).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            {/* Market Risk */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {portfolioData.riskScore && portfolioData.riskScore > 50 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">Risco de Mercado</span>
              </div>
              <p
                className={`text-2xl font-bold ${
                  portfolioData.riskScore
                    ? getRiskColor(portfolioData.riskScore)
                    : "text-gray-500"
                }`}
              >
                {portfolioData.riskScore
                  ? `${
                      Math.round(Math.min(portfolioData.riskScore, 100) * 100) /
                      100
                    }%`
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={() => analyzePortfolio()}
              variant="outline"
              className="w-full"
            >
              Atualizar Análise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Details */}
      {portfolioData && parseFloat(portfolioData.totalValue) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análise Detalhada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-gray-700">Valor Total</h4>
                <p className="text-2xl font-bold text-blue-600">
                  $
                  {parseFloat(portfolioData.totalValue || "0").toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-gray-700">Protocolos</h4>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(portfolioData.protocolCount || 0)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-gray-700">Diversificação</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((portfolioData.diversificationScore || 0) * 100) /
                    100}
                  %
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium text-gray-700">Alertas Ativos</h4>
                <p className="text-2xl font-bold text-orange-600">
                  {portfolioData.alertsCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Summary */}
      {portfolioData && (portfolioData.protocolCount ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo do Portfólio
                </CardTitle>
                <CardDescription>
                  {portfolioData.protocolCount} protocolo(s) detectado(s) no seu
                  portfólio
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => analyzePortfolio()}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2 text-gray-700">
                    Score de Risco Geral
                  </h4>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={portfolioData.riskScore}
                      className="flex-1"
                    />
                    <span
                      className={`font-bold ${getRiskColor(
                        portfolioData.riskScore
                      )}`}
                    >
                      {Math.round(
                        Math.min(portfolioData.riskScore, 100) * 100
                      ) / 100}
                      %
                    </span>
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2 text-gray-700">
                    Diversificação
                  </h4>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={Math.min(
                        portfolioData.diversificationScore || 0,
                        100
                      )}
                      className="flex-1"
                    />
                    <span className="font-bold text-blue-600">
                      {Math.round(
                        Math.min(portfolioData.diversificationScore || 0, 100) *
                          100
                      ) / 100}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Dados detalhados das posições serão exibidos quando
                  disponíveis nos contratos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asset Allocation */}
      {portfolioData && parseFloat(portfolioData.totalValue) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alocação de Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h4 className="font-medium">Alocação de Ativos</h4>
              <div className="space-y-2">
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Dados de alocação serão exibidos quando disponíveis
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PortfolioAnalysis;
