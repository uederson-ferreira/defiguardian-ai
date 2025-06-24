// frontend/src/app/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Shield,
  Brain,
  AlertTriangle,
  TrendingUp,
  Activity,
  DollarSign,
  Wallet,
  ArrowRight,
  Users,
  Zap,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Provider";
import { WalletButton } from "@/components/wallet-button";
import { WalletConnection } from "@/components/wallet-connection";
import { DashboardLayout } from "@/components/dashboard-layout";
import PortfolioAnalysis from "@/components/portfolio-analysis";
import RiskAlerts from "@/components/risk-alerts";
import RiskInsurance from "@/components/risk-insurance";
import ProtocolRiskMonitor from "@/components/protocol-risk-monitor";
import { useWeb3Contracts } from "@/hooks/useWeb3Contracts";

export default function HomePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const { isConnected, chainId } = useWeb3();
  const [isLaunching, setIsLaunching] = useState(false);
  const { isConnected: web3Connected } = useWeb3Contracts();

  const handleLaunchSystem = async () => {
    if (isAuthenticated) {
      // Already authenticated, go to dashboard
      setIsLaunching(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } else {
      // Go to login page
      setIsLaunching(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="relative z-50 px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-400" />
            <span className="ml-2 text-xl font-bold text-white">
              DefiGuardian AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <Button
                variant="outline"
                onClick={() => window.location.href = "/dashboard"}
                className="border-purple-400/30 text-purple-300 hover:bg-purple-400/10"
              >
                Dashboard
              </Button>
            )}
            <Button
              onClick={handleLaunchSystem}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
              disabled={loading || isLaunching}
            >
              {isLaunching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {isAuthenticated ? "Acessar Dashboard" : "Iniciar Sistema"}
                </>
              )}
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent rounded-full blur-3xl"></div>
        <div className="relative max-w-4xl mx-auto">
          <Badge className="mb-6 bg-purple-900/30 text-purple-300 border-purple-400/30">
            <Sparkles className="mr-2 h-3 w-3" />
            Powered by AI & Blockchain
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
            Proteja seus
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Investimentos DeFi
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Monitore riscos, analise protocolos e proteja seu portfólio com nossa
            plataforma de inteligência artificial avançada.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleLaunchSystem}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg px-8 py-3 text-lg"
              disabled={loading || isLaunching}
            >
              {isLaunching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Iniciando Sistema...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Iniciar Sistema
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-purple-400/30 text-purple-300 hover:bg-purple-400/10 px-8 py-3 text-lg"
              onClick={() => {
                const featuresSection = document.getElementById("features");
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Saiba Mais
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Recursos Avançados
            </h2>
            <p className="text-slate-400 text-lg">
              Tudo que você precisa para gerenciar riscos DeFi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Shield className="h-8 w-8 text-purple-400" />
                  <Badge className="bg-purple-900/30 text-purple-300">
                    AI Powered
                  </Badge>
                </div>
                <CardTitle className="text-white">Análise de Riscos</CardTitle>
                <CardDescription>
                  Monitore riscos em tempo real com algoritmos avançados de IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-300">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                    Score de risco personalizado
                  </div>
                  <div className="flex items-center text-sm text-slate-300">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
                    Alertas automáticos
                  </div>
                  <div className="flex items-center text-sm text-slate-300">
                    <Activity className="h-4 w-4 mr-2 text-blue-400" />
                    Análise de protocolos
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Brain className="h-8 w-8 text-purple-400" />
                  <Badge className="bg-purple-900/30 text-purple-300">
                    Smart
                  </Badge>
                </div>
                <CardTitle className="text-white">IA Assistente</CardTitle>
                <CardDescription>
                  Consulte nossa IA para análises personalizadas e insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-300">
                    <Users className="h-4 w-4 mr-2 text-green-400" />
                    Consultoria personalizada
                  </div>
                  <div className="flex items-center text-sm text-slate-300">
                    <Zap className="h-4 w-4 mr-2 text-yellow-400" />
                    Respostas instantâneas
                  </div>
                  <div className="flex items-center text-sm text-slate-300">
                    <DollarSign className="h-4 w-4 mr-2 text-blue-400" />
                    Estratégias de investimento
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Wallet className="h-8 w-8 text-purple-400" />
                  <Badge className="bg-purple-900/30 text-purple-300">
                    Secure
                  </Badge>
                </div>
                <CardTitle className="text-white">Integração Web3</CardTitle>
                <CardDescription>
                  Conecte sua carteira e monitore seus investimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-300">
                    <Shield className="h-4 w-4 mr-2 text-green-400" />
                    Conexão segura
                  </div>
                  <div className="flex items-center text-sm text-slate-300">
                    <Activity className="h-4 w-4 mr-2 text-yellow-400" />
                    Monitoramento em tempo real
                  </div>
                  <div className="flex items-center text-sm text-slate-300">
                    <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
                    Análise de portfólio
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">
            Comece a Proteger seus Investimentos Hoje
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Junte-se a milhares de investidores que já protegem seus portfólios
            com nossa plataforma de inteligência artificial.
          </p>
          <Button
            size="lg"
            onClick={handleLaunchSystem}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg px-12 py-4 text-lg"
            disabled={loading || isLaunching}
          >
            {isLaunching ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Iniciando Sistema...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-5 w-5" />
                Iniciar Sistema Agora
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Demo Section - Only show if not authenticated */}
      {!isAuthenticated && (
        <section className="px-4 sm:px-6 lg:px-8 py-24 bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">
                Experimente Nossos Recursos
              </h2>
              <p className="text-slate-400 text-lg">
                Teste algumas funcionalidades sem precisar conectar sua carteira
              </p>
            </div>

            <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-800/50">
                <TabsTrigger value="analysis">Análise</TabsTrigger>
                <TabsTrigger value="alerts">Alertas</TabsTrigger>
                <TabsTrigger value="insurance">Seguro</TabsTrigger>
                <TabsTrigger value="monitor">Monitor</TabsTrigger>
              </TabsList>

              <TabsContent value="analysis" className="space-y-4">
                <PortfolioAnalysis />
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <RiskAlerts />
              </TabsContent>

              <TabsContent value="insurance" className="space-y-4">
                <RiskInsurance />
              </TabsContent>

              <TabsContent value="monitor" className="space-y-4">
                <ProtocolRiskMonitor />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-purple-400 mr-2" />
            <span className="text-lg font-bold text-white">DefiGuardian AI</span>
          </div>
          <p className="text-slate-400 mb-4">
            Protegendo seus investimentos DeFi com inteligência artificial
          </p>
          <p className="text-slate-500 text-sm">
            © 2024 DefiGuardian AI. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}