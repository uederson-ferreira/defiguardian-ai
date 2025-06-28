"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { RiskAlerts } from "./risk-alerts";
import { RiskInsurance } from "./risk-insurance";

interface IndividualRisk {
  id: string;
  protocol: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  riskScore: number;
  amount: string;
  lastUpdated: string;
  trend: "up" | "down" | "stable";
}

interface InsurancePolicy {
  id: string;
  protocol: string;
  coverage: string;
  premium: string;
  status: "Active" | "Expired" | "Pending";
  expiresAt: string;
}

export function IndividualRisksInsurance() {
  const [showRisks, setShowRisks] = useState(true);
  const [showInsurance, setShowInsurance] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [loading, setLoading] = useState(false);

  // Mock data - em produção viria dos contratos
  const [risks] = useState<IndividualRisk[]>([
    {
      id: "1",
      protocol: "Aave",
      riskLevel: "Medium",
      riskScore: 65,
      amount: "5.2 ETH",
      lastUpdated: "2 min atrás",
      trend: "up",
    },
    {
      id: "2",
      protocol: "Compound",
      riskLevel: "Low",
      riskScore: 25,
      amount: "1200 USDC",
      lastUpdated: "5 min atrás",
      trend: "stable",
    },
    {
      id: "3",
      protocol: "Uniswap V3",
      riskLevel: "High",
      riskScore: 85,
      amount: "0.8 BTC",
      lastUpdated: "1 min atrás",
      trend: "down",
    },
  ]);

  const [insurancePolicies] = useState<InsurancePolicy[]>([
    {
      id: "1",
      protocol: "Aave",
      coverage: "4.16 ETH",
      premium: "0.26 ETH",
      status: "Active",
      expiresAt: "23 dias",
    },
    {
      id: "2",
      protocol: "Compound",
      coverage: "960 USDC",
      premium: "60 USDC",
      status: "Active",
      expiresAt: "15 dias",
    },
  ]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "High":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Expired":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-400" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-400" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    // Simular carregamento
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Individual Risks and Insurance
          </h2>
          <p className="text-slate-400">
            Monitor each position and insurance coverage
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Update
        </Button>
      </div>

      {/* Controles de visualização */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setShowRisks(!showRisks)}
          variant={showRisks ? "default" : "outline"}
          size="sm"
          className="border-slate-600"
        >
          {showRisks ? (
            <Eye className="h-4 w-4 mr-2" />
          ) : (
            <EyeOff className="h-4 w-4 mr-2" />
          )}
          Risks ({risks.length})
        </Button>
        <Button
          onClick={() => setShowInsurance(!showInsurance)}
          variant={showInsurance ? "default" : "outline"}
          size="sm"
          className="border-slate-600"
        >
          {showInsurance ? (
            <Eye className="h-4 w-4 mr-2" />
          ) : (
            <EyeOff className="h-4 w-4 mr-2" />
          )}
          Insurance ({insurancePolicies.length})
        </Button>
        <Button
          onClick={() => setShowAlerts(!showAlerts)}
          variant={showAlerts ? "default" : "outline"}
          size="sm"
          className="border-slate-600"
        >
          {showAlerts ? (
            <Eye className="h-4 w-4 mr-2" />
          ) : (
            <EyeOff className="h-4 w-4 mr-2" />
          )}
          Alerts
        </Button>
      </div>

      {/* Individual Risks */}
      {showRisks && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              Risks by Protocol
            </CardTitle>
            <CardDescription className="text-slate-400">
              Detailed risk analysis for each position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {risks.map((risk) => (
                <div
                  key={risk.id}
                  className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {risk.protocol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">
                          {risk.protocol}
                        </h3>
                        <p className="text-sm text-slate-400">{risk.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(risk.trend)}
                      <Badge className={getRiskColor(risk.riskLevel)}>
                        {risk.riskLevel}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-400">
                          Risk Score
                        </span>
                        <span className="text-sm font-medium text-white">
                          {risk.riskScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            risk.riskScore <= 30
                              ? "bg-green-500"
                              : risk.riskScore <= 60
                              ? "bg-yellow-500"
                              : risk.riskScore <= 80
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${risk.riskScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 ml-4">
                      {risk.lastUpdated}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contracted Insurance */}
      {showInsurance && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Contracted Insurance
            </CardTitle>
            <CardDescription className="text-slate-400">
              Active policies and protection coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insurancePolicies.length > 0 ? (
                insurancePolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {policy.protocol}
                          </h3>
                          <p className="text-sm text-slate-400">
                            Cobertura: {policy.coverage}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(policy.status)}>
                        {policy.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Prêmio:</span>
                        <span className="text-white ml-2">
                          {policy.premium}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Expira em:</span>
                        <span className="text-white ml-2">
                          {policy.expiresAt}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Alert className="border-blue-500/50 bg-blue-500/10">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-400">
                    No insurance contracted. Consider protecting your high-risk
                    positions.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Components */}
      {showAlerts && (
        <div className="grid gap-6 lg:grid-cols-2">
          <RiskAlerts />
          <RiskInsurance />
        </div>
      )}
    </div>
  );
}

export default IndividualRisksInsurance;
