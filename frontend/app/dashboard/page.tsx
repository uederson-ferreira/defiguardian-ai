// frontend/src/app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  DollarSign,
  Activity,
  PieChart,
  BarChart3,
  RefreshCw,
  Wallet,
  CheckCircle,
  Info,
  ArrowRight,
  Zap,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RiskIndicator } from "@/components/risk-indicator"
import { PortfolioChart } from "@/components/portfolio-chart"
import { RecentActivity } from "@/components/recent-activity"
import { useAuth } from "@/contexts/AuthContext"
import { useWeb3 } from "@/contexts/Web3Provider"
import { WalletConnection } from "@/components/wallet-connection"

interface DashboardData {
  portfolioValue: string
  riskScore: string
  riskLevel: string
  positions: string
  protocols: string
  backendConnected: boolean
}

type TrendType = "up" | "down" | "warning" | "neutral"

export default function Dashboard() {
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  const { isConnected: web3Connected, chainId } = useWeb3()
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    portfolioValue: "$125,420.50",
    riskScore: "65/100", 
    riskLevel: "HIGH",
    positions: "12",
    protocols: "8",
    backendConnected: false
  })
  
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [showWalletConnection, setShowWalletConnection] = useState(false)

  const portfolioData = [
    { name: "Uniswap V3", value: 45230, color: "#FF6B6B" },
    { name: "Aave", value: 32100, color: "#4ECDC4" },
    { name: "Compound", value: 28450, color: "#45B7D1" },
    { name: "Curve", value: 19220, color: "#96CEB4" },
  ]

  // Fetch dashboard data from backend
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Fetching dashboard data...')
      
      // Test backend health
      const healthResponse = await fetch('http://localhost:8002/health')
      const healthData = await healthResponse.json()
      
      if (healthData.status === 'ok') {
        console.log('✅ Backend connected:', healthData)
        
        setDashboardData(prev => ({
          ...prev,
          backendConnected: true
        }))

        // Try to fetch real portfolio data
        const token = localStorage.getItem('auth_token')
        if (token && user?.address) {
          try {
            // Get user profile
            const profileResponse = await fetch('http://localhost:8002/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              console.log('✅ User profile:', profileData)
            }

            // Get portfolio data
            const portfolioResponse = await fetch('http://localhost:8002/api/portfolio', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            if (portfolioResponse.ok) {
              const portfolioData = await portfolioResponse.json()
              console.log('✅ Portfolio data:', portfolioData)
              
              // Update dashboard with real data
              setDashboardData(prev => ({
                ...prev,
                portfolioValue: portfolioData.totalValue || prev.portfolioValue,
                riskScore: portfolioData.riskScore || prev.riskScore,
                positions: portfolioData.positionsCount?.toString() || prev.positions,
                protocols: portfolioData.protocolsCount?.toString() || prev.protocols,
              }))
            }
          } catch (error) {
            console.log('⚠️ Error fetching portfolio data:', error)
          }
        }
      }
      
      setLastUpdate(new Date())
    } catch (error) {
      console.log('❌ Backend connection failed:', error)
      setDashboardData(prev => ({
        ...prev,
        backendConnected: false
      }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [user?.address])

  const stats = [
    {
      title: "Portfolio Value",
      value: dashboardData.portfolioValue,
      change: "+12.5%",
      trend: "up" as TrendType,
      icon: DollarSign,
      color: "text-green-400",
    },
    {
      title: "Overall Risk Score", 
      value: dashboardData.riskScore,
      change: dashboardData.riskLevel,
      trend: "warning" as TrendType,
      icon: Shield,
      color: "text-orange-400",
    },
    {
      title: "Active Positions",
      value: dashboardData.positions,
      change: "+2",
      trend: "up" as TrendType,
      icon: Activity,
      color: "text-blue-400",
    },
    {
      title: "Protocols",
      value: dashboardData.protocols,
      change: "Monitored",
      trend: "neutral" as TrendType,
      icon: BarChart3,
      color: "text-purple-400",
    },
  ]

  // Helper function to calculate risk level from score
  const getRiskLevel = (score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" => {
    if (score <= 25) return "LOW";
    if (score <= 50) return "MEDIUM";
    if (score <= 75) return "HIGH";
    return "CRITICAL";
  };

  // Show loading if auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Bem-vindo de volta! Aqui está sua visão geral do portfólio.
            </p>
            {user?.address && (
              <p className="text-sm text-slate-500 mt-1">
                Conectado: {user.address.slice(0, 6)}...{user.address.slice(-4)}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Backend Status */}
            <Badge 
              variant="outline" 
              className={`${dashboardData.backendConnected 
                ? 'border-green-500/20 bg-green-500/10 text-green-400' 
                : 'border-red-500/20 bg-red-500/10 text-red-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${dashboardData.backendConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {dashboardData.backendConnected ? 'Backend Conectado' : 'Backend Offline'}
            </Badge>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Wallet Connection Alert */}
        {!web3Connected && (
          <Alert className="border-purple-500/20 bg-purple-500/10">
            <Wallet className="h-4 w-4 text-purple-400" />
            <AlertDescription className="text-purple-300">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Carteira Necessária</strong>
                  <p className="text-sm mt-1">
                    Conecte sua carteira para acessar recursos completos de análise de risco e monitoramento de portfólio.
                  </p>
                </div>
                <Button
                  onClick={() => setShowWalletConnection(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white ml-4"
                >
                  Conectar Carteira
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Connection Success */}
        {web3Connected && (
          <Alert className="border-green-500/20 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Carteira Conectada</strong>
                  <p className="text-sm mt-1">
                    Sua carteira está conectada e pronta para análise completa de portfólio.
                  </p>
                </div>
                <Badge className="bg-green-500/20 text-green-300">
                  <Zap className="mr-1 h-3 w-3" />
                  Ativo
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Wallet Connection Modal */}
        {showWalletConnection && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <WalletConnection 
                onSuccess={() => {
                  setShowWalletConnection(false)
                  fetchDashboardData()
                }}
              />
              <Button
                variant="outline"
                className="w-full mt-4 border-slate-600 text-slate-300 hover:bg-slate-700/50"
                onClick={() => setShowWalletConnection(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="text-sm font-medium text-slate-300">
                      {stat.title}
                    </span>
                  </div>
                  {stat.trend === "up" && <TrendingUp className="h-4 w-4 text-green-400" />}
                  {stat.trend === "down" && <TrendingDown className="h-4 w-4 text-red-400" />}
                  {stat.trend === "warning" && <AlertTriangle className="h-4 w-4 text-orange-400" />}
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <p className={`text-xs ${
                    stat.trend === "up" ? "text-green-400" :
                    stat.trend === "down" ? "text-red-400" :
                    stat.trend === "warning" ? "text-orange-400" :
                    "text-slate-400"
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Chart */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <PieChart className="h-5 w-5 text-purple-400" />
                  Distribuição do Portfólio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {web3Connected ? (
                  <PortfolioChart data={portfolioData} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Wallet className="h-12 w-12 text-slate-600 mb-4" />
                    <p className="text-slate-400 mb-2">Conecte sua carteira</p>
                    <p className="text-sm text-slate-500 mb-4">
                      Para visualizar a distribuição do seu portfólio
                    </p>
                    <Button
                      onClick={() => setShowWalletConnection(true)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Conectar Agora
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Risk Indicator */}
          <div>
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-purple-400" />
                  Score de Risco
                </CardTitle>
              </CardHeader>
              <CardContent>
                {web3Connected ? (
                  <RiskIndicator score={65} level={getRiskLevel(65)} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertTriangle className="h-8 w-8 text-slate-600 mb-3" />
                    <p className="text-slate-400 text-sm mb-3">
                      Carteira necessária para análise de risco
                    </p>
                    <Progress value={0} className="w-full bg-slate-700" />
                    <p className="text-xs text-slate-500 mt-2">N/A</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-purple-400" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {web3Connected ? (
              <RecentActivity />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-slate-600 mb-4" />
                <p className="text-slate-400 mb-2">Nenhuma atividade para mostrar</p>
                <p className="text-sm text-slate-500 mb-4">
                  Conecte sua carteira para ver transações recentes e atividades do portfólio
                </p>
                <Button
                  onClick={() => setShowWalletConnection(true)}
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Conectar Carteira
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="text-center py-4">
          <p className="text-slate-500 text-sm">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}