'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, TrendingDown, Shield, AlertTriangle, DollarSign } from 'lucide-react'
import useWeb3Contracts from '@/hooks/useWeb3Contracts'

interface PortfolioAnalysisProps {
  userAddress?: string
}

export function PortfolioAnalysis({ userAddress }: PortfolioAnalysisProps) {
  const {
    analyzePortfolio,
    getMarketRisk,
    isConnected,
    account,
    loading: web3Loading,
    error: web3Error,
    initializeWeb3
  } = useWeb3Contracts()

  const [portfolioData, setPortfolioData] = useState<any>(null)
  const [marketRisk, setMarketRisk] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const targetAddress = userAddress || account

  const loadPortfolioData = async () => {
    if (!targetAddress) {
      setError('Nenhum endereço fornecido para análise')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Carregando dados do portfólio...')
      
      // Load portfolio analysis and market risk in parallel
      const [portfolio, market] = await Promise.all([
        analyzePortfolio(targetAddress),
        getMarketRisk()
      ])

      setPortfolioData(portfolio)
      setMarketRisk(market)

      console.log('✅ Dados do portfólio carregados:', portfolio)
      console.log('📊 Risco de mercado:', market)

    } catch (err: any) {
      console.error('❌ Erro ao carregar dados do portfólio:', err)
      setError(err.message || 'Erro ao carregar dados do portfólio')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore < 30) return 'text-green-600'
    if (riskScore < 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskBadgeVariant = (riskScore: number): 'default' | 'secondary' | 'destructive' => {
    if (riskScore < 30) return 'default'
    if (riskScore < 70) return 'secondary'
    return 'destructive'
  }

  const getRiskLabel = (riskScore: number) => {
    if (riskScore < 30) return 'Baixo Risco'
    if (riskScore < 70) return 'Risco Moderado'
    return 'Alto Risco'
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num)
  }

  useEffect(() => {
    if (isConnected && targetAddress) {
      loadPortfolioData()
    }
  }, [isConnected, targetAddress])

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Análise de Portfólio
          </CardTitle>
          <CardDescription>
            Conecte sua carteira para analisar seu portfólio DeFi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={initializeWeb3} className="w-full">
            Conectar Carteira
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (web3Loading || loading) {
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
    )
  }

  if (error || web3Error) {
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
            <AlertDescription>
              {error || web3Error}
            </AlertDescription>
          </Alert>
          <Button onClick={loadPortfolioData} className="w-full mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
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
            <p className="text-muted-foreground mb-4">Nenhum dado de portfólio encontrado</p>
            <Button onClick={loadPortfolioData}>
              Analisar Portfólio
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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
                <p className={`text-2xl font-bold ${getRiskColor(portfolioData.riskScore)}`}>
                  {portfolioData.riskScore.toFixed(1)}%
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
                {formatCurrency(portfolioData.totalValue)}
              </p>
            </div>

            {/* Market Risk */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {marketRisk && marketRisk > 50 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">Risco de Mercado</span>
              </div>
              <p className={`text-2xl font-bold ${marketRisk ? getRiskColor(marketRisk) : 'text-gray-500'}`}>
                {marketRisk ? `${marketRisk.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={loadPortfolioData} variant="outline" className="w-full">
              Atualizar Análise
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Details */}
      {portfolioData.analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Análise Detalhada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {portfolioData.analysis}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Positions */}
      {portfolioData.positions && portfolioData.positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Posições do Portfólio</CardTitle>
            <CardDescription>
              {portfolioData.positions.length} posição(ões) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolioData.positions.map((position: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{position.protocol}</p>
                    <p className="text-sm text-muted-foreground">{position.token}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(position.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asset Allocation */}
      {portfolioData.assetAllocation && portfolioData.assetAllocation.assets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alocação de Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {portfolioData.assetAllocation.assets.map((asset: string, index: number) => {
                const percentage = portfolioData.assetAllocation.percentages[index]
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{asset}</span>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PortfolioAnalysis