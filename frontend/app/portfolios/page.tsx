"use client"

import { useState, useEffect } from "react"
import dynamicImport from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, TrendingUp, TrendingDown, MoreHorizontal, PieChart } from "lucide-react"

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

// Importa DashboardLayout dinamicamente apenas no cliente
const DashboardLayout = dynamicImport(
  () => import("@/components/dashboard-layout").then(mod => ({ default: mod.DashboardLayout })),
  { ssr: false }
)
import { RiskIndicator } from "@/components/risk-indicator"
import Link from "next/link"

const portfolios = [
  {
    id: "1",
    name: "DeFi Growth Portfolio",
    description: "High-yield farming strategies across major protocols",
    value: "$125,420.50",
    change: "+12.5%",
    riskScore: 65,
    riskLevel: "HIGH" as const,
    positions: 8,
    protocols: ["Uniswap", "Aave", "Compound"],
    lastAnalysis: "2 hours ago",
  },
  {
    id: "2",
    name: "Conservative Staking",
    description: "Low-risk staking and lending positions",
    value: "$89,230.25",
    change: "+4.2%",
    riskScore: 25,
    riskLevel: "LOW" as const,
    positions: 4,
    protocols: ["Lido", "Rocket Pool"],
    lastAnalysis: "1 day ago",
  },
  {
    id: "3",
    name: "Arbitrage Opportunities",
    description: "Cross-chain arbitrage and MEV strategies",
    value: "$67,890.75",
    change: "-2.1%",
    riskScore: 85,
    riskLevel: "CRITICAL" as const,
    positions: 12,
    protocols: ["1inch", "Paraswap", "Curve"],
    lastAnalysis: "30 minutes ago",
  },
]

export default function Portfolios() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRisk, setFilterRisk] = useState("all")
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const filteredPortfolios = portfolios.filter((portfolio) => {
    const matchesSearch = portfolio.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterRisk === "all" || portfolio.riskLevel.toLowerCase() === filterRisk
    return matchesSearch && matchesFilter
  })
  
  if (!isClient) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading portfolios...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Portfolios</h1>
            <p className="text-slate-400 mt-1">Manage and monitor your DeFi investment portfolios</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Portfolio
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search portfolios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterRisk === "all" ? "default" : "outline"}
              onClick={() => setFilterRisk("all")}
              className="border-slate-600"
            >
              All
            </Button>
            <Button
              variant={filterRisk === "low" ? "default" : "outline"}
              onClick={() => setFilterRisk("low")}
              className="border-slate-600"
            >
              Low Risk
            </Button>
            <Button
              variant={filterRisk === "high" ? "default" : "outline"}
              onClick={() => setFilterRisk("high")}
              className="border-slate-600"
            >
              High Risk
            </Button>
          </div>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortfolios.map((portfolio) => (
            <Card
              key={portfolio.id}
              className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-white mb-1">{portfolio.name}</CardTitle>
                    <p className="text-sm text-slate-400 line-clamp-2">{portfolio.description}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Value and Change */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{portfolio.value}</p>
                    <div className="flex items-center mt-1">
                      {portfolio.change.startsWith("+") ? (
                        <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                      )}
                      <span
                        className={`text-sm ${portfolio.change.startsWith("+") ? "text-green-400" : "text-red-400"}`}
                      >
                        {portfolio.change}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      portfolio.riskLevel === "LOW"
                        ? "secondary"
                        : portfolio.riskLevel === "HIGH"
                          ? "destructive"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {portfolio.riskLevel}
                  </Badge>
                </div>

                {/* Risk Score */}
                <RiskIndicator score={portfolio.riskScore} level={portfolio.riskLevel} />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
                  <div>
                    <p className="text-xs text-slate-400">Positions</p>
                    <p className="text-sm font-semibold text-white">{portfolio.positions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Protocols</p>
                    <p className="text-sm font-semibold text-white">{portfolio.protocols.length}</p>
                  </div>
                </div>

                {/* Protocols */}
                <div>
                  <p className="text-xs text-slate-400 mb-2">Active Protocols</p>
                  <div className="flex flex-wrap gap-1">
                    {portfolio.protocols.slice(0, 3).map((protocol) => (
                      <Badge key={protocol} variant="outline" className="text-xs border-slate-600 text-slate-300">
                        {protocol}
                      </Badge>
                    ))}
                    {portfolio.protocols.length > 3 && (
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                        +{portfolio.protocols.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/portfolio/${portfolio.id}`} className="flex-1">
                    <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                      <PieChart className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                </div>

                <p className="text-xs text-slate-500">Last analysis: {portfolio.lastAnalysis}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPortfolios.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <PieChart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No portfolios found</h3>
              <p className="text-slate-400 mb-4">
                {searchTerm ? "Try adjusting your search terms" : "Create your first portfolio to get started"}
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" />
                Create Portfolio
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
