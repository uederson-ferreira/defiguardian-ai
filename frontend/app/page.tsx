// app/page.tsx
"use client";

import { useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
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
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          <span className="text-gray-300">Loading...</span>
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
                "Enter"
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
                Powered by Avalanche Blockchain
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
              Protect your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 animate-pulse">
                DeFi
              </span>
              <br />
              with Artificial Intelligence
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              The first AI-powered DeFi risk management platform that protects
              your investments in real-time with intelligent alerts and
              automated hedging.
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
                  Start System
                  <ChevronRight className="ml-2 h-6 w-6" />
                </>
              )}
            </Button>

            <Button className="h-16 px-10 bg-transparent border-2 border-slate-600 text-gray-300 hover:bg-slate-800/50 hover:border-purple-500/50 font-bold text-lg backdrop-blur-sm">
              <Target className="mr-2 h-5 w-5" />
              View Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-8 pt-12">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                $2.5M+
              </div>
              <div className="text-gray-400 font-medium">Protected Value</div>
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
                Supported Protocols
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                500+
              </div>
              <div className="text-gray-400 font-medium">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Revolutionary Features
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Cutting-edge technology to protect your DeFi investments
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">
                Portfolio Analysis
              </CardTitle>
              <CardDescription className="text-gray-300 text-base">
                Monitor your DeFi investments in real-time with advanced metrics
                and AI insights
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-yellow-500/50 transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Smart Alerts</CardTitle>
              <CardDescription className="text-gray-300 text-base">
                Receive instant notifications about risks, opportunities and
                market changes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-white text-xl">Advanced AI</CardTitle>
              <CardDescription className="text-gray-300 text-base">
                Machine learning algorithms for risk prediction and automated
                hedging
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
              Cutting-Edge Technology
            </h2>
            <p className="text-xl text-gray-300">
              Built with the best blockchain and AI technologies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">
                Avalanche Blockchain
              </h3>
              <p className="text-gray-300">
                Decentralized storage of historical risk data
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
                Optimized smart contracts for real-time risk analysis
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">Next.js 14</h3>
              <p className="text-gray-300">
                Modern and responsive interface with social authentication
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ready to Protect your DeFi?
          </h2>
          <p className="text-xl text-gray-300">
            Join hundreds of investors who already protect their assets with our
            AI
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
                Start Now
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
                &copy; 2025 DefiGuardian AI. Developed for Chromion Hackathon.
              </p>
              <p className="text-sm mt-1">
                Protecting the future of decentralized finance
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
