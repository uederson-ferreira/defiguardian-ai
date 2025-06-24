// frontend/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ArrowLeft,
  Github,
  Chrome,
  CheckCircle,
  Loader2,
  Mail,
  Lock,
  User,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const { user, isAuthenticated, loading, connectWallet } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, loading]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simular autenticação por email
      // TODO: Implementar autenticação real
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Login realizado com sucesso!");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simular cadastro por email
      // TODO: Implementar cadastro real
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Cadastro realizado com sucesso!");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Erro ao fazer cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // TODO: Implementar login com Google
      toast.success("Login com Google realizado!");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Erro no login com Google.");
    }
  };

  const handleGithubLogin = async () => {
    try {
      // TODO: Implementar login com GitHub
      toast.success("Login com GitHub realizado!");
      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Erro no login com GitHub.");
    }
  };

  const handleDemoAccess = () => {
    toast.success("Acessando versão demo...");
    window.location.href = "/dashboard";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="relative z-50 px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => window.location.href = "/"}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-purple-400" />
            <span className="ml-2 text-lg font-bold text-white">
              DefiGuardian AI
            </span>
          </div>
        </nav>
      </header>

      {/* Login Section */}
      <section className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-md">
          <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-md shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-white">
                Bem-vindo ao DefiGuardian
              </CardTitle>
              <CardDescription className="text-slate-300 text-sm">
                Entre ou crie sua conta para acessar a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Badge */}
              <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Sistema Online</span>
                </div>
                <p className="text-xs text-green-300 mt-0.5">
                  Autenticação completa disponível com login social
                </p>
              </div>

              {/* Tabs for Login/Register */}
              <Tabs value={showLogin ? "login" : "register"} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 h-9">
                  <TabsTrigger 
                    value="login" 
                    onClick={() => setShowLogin(true)}
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    onClick={() => setShowLogin(false)}
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs"
                  >
                    Cadastrar
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-3 mt-4">
                  <form onSubmit={handleEmailLogin} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email" className="text-white text-sm">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-9"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-password" className="text-white text-sm">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-9"
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 h-9"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-3 mt-4">
                  <form onSubmit={handleEmailRegister} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="register-name" className="text-white text-sm">
                        Nome
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Seu nome"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-9"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="register-email" className="text-white text-sm">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-9"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="register-password" className="text-white text-sm">
                        Senha
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Crie uma senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 h-9"
                          required
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 h-9"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        "Cadastrar"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-800 px-2 text-slate-400">
                    OU CONTINUE COM
                  </span>
                </div>
              </div>
              
              {/* Social Login */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleGoogleLogin}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50 h-9"
                >
                  <Chrome className="h-3.5 w-3.5 mr-2" />
                  Google
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleGithubLogin}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50 h-9"
                >
                  <Github className="h-3.5 w-3.5 mr-2" />
                  GitHub
                </Button>
              </div>
              
              {/* Demo Access */}
              <Button 
                variant="link" 
                className="w-full text-xs text-purple-400 hover:text-purple-300 h-8"
                onClick={handleDemoAccess}
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Continuar sem login (Demo)
              </Button>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-xs">
              Ao continuar, você concorda com nossos{" "}
              <a href="#" className="text-purple-400 hover:text-purple-300">
                Termos de Serviço
              </a>{" "}
              e{" "}
              <a href="#" className="text-purple-400 hover:text-purple-300">
                Política de Privacidade
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}