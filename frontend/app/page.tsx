// app/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  AlertTriangle,
  Bot,
  ChevronRight,
  Loader2,
  Zap,
  Target,
  Globe,
  Users,
} from "lucide-react";
import { AIChat } from "@/components/ai-chat";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // ❌ REMOVIDO: Redirecionamento automático
  // Agora o usuário deve clicar no botão para entrar no sistema
  // useEffect(() => {
  //   if (status === "authenticated") {
  //     router.push("/dashboard");
  //   }
  // }, [status, router]);

  const handleStartSystem = () => {
    setIsLoading(true);
    if (status === "authenticated") {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          <span className="text-gray-300">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header com Glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/30">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">DefiGuardian</span>
              <span className="text-purple-400 ml-1">AI</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 px-3 py-1">
              🏆 Hackathon Chromion
            </Badge>
            <Button
              onClick={handleStartSystem}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section com Animações */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Título Principal */}
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-full">
              <Zap className="h-4 w-4 text-purple-400 mr-2" />
              <span className="text-purple-300 text-sm font-medium">
                Powered by Chromia Blockchain
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
              Proteja seu{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 animate-pulse">
                DeFi
              </span>
              <br />
              com Inteligência Artificial
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              A primeira plataforma de gerenciamento de riscos DeFi alimentada
              por IA que protege seus investimentos em tempo real com alertas
              inteligentes e hedge automatizado.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              onClick={handleStartSystem}
              disabled={isLoading}
              className="h-16 px-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg shadow-2xl shadow-purple-500/25 transform hover:scale-105 transition-all duration-200"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                <>
                  Iniciar Sistema
                  <ChevronRight className="ml-2 h-6 w-6" />
                </>
              )}
            </Button>

            <Button className="h-16 px-10 bg-transparent border-2 border-slate-600 text-gray-300 hover:bg-slate-800/50 hover:border-purple-500/50 font-bold text-lg backdrop-blur-sm">
              <Target className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-8 pt-12">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                $2.5M+
              </div>
              <div className="text-gray-400 font-medium">Valor Protegido</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-600">
                99.9%
              </div>
              <div className="text-gray-400 font-medium">Uptime</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                15+
              </div>
              <div className="text-gray-400 font-medium">
                Protocolos Suportados
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                500+
              </div>
              <div className="text-gray-400 font-medium">Usuários Ativos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Recursos Revolucionários
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Tecnologia de ponta para proteger seus investimentos DeFi
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">
                Análise de Portfólio
              </CardTitle>
              <CardDescription className="text-gray-300 text-base">
                Monitore seus investimentos DeFi em tempo real com métricas
                avançadas e insights de IA
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-yellow-500/50 transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">
                Alertas Inteligentes
              </CardTitle>
              <CardDescription className="text-gray-300 text-base">
                Receba notificações instantâneas sobre riscos, oportunidades e
                mudanças de mercado
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">IA Avançada</CardTitle>
              <CardDescription className="text-gray-300 text-base">
                Algoritmos de machine learning para predição de riscos e hedge
                automatizado
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Technology Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-3xl border border-purple-500/20 backdrop-blur-xl p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Tecnologia de Ponta
            </h2>
            <p className="text-xl text-gray-300">
              Construído com as melhores tecnologias blockchain e IA
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">
                Chromia Blockchain
              </h3>
              <p className="text-gray-300">
                Armazenamento descentralizado de dados históricos de risco
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">
                Avalanche Network
              </h3>
              <p className="text-gray-300">
                Smart contracts otimizados para análise de riscos em tempo real
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">Next.js 14</h3>
              <p className="text-gray-300">
                Interface moderna e responsiva com autenticação social
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Pronto para Proteger seu DeFi?
          </h2>
          <p className="text-xl text-gray-300">
            Junte-se a centenas de investidores que já protegem seus ativos com
            nossa IA
          </p>
          <Button
            onClick={handleStartSystem}
            disabled={isLoading}
            className="h-16 px-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl shadow-2xl shadow-purple-500/25 transform hover:scale-105 transition-all duration-200"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
              <>
                Começar Agora
                <ChevronRight className="ml-2 h-6 w-6" />
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 backdrop-blur-xl bg-slate-900/30">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold">DefiGuardian AI</span>
            </div>
            <div className="text-gray-400 text-center">
              <p>
                &copy; 2025 DefiGuardian AI. Desenvolvido para Hackathon
                Chromion.
              </p>
              <p className="text-sm mt-1">
                Protegendo o futuro das finanças descentralizadas
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chat Component */}
      <AIChat />
    </div>
  );
}
