// app/debug/page.tsx
// PÁGINA DE DEBUG COMPLETA PARA DIAGNOSTICAR O SISTEMA

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Server,
  Database,
  Shield,
  Globe,
  Settings,
  Bug,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

interface TestResult {
  name: string;
  status: "success" | "error" | "warning" | "loading";
  message: string;
  details?: string | Record<string, unknown> | null;
}

export default function DebugPage() {
  const { user, isAuthenticated } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = useCallback(async () => {
    setIsRunning(true);
    setTests([]);

    const testResults: TestResult[] = [];

    // Test 1: API Test Route
    try {
      const response = await fetch("/api/test");
      const data = await response.json();
      testResults.push({
        name: "API Test Route",
        status: response.ok ? "success" : "error",
        message: response.ok ? "API working" : "API error",
        details: data,
      });
    } catch (error) {
      testResults.push({
        name: "API Test Route",
        status: "error",
        message: "API connection error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 2: Environment Variables
    try {
      const response = await fetch("/api/test-env");
      const data = await response.json();
      testResults.push({
        name: "Environment Variables",
        status: response.ok ? "success" : "error",
        message: response.ok ? "Variables loaded" : "ENV variables error",
        details: data.environment_check,
      });
    } catch (error) {
      testResults.push({
        name: "Environment Variables",
        status: "error",
        message: "Error checking ENV",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 3: Supabase Auth
    try {
      testResults.push({
        name: "Supabase Auth",
        status: isAuthenticated ? "success" : "warning",
        message: isAuthenticated
          ? "Usuário autenticado via Supabase"
          : "Usuário não autenticado",
        details: user ? `Email: ${user.email}` : "Nenhum usuário logado",
      });
    } catch (error) {
      testResults.push({
        name: "Supabase Auth",
        status: "error",
        message: "Erro ao verificar autenticação Supabase",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 4: Supabase Connection
    try {
      const response = await fetch("/api/test-env");
      const data = await response.json();
      const hasSupabaseVars =
        data.NEXT_PUBLIC_SUPABASE_URL && data.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      testResults.push({
        name: "Supabase Connection",
        status: hasSupabaseVars ? "success" : "error",
        message: hasSupabaseVars
          ? "Variáveis Supabase configuradas"
          : "Variáveis Supabase faltando",
        details: `URL: ${
          data.NEXT_PUBLIC_SUPABASE_URL ? "Configurada" : "Faltando"
        }, Key: ${
          data.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configurada" : "Faltando"
        }`,
      });
    } catch (error) {
      testResults.push({
        name: "Supabase Connection",
        status: "error",
        message: "Erro ao verificar configuração Supabase",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Test 5: Client-side Session
    testResults.push({
      name: "Client Session",
      status: isAuthenticated ? "success" : "warning",
      message: isAuthenticated
        ? "Sessão ativa no cliente"
        : "Sem sessão no cliente",
      details: {
        status: isAuthenticated ? "authenticated" : "unauthenticated",
        user: user,
        hasEmail: !!user?.email,
        hasName: !!user?.user_metadata?.full_name,
        hasImage: !!user?.user_metadata?.avatar_url,
      },
    });

    setTests(testResults);
    setIsRunning(false);
  }, [user, isAuthenticated]);

  useEffect(() => {
    runTests();
  }, [user, runTests]);

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    const variants = {
      success: "default",
      error: "destructive",
      warning: "secondary",
      loading: "outline",
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                <Bug className="mr-3 h-8 w-8" />
                DefiGuardian Debug Console
              </h1>
              <p className="text-slate-300">
                Sistema de diagnóstico e monitoramento
              </p>
            </div>

            <Button
              onClick={runTests}
              disabled={isRunning}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isRunning ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Executar Testes
            </Button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="backdrop-blur-lg bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Server className="h-8 w-8 text-blue-400 mr-3" />
                <div>
                  <p className="text-white font-medium">API Status</p>
                  <p className="text-slate-300 text-sm">
                    {tests.find((t) => t.name === "API Test Route")?.status ===
                    "success"
                      ? "Online"
                      : "Offline"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-400 mr-3" />
                <div>
                  <p className="text-white font-medium">Auth System</p>
                  <p className="text-slate-300 text-sm">
                    {tests.find((t) => t.name === "Supabase Auth")?.status ===
                    "success"
                      ? "Functional"
                      : "Error"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-purple-400 mr-3" />
                <div>
                  <p className="text-white font-medium">Session</p>
                  <p className="text-slate-300 text-sm">
                    {isAuthenticated ? "Active" : "None"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-white/10 border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-orange-400 mr-3" />
                <div>
                  <p className="text-white font-medium">Environment</p>
                  <p className="text-slate-300 text-sm">
                    {tests.find((t) => t.name === "Environment Variables")
                      ?.status === "success"
                      ? "Loaded"
                      : "Error"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">
            Resultados dos Testes
          </h2>

          {tests.map((test, index) => (
            <Card
              key={index}
              className="backdrop-blur-lg bg-white/10 border-white/20"
            >
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  {getStatusIcon(test.status)}
                  <span className="ml-3">{test.name}</span>
                  {getStatusBadge(test.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 mb-4">{test.message}</p>

                {test.details != null && (
                  <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                    <p className="text-xs text-slate-400 mb-2">Details:</p>
                    <pre className="text-xs text-slate-300 overflow-auto whitespace-pre-wrap break-words">
                      {typeof test.details === "string"
                        ? test.details
                        : JSON.stringify(test.details, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {tests.length === 0 && (
            <Card className="backdrop-blur-lg bg-white/10 border-white/20">
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-300">
                  Executando testes de diagnóstico...
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => window.open("/login", "_blank")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Shield className="mr-2 h-4 w-4" />
              Ir para Login
            </Button>

            <Button
              onClick={() => window.open("/dashboard", "_blank")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Globe className="mr-2 h-4 w-4" />
              Ir para Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
