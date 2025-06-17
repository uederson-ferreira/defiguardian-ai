// frontend/src/app/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Shield, TrendingUp, Users, Zap, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

export default function Home() {
  const { isAuthenticated, connectWallet, login, loading, setIsWalletModalOpen } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true)
      
      console.log('🔄 Starting wallet connection...')
      
      // Open wallet selection modal
      await connectWallet()
      
      // The actual connection will be handled by the WalletModal component
      // and the connectWithWallet function in AuthContext
      
    } catch (error) {
      console.error('❌ Connection failed:', error)
      alert('Failed to connect wallet. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleLaunchApp = () => {
    if (isAuthenticated) {
      // Already authenticated, go to dashboard
      window.location.href = '/dashboard'
    } else {
      // Not authenticated, trigger wallet connection
      handleConnectWallet()
    }
  }

  // If loading, show loading state
  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="relative z-50 px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-400" />
            <span className="ml-2 text-xl font-bold text-white">RiskGuardian AI</span>
          </div>
          <Button 
            onClick={handleLaunchApp}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={loading || isConnecting}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Launch App'}
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8">
            AI-Powered <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">DeFi Risk</span>
            <br />
            Management
          </h1>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Protect your DeFi investments with advanced AI risk analysis, real-time
            monitoring, and intelligent portfolio optimization powered by Chromion and
            Chainlink.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleConnectWallet}
              disabled={isConnecting || loading}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-3"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Connecting...
                </>
              ) : isAuthenticated ? (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleLaunchApp}
              disabled={loading || isConnecting}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {isAuthenticated ? 'Go to App' : 'View Demo'}
            </Button>
          </div>
          
          {/* Status indicator */}
          {isAuthenticated && (
            <div className="mt-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span className="text-sm text-green-400">Wallet Connected</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: "Protocols Monitored", value: "150+", icon: Shield },
              { label: "Total Value Protected", value: "$2.4B", icon: TrendingUp },
              { label: "Active Users", value: "12.5K", icon: Users },
              { label: "Risk Alerts Sent", value: "45K", icon: Zap },
            ].map((stat, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardContent className="p-6 text-center">
                  <stat.icon className="h-8 w-8 text-purple-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-slate-300">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Advanced Risk Management Features</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Comprehensive tools to analyze, monitor, and optimize your DeFi portfolio risk
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Real-time Risk Analysis",
                description: "AI-powered risk scoring with continuous monitoring of your DeFi positions",
                icon: "🔍",
              },
              {
                title: "Portfolio Optimization",
                description: "Intelligent recommendations to balance risk and returns across protocols",
                icon: "⚖️",
              },
              {
                title: "Smart Contract Auditing",
                description: "Automated security analysis of smart contracts before you invest",
                icon: "🛡️",
              },
              {
                title: "Market Intelligence",
                description: "Real-time market data and predictive analytics for better decisions",
                icon: "📊",
              },
              {
                title: "Risk Alerts",
                description: "Instant notifications when risk levels change in your portfolio",
                icon: "🚨",
              },
              {
                title: "Multi-Chain Support",
                description: "Monitor risks across Ethereum, Polygon, and other major chains",
                icon: "🔗",
              },
            ].map((feature, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Ready to Secure Your DeFi Portfolio?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of DeFi investors who trust RiskGuardian AI to protect their investments
          </p>
          <Button
            size="lg"
            onClick={handleConnectWallet}
            disabled={isConnecting || loading}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-3"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Connecting...
              </>
            ) : isAuthenticated ? (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            <Shield className="h-8 w-8 text-purple-400" />
            <span className="ml-2 text-xl font-bold text-white">RiskGuardian AI</span>
          </div>
          <p className="text-slate-400 mb-4">
            Built with ❤️ for the DeFi community
          </p>
          <p className="text-sm text-slate-500">
            Powered by Chromion & Chainlink
          </p>
        </div>
      </footer>
    </div>
  )
}