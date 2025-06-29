/**
 * MODULE: Simple Login Page
 * LOCATION: app/login/page.tsx
 * DESCRIPTION: Simple login with email and social (Google/GitHub)
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Chrome,
  Github,
  Loader2,
  Lock,
  UserPlus,
  AlertTriangle,
  ArrowLeft,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const {
    isAuthenticated,
    loading,
    loginWithOAuth,
    loginWithEmail,
    signUpWithEmail,
  } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Se já está logado, vai para o dashboard
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  const handleSocialLogin = async (provider: "google" | "github") => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await loginWithOAuth(provider);

      if (!success) {
        setError(`Erro no login com ${provider}`);
      } else {
        toast.success("Login realizado com sucesso!");
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Unexpected login error");
      console.error("Social login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!email.trim() || !password.trim()) {
        setError("Email e senha são obrigatórios");
        return;
      }

      if (mode === "register" && !name.trim()) {
        setError("Nome é obrigatório para registro");
        return;
      }

      // Validação adicional para registro
      if (mode === "register") {
        if (password.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres");
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError("Por favor, insira um email válido");
          return;
        }
      }

      let success = false;
      let errorMessage = "";

      if (mode === "register") {
        const result = await signUpWithEmail(
          email.trim(),
          password.trim(),
          name.trim()
        );
        success = result.success;
        errorMessage = result.error || "Erro ao criar conta";
      } else {
        const result = await loginWithEmail(email.trim(), password.trim());
        success = result.success;
        errorMessage = result.error || "Email ou senha incorretos";
      }

      if (!success) {
        setError(errorMessage);
      } else {
        toast.success(
          mode === "login"
            ? "Login realizado com sucesso!"
            : "Conta criada com sucesso!"
        );
        router.push("/dashboard");
      }
    } catch (error) {
      setError("Erro inesperado na autenticação");
      console.error("Email login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Botão de voltar para home */}
      <Button
        onClick={() => router.push("/")}
        variant="ghost"
        className="absolute top-6 left-6 text-white hover:bg-white/10 p-2"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back
      </Button>

      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            DefiGuardian AI
          </CardTitle>
          <p className="text-slate-400">
            {mode === "login"
              ? "Sign in to your account"
              : "Create your account"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Mode Toggle */}
          <div className="flex bg-slate-700/50 rounded-lg p-1">
            <Button
              onClick={() => setMode("login")}
              variant={mode === "login" ? "default" : "ghost"}
              className={`flex-1 h-10 ${
                mode === "login"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <Lock className="mr-2 h-4 w-4" />
              Sign In
            </Button>
            <Button
              onClick={() => setMode("register")}
              variant={mode === "register" ? "default" : "ghost"}
              className={`flex-1 h-10 ${
                mode === "register"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Register
            </Button>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            {mode === "register" && (
              <Input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                disabled={isLoading}
              />
            )}

            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              disabled={isLoading}
            />

            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                disabled={isLoading}
              />
              {mode === "register" && password && (
                <div className="text-xs space-y-1">
                  <div
                    className={`flex items-center space-x-2 ${
                      password.length >= 6 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        password.length >= 6 ? "bg-green-400" : "bg-red-400"
                      }`}
                    />
                    <span>Pelo menos 6 caracteres</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleEmailAuth}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSocialLogin("google")}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <Button
              onClick={() => handleSocialLogin("github")}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
