// app/dashboard/page.tsx
// DASHBOARD AVANÇADO - COM BANCO DE DADOS COMPLETO

'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WalletConnection } from '@/components/wallet-connection'
import { 
  LogOut, 
  User, 
  Mail, 
  Shield, 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  PieChart,
  BarChart3,
  Wallet,
  ExternalLink,
  RefreshCw,
  Bell,
  Settings,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react'

interface Portfolio {
  id: number
  name: string
  description: string
  wallet_address: string
  total_value: number
  risk_score: number
  positions: Position[]
  calculated_total_value?: number
  average_apy?: number
  position_count?: number
}

interface Position {
  id: number
  protocol_name: string
  protocol_address: string
  asset_symbol: string
  amount: number
  value_usd: number
  apy: number
  risk_level: string
}

interface RiskAlert {
  id: number
  alert_type: string
  severity: string
  title: string
  message: string
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  portfolios?: { name: string; wallet_address: string }
}

export default function AdvancedDashboardPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  
  // Estados
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [alertStats, setAlertStats] = useState<any>({})
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(false)
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login', redirect: true })
  }

  // Carregar portfolios
  const loadPortfolios = async () => {
    setIsLoadingPortfolios(true)
    try {
      const response = await fetch('/api/portfolio')
      const data = await response.json()
      
      if (data.success) {
        setPortfolios(data.portfolios)
        if (data.portfolios.length > 0 && !selectedPortfolio) {
          setSelectedPortfolio(data.portfolios[0])
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar portfolios:', error)
    } finally {
      setIsLoadingPortfolios(false)
    }
  }

  // Carregar alertas
  const loadAlerts = async () => {
    setIsLoadingAlerts(true)
    try {
      const response = await fetch('/api/alerts?limit=10')
      const data = await response.json()
      
      if (data.success) {
        setAlerts(data.alerts)
        setAlertStats(data.stats)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar alertas:', error)
    } finally {
      setIsLoadingAlerts(false)
    }
  }

  // Sincronizar com blockchain
  const syncBlockchain = async () => {
    if (!selectedPortfolio) return

    setIsSyncing(true)
    try {
      const response = await fetch('/api/sync/blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: selectedPortfolio.wallet_address,
          portfolioId: selectedPortfolio.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Recarregar dados após sincronização
        await loadPortfolios()
        await loadAlerts()
        console.log('✅ Sincronização blockchain concluída')
      }
    } catch (error) {
      console.error('❌ Erro na sincronização:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Marcar alerta como lido
  const markAlertAsRead = async (alertId: number) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, isRead: true })
      })
      
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ))
    } catch (error) {
      console.error('❌ Erro ao marcar alerta como lido:', error)
    }
  }

  // Criar portfolio
  const createPortfolio = async () => {
    const walletAddress = (session?.user as any)?.walletAddress
    if (!walletAddress) {
      alert('Conecte sua wallet primeiro!')
      return
    }

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Main Portfolio',
          description: 'Primary DeFi portfolio',
          walletAddress
        })
      })
      
      if (response.ok) {
        await loadPortfolios()
      }
    } catch (error) {
      console.error('❌ Erro ao criar portfolio:', error)
    }
  }

  useEffect(() => {
    if (session) {
      loadPortfolios()
      loadAlerts()
    }
  }, [session])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
      case 'critical': return 'text-red-600'
      default: return 'text-slate-400'
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    } as const
    return variants[severity as keyof typeof variants] || 'outline'
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              DefiGuardian AI Dashboard
            </h1>
            <p className="text-slate-300">Advanced portfolio management powered by AI</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={syncBlockchain}
              disabled={isSyncing || !selectedPortfolio}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSyncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Blockchain
            </Button>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
              <AvatarFallback>
                {session.user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <Button 
              onClick={handleSignOut}
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column - Profile + Wallet */}
        <div className="space-y-6">
          {/* User Profile */}
          <Card className="backdrop-blur-lg bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white space-y-3">
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-slate-400" />
                <span className="text-sm">{session.user?.email}</span>
              </div>
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4 text-slate-400" />
                <span className="text-sm">{session.user?.name}</span>
              </div>
              {(session.user as any)?.walletAddress && (
                <div className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4 text-slate-400" />
                  <span className="text-xs font-mono">
                    {(session.user as any).walletAddress.slice(0, 6)}...
                    {(session.user as any).walletAddress.slice(-4)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Connection */}
          <WalletConnection />

          {/* Quick Stats */}
          <Card className="backdrop-blur-lg bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Portfolios:</span>
                <span className="text-white">{portfolios.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Unread Alerts:</span>
                <Badge variant={alertStats.unread > 0 ? 'destructive' : 'secondary'}>
                  {alertStats.unread || 0}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Total Positions:</span>
                <span className="text-white">
                  {selectedPortfolio?.positions?.length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Columns - Portfolio Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Selector */}
          <Card className="backdrop-blur-lg bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Portfolio Overview
                </span>
                <Button 
                  onClick={createPortfolio}
                  size="sm"
                  disabled={!(session.user as any)?.walletAddress}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPortfolios ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
                  <p className="text-slate-300">Loading portfolios...</p>
                </div>
              ) : portfolios.length === 0 ? (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 mb-4">No portfolios found</p>
                  <Button 
                    onClick={createPortfolio}
                    disabled={!(session.user as any)?.walletAddress}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Create Your First Portfolio
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Portfolio Tabs */}
                  <div className="flex gap-2 overflow-x-auto">
                    {portfolios.map((portfolio) => (
                      <Button
                        key={portfolio.id}
                        onClick={() => setSelectedPortfolio(portfolio)}
                        variant={selectedPortfolio?.id === portfolio.id ? "default" : "outline"}
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        {portfolio.name}
                      </Button>
                    ))}
                  </div>

                  {/* Selected Portfolio Details */}
                  {selectedPortfolio && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2">
                          ${Number(selectedPortfolio.calculated_total_value || selectedPortfolio.total_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-slate-300 text-sm">Total Portfolio Value</p>
                      </div>
                      
                      <Separator className="bg-white/20" />
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-300 text-sm">Risk Score</span>
                          <span className="text-white font-medium">{selectedPortfolio.risk_score}/100</span>
                        </div>
                        <Progress 
                          value={selectedPortfolio.risk_score} 
                          className="h-2 bg-black/20"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          {selectedPortfolio.risk_score < 30 ? 'Conservative' : 
                           selectedPortfolio.risk_score < 70 ? 'Moderate' : 'Aggressive'} Risk Profile
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-white">
                            {selectedPortfolio.position_count || 0}
                          </div>
                          <p className="text-slate-400 text-xs">Positions</p>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white">
                            {(selectedPortfolio.average_apy || 0).toFixed(1)}%
                          </div>
                          <p className="text-slate-400 text-xs">Avg APY</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Positions Breakdown */}
          {selectedPortfolio && selectedPortfolio.positions && selectedPortfolio.positions.length > 0 && (
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Positions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedPortfolio.positions.map((position, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded border border-white/10">
                    <div>
                      <div className="text-white font-medium">{position.protocol_name}</div>
                      <div className="text-slate-400 text-sm">
                        {Number(position.amount).toFixed(4)} {position.asset_symbol}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">
                        ${Number(position.value_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityBadge(position.risk_level)} className="text-xs">
                          {position.risk_level}
                        </Badge>
                        <span className="text-slate-400 text-xs">
                          {Number(position.apy).toFixed(1)}% APY
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Alerts & Actions */}
        <div className="space-y-6">
          {/* Risk Alerts */}
          <Card className="backdrop-blur-lg bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Risk Alerts
                </span>
                {alertStats.unread > 0 && (
                  <Badge variant="destructive">{alertStats.unread}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {isLoadingAlerts ? (
                <div className="text-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin text-white mx-auto mb-2" />
                  <p className="text-slate-300 text-sm">Loading alerts...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-4">
                  <Shield className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-300 text-sm">No alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded border cursor-pointer transition-colors ${
                      alert.is_read 
                        ? 'bg-black/20 border-white/10 opacity-70' 
                        : 'bg-yellow-500/20 border-yellow-500/50'
                    }`}
                    onClick={() => !alert.is_read && markAlertAsRead(alert.id)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <Badge variant={getSeverityBadge(alert.severity)} className="text-xs">
                        {alert.severity}
                      </Badge>
                      {!alert.is_read && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="text-white text-sm font-medium mb-1">
                      {alert.title}
                    </div>
                    <p className="text-slate-300 text-xs">
                      {alert.message}
                    </p>
                    <div className="text-slate-400 text-xs mt-2">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="backdrop-blur-lg bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={syncBlockchain}
                disabled={isSyncing || !selectedPortfolio}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Blockchain Data
              </Button>
              
              <Button 
                onClick={() => loadAlerts()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Alerts
              </Button>
              
              <Button 
                onClick={() => window.open(`https://testnet.snowtrace.io/address/${selectedPortfolio?.wallet_address}`, '_blank')}
                disabled={!selectedPortfolio}
                variant="outline" 
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="backdrop-blur-lg bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Database:</span>
                <Badge variant="outline" className="text-green-400 border-green-500/50">Connected</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Blockchain:</span>
                <Badge variant="outline" className="text-green-400 border-green-500/50">Avalanche Fuji</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Contracts:</span>
                <Badge variant="outline" className="text-green-400 border-green-500/50">Deployed</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Footer */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-300 font-medium">
                🎉 DefiGuardian AI - Advanced Features Active!
              </span>
            </div>
            <Badge variant="outline" className="text-green-300 border-green-500/50">
              Full Stack Ready
            </Badge>
          </div>
          <p className="text-green-200 text-sm mt-1">
            Database ✅ | Blockchain Sync ✅ | Risk Monitoring ✅ | Portfolio Management ✅
          </p>
        </div>
      </div>
    </div>
  )
}