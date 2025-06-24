'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Activity, RefreshCw } from 'lucide-react'
import useWeb3Contracts from '@/hooks/useWeb3Contracts'
import { CONTRACT_ADDRESSES, MOCK_PROTOCOLS } from '@/lib/web3-config';

interface ProtocolRiskData {
  address: string
  name: string
  riskScore: number
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
  category: string
  tvl?: string
}

const MOCK_PROTOCOLS_LIST = [
  {
    address: MOCK_PROTOCOLS.MOCK_AAVE,
    name: 'Aave (Mock)',
    category: 'Lending',
    riskLevel: 'medium'
  },
  {
    address: MOCK_PROTOCOLS.MOCK_COMPOUND,
    name: 'Compound (Mock)',
    category: 'Lending',
    riskLevel: 'low'
  },
  {
    address: MOCK_PROTOCOLS.MOCK_UNISWAP,
    name: 'Uniswap (Mock)',
    category: 'DEX',
    riskLevel: 'medium'
  },
  {
    address: MOCK_PROTOCOLS.CURVE,
    name: 'Curve (Mock)',
    category: 'DEX',
    riskLevel: 'high'
  }
]

export function ProtocolRiskMonitor() {
  const {
    getProtocolRisk,
    getMarketRisk,
    isConnected,
    loading: web3Loading,
    error: web3Error,
    initializeWeb3
  } = useWeb3Contracts()

  const [protocolsData, setProtocolsData] = useState<ProtocolRiskData[]>([])
  const [marketRisk, setMarketRisk] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const loadProtocolRisks = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Carregando riscos de protocolos...')
      
      // Load market risk
      const market = await getMarketRisk()
      setMarketRisk(market)

      // Load individual protocol risks
      const protocolPromises = MOCK_PROTOCOLS_LIST.map(async (protocol: any) => {
        try {
          const risk = await getProtocolRisk(protocol.address)
          
          // Generate mock trend and additional data
          const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable']
          const randomTrend = trends[Math.floor(Math.random() * trends.length)]
          
          return {
            address: protocol.address,
            name: protocol.name,
            riskScore: risk || Math.floor(Math.random() * 100), // Fallback to random if contract call fails
            trend: randomTrend,
            lastUpdated: new Date().toISOString(),
            category: protocol.category,
            tvl: protocol.tvl
          } as ProtocolRiskData
        } catch (err) {
          console.warn(`⚠️ Erro ao carregar risco para ${protocol.name}:`, err)
          // Return mock data if contract call fails
          return {
            address: protocol.address,
            name: protocol.name,
            riskScore: Math.floor(Math.random() * 100),
            trend: 'stable' as const,
            lastUpdated: new Date().toISOString(),
            category: protocol.category,
            tvl: protocol.tvl
          } as ProtocolRiskData
        }
      })

      const results = await Promise.all(protocolPromises)
      setProtocolsData(results)
      setLastRefresh(new Date())
      
      console.log('✅ Riscos de protocolos carregados:', results)
      console.log('📊 Risco de mercado:', market)

    } catch (err: any) {
      console.error('❌ Erro ao carregar riscos de protocolos:', err)
      setError(err.message || 'Erro ao carregar dados de risco')
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
    if (riskScore < 30) return 'Baixo'
    if (riskScore < 70) return 'Moderado'
    return 'Alto'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'lending':
        return 'bg-blue-100 text-blue-800'
      case 'dex':
        return 'bg-purple-100 text-purple-800'
      case 'yield':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMarketRiskStatus = () => {
    if (!marketRisk) return { label: 'N/A', color: 'text-gray-500' }
    
    if (marketRisk < 30) return { label: 'Estável', color: 'text-green-600' }
    if (marketRisk < 70) return { label: 'Volátil', color: 'text-yellow-600' }
    return { label: 'Crítico', color: 'text-red-600' }
  }

  useEffect(() => {
    if (isConnected) {
      loadProtocolRisks()
    }
  }, [isConnected])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      loadProtocolRisks()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isConnected])

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monitor de Risco de Protocolos
          </CardTitle>
          <CardDescription>
            Conecte sua carteira para monitorar riscos de protocolos DeFi
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
            <Activity className="h-5 w-5" />
            Monitor de Risco de Protocolos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando dados de risco...</span>
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
            <Activity className="h-5 w-5" />
            Monitor de Risco de Protocolos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || web3Error}
            </AlertDescription>
          </Alert>
          <Button onClick={loadProtocolRisks} className="w-full mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const marketStatus = getMarketRiskStatus()

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monitor de Risco de Protocolos
              </CardTitle>
              <CardDescription>
                Monitoramento em tempo real dos riscos de protocolos DeFi
              </CardDescription>
            </div>
            <Button onClick={loadProtocolRisks} variant="outline" size="sm" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Risco de Mercado</span>
                <Badge variant={marketRisk ? getRiskBadgeVariant(marketRisk) : 'secondary'}>
                  {marketStatus.label}
                </Badge>
              </div>
              <p className={`text-2xl font-bold ${marketStatus.color}`}>
                {marketRisk ? `${marketRisk.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Protocolos Monitorados</span>
              <p className="text-2xl font-bold">{protocolsData.length}</p>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Última Atualização</span>
              <p className="text-sm text-muted-foreground">
                {lastRefresh ? lastRefresh.toLocaleTimeString('pt-BR') : 'Nunca'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocols List */}
      <Card>
        <CardHeader>
          <CardTitle>Riscos por Protocolo</CardTitle>
          <CardDescription>
            Análise detalhada de risco para cada protocolo DeFi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {protocolsData.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum dado de protocolo disponível</p>
              <Button onClick={loadProtocolRisks}>
                Carregar Dados
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {protocolsData.map((protocol) => (
                <div key={protocol.address} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{protocol.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(protocol.category)}`}>
                            {protocol.category}
                          </span>
                          {protocol.tvl && (
                            <span className="text-xs text-muted-foreground">
                              TVL: ${protocol.tvl}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getTrendIcon(protocol.trend)}
                      <Badge variant={getRiskBadgeVariant(protocol.riskScore)}>
                        {getRiskLabel(protocol.riskScore)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Score de Risco</span>
                      <span className={`text-sm font-medium ${getRiskColor(protocol.riskScore)}`}>
                        {protocol.riskScore.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={protocol.riskScore} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>Endereço: {protocol.address.slice(0, 10)}...{protocol.address.slice(-8)}</span>
                    <span>Atualizado: {new Date(protocol.lastUpdated).toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProtocolRiskMonitor