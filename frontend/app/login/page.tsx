/**
 * MÓDULO: Página de Login Simples
 * LOCALIZAÇÃO: app/login/page.tsx
 * DESCRIÇÃO: Login simples com email e social (Google/GitHub)
 */

'use client'

import { signIn, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Chrome, Github, Loader2, Lock, UserPlus, AlertTriangle, ArrowLeft, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  // Se já está logado, vai para o dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await signIn(provider, {
        callbackUrl: '/dashboard',
        redirect: false,
      })

      if (result?.error) {
        setError(`Erro no login: ${result.error}`)
      } else if (result?.ok) {
        toast.success('Login realizado com sucesso!')
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Erro inesperado no login')
      console.error('Erro no login social:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!email.trim() || !password.trim()) {
        setError('Email e senha são obrigatórios')
        return
      }

      if (mode === 'register' && !name.trim()) {
        setError('Nome é obrigatório para cadastro')
        return
      }

      const result = await signIn('credentials', {
        email: email.trim(),
        password: password.trim(),
        action: mode,
        name: mode === 'register' ? name.trim() : undefined,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes('CredentialsSignin')) {
          setError('Email ou senha incorretos')
        } else {
          setError(result.error)
        }
      } else if (result?.ok) {
        toast.success(mode === 'login' ? 'Login realizado!' : 'Conta criada com sucesso!')
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Erro inesperado na autenticação')
      console.error('Erro no login por email:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Botão de voltar para home */}
      <Button
        onClick={() => router.push('/')}
        variant="ghost"
        className="absolute top-6 left-6 text-white hover:bg-white/10 p-2"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Voltar
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
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
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
              onClick={() => setMode('login')}
              variant={mode === 'login' ? 'default' : 'ghost'}
              className={`flex-1 h-10 ${
                mode === 'login' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Lock className="mr-2 h-4 w-4" />
              Entrar
            </Button>
            <Button
              onClick={() => setMode('register')}
              variant={mode === 'register' ? 'default' : 'ghost'}
              className={`flex-1 h-10 ${
                mode === 'register' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar
            </Button>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            {mode === 'register' && (
              <Input
                type="text"
                placeholder="Nome completo"
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
            
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              disabled={isLoading}
            />
            
            <Button 
              onClick={handleEmailAuth}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'login' ? 'Entrando...' : 'Criando conta...'}
                </>
              ) : (
                mode === 'login' ? 'Entrar' : 'Criar conta'
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">ou continue com</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Chrome className="mr-2 h-4 w-4" />
              Continuar com Google
            </Button>

            <Button
              onClick={() => handleSocialLogin('github')}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Github className="mr-2 h-4 w-4" />
              Continuar com GitHub
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}