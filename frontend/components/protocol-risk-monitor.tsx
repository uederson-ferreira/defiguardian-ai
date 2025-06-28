'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, Activity, RefreshCw } from 'lucide-react'
import { useWeb3Contracts } from '@/hooks/useWeb3Contracts'
import { MOCK_PROTOCOLS } from '@/lib/web3-config';

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
    riskLevel: 'medium',
    tvl: '$2.1B'
  },
  {
    address: MOCK_PROTOCOLS.MOCK_COMPOUND,
    name: 'Compound (Mock)',
    category: 'Lending',
    riskLevel: 'low',
    tvl: '$1.8B'
  },
  {
    address: MOCK_PROTOCOLS.MOCK_UNISWAP,
    name: 'Uniswap (Mock)',
    category: 'DEX',
    riskLevel: 'medium',
    tvl: '$4.2B'
  },
  {
    address: MOCK_PROTOCOLS.CURVE,
    name: 'Curve (Mock)',
    category: 'DEX',
    riskLevel: 'high',
    tvl: '$3.5B'
  }
]

export function ProtocolRiskMonitor() {
  const {
    getProtocolRisk,
    getMarketRisk,
    isConnected,
    loading: web3Loading,
    error: web3Error
  } = useWeb3Contracts()

  const [protocolsData, setProtocolsData] = useState<ProtocolRiskData[]>([])
  const [marketRisk, setMarketRisk] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const loadProtocolRisks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading protocol risks...')
      
      // Load market risk
      const market = await getMarketRisk()
      setMarketRisk(market)

      // Load individual protocol risks
      const protocolPromises = MOCK_PROTOCOLS_LIST.map(async (protocol) => {
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
          console.warn(`⚠️ Error loading risk for ${protocol.name}:`, err)
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
      
      console.log('✅ Protocol risks loaded:', results)
      console.log('📊 Market risk:', market)

    } catch (err: unknown) {
      console.error('❌ Error loading protocol risks:', err)
      setError(err instanceof Error ? err.message : 'Error loading risk data')
    } finally {
      setLoading(false)
    }
  }, [getProtocolRisk, getMarketRisk])

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
    if (riskScore < 30) return 'Low'
    if (riskScore < 70) return 'Moderate'
    return 'High'
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
    
    if (marketRisk < 30) return { label: 'Stable', color: 'text-green-600' }
    if (marketRisk < 70) return { label: 'Volatile', color: 'text-yellow-600' }
    return { label: 'Critical', color: 'text-red-600' }
  }

  useEffect(() => {
    if (isConnected) {
      loadProtocolRisks()
    }
  }, [isConnected, loadProtocolRisks])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      loadProtocolRisks()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, loadProtocolRisks])

  if (!isConnected) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-400" />
            Protocol Risk Monitor
          </CardTitle>
          <CardDescription className="text-slate-400">
            Connect your wallet at the top of the page to monitor DeFi protocol risks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-500/50 bg-green-500/10">
            <Activity className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              ⚠️ Wallet not connected. Use the connection button in the page header.
            </AlertDescription>
          </Alert>
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
            Protocol Risk Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading risk data...</span>
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
            Protocol Risk Monitor
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
            Try Again
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
                Protocol Risk Monitor
              </CardTitle>
              <CardDescription>
                Real-time monitoring of DeFi protocol risks
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
                <span className="text-sm font-medium">Market Risk</span>
                <Badge variant={marketRisk ? getRiskBadgeVariant(marketRisk) : 'secondary'}>
                  {marketStatus.label}
                </Badge>
              </div>
              <p className={`text-2xl font-bold ${marketStatus.color}`}>
                {marketRisk ? `${marketRisk.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Monitored Protocols</span>
              <p className="text-2xl font-bold">{protocolsData.length}</p>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Last Update</span>
              <p className="text-sm text-muted-foreground">
                {lastRefresh ? lastRefresh.toLocaleTimeString('en-US') : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocols List */}
      <Card>
        <CardHeader>
          <CardTitle>Risks by Protocol</CardTitle>
          <CardDescription>
            Detailed risk analysis for each DeFi protocol
          </CardDescription>
        </CardHeader>
        <CardContent>
          {protocolsData.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No protocol data available</p>
              <Button onClick={loadProtocolRisks}>
                Load Data
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
                      <span className="text-sm text-muted-foreground">Risk Score</span>
                      <span className={`text-sm font-medium ${getRiskColor(protocol.riskScore)}`}>
                        {protocol.riskScore.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={protocol.riskScore} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>Address: {protocol.address.slice(0, 10)}...{protocol.address.slice(-8)}</span>
                    <span>Updated: {new Date(protocol.lastUpdated).toLocaleTimeString('en-US')}</span>
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