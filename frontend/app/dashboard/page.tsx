// frontend/src/app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  DollarSign,
  Activity,
  PieChart,
  BarChart3,
  RefreshCw
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RiskIndicator } from "@/components/risk-indicator"
import { PortfolioChart } from "@/components/portfolio-chart"
import { RecentActivity } from "@/components/recent-activity"
import { useAuth } from "@/contexts/AuthContext"

interface DashboardData {
  portfolioValue: string
  riskScore: string
  riskLevel: string
  positions: string
  protocols: string
  backendConnected: boolean
}

export default function Dashboard() {
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  
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
              
              // Update with real data if available
              if (portfolioData.success && portfolioData.data) {
                setDashboardData(prev => ({
                  ...prev,
                  portfolioValue: `$${(portfolioData.data.totalValue || 125420.50).toLocaleString()}`,
                  positions: (portfolioData.data.positions || 12).toString(),
                  protocols: (portfolioData.data.protocols || 8).toString()
                }))
              }
            }

          } catch (apiError) {
            console.warn('⚠️ API calls failed (using mock data):', apiError)
          }
        }
        
      } else {
        throw new Error('Backend health check failed')
      }
      
    } catch (error) {
      console.error('❌ Backend connection failed:', error)
      setDashboardData(prev => ({
        ...prev,
        backendConnected: false
      }))
    } finally {
      setLoading(false)
      setLastUpdate(new Date())
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData()
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, user])

  type TrendType = "up" | "down" | "warning" | "neutral";

  const keyMetrics = [
    {
      title: "Total Portfolio Value",
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
              Welcome back! Here's your portfolio overview.
            </p>
            {user?.address && (
              <p className="text-sm text-slate-500 mt-1">
                Connected: {user.address.slice(0, 6)}...{user.address.slice(-4)}
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
              {dashboardData.backendConnected ? 'Backend Connected' : 'Backend Offline'}
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
              Refresh
            </Button>
          </div>
        </div>

        {/* Connection Status Alert */}
        {!dashboardData.backendConnected && (
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span>Backend connection failed. Showing cached data.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Authentication Status */}
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-400">
              <Shield className="w-5 h-5" />
              <span>Wallet Connected and Authenticated</span>
              {user?.address && (
                <span className="text-slate-300">
                  ({user.address.slice(0, 6)}...{user.address.slice(-4)})
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Last Update Info */}
        <div className="text-right">
          <p className="text-xs text-slate-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {keyMetrics.map((metric, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{metric.title}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      {metric.trend === "up" && <TrendingUp className="h-4 w-4 text-green-400 mr-1" />}
                      {metric.trend === "down" && <TrendingDown className="h-4 w-4 text-red-400 mr-1" />}
                      {metric.trend === "warning" && <AlertTriangle className="h-4 w-4 text-orange-400 mr-1" />}
                      <span className={`text-sm ${metric.color}`}>{metric.change}</span>
                    </div>
                  </div>
                  <metric.icon className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Allocation */}
          <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Portfolio Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioChart data={portfolioData} />
            </CardContent>
          </Card>

          {/* Risk Breakdown */}
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Smart Contract Risk</span>
                    <span className="text-orange-400">High</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Liquidity Risk</span>
                    <span className="text-yellow-400">Medium</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Market Risk</span>
                    <span className="text-green-400">Low</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <RiskIndicator score={65} level="HIGH" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />

          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start bg-purple-600 hover:bg-purple-700"
                onClick={() => console.log('🔍 Running risk analysis...')}
              >
                <Shield className="mr-2 h-4 w-4" />
                Run Risk Analysis
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => console.log('📊 Creating new portfolio...')}
              >
                <PieChart className="mr-2 h-4 w-4" />
                Create New Portfolio
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => console.log('📈 Viewing analytics...')}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}