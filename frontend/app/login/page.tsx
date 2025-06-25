// app/login/page.tsx
// LOGIN PAGE ATUALIZADA COM NEXTAUTH + SUPABASE

'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Chrome, Github, Loader2, Lock, Sparkles, Shield, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PremiumLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProvider] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  
  // 🆕 States para formulário
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    try {
      setIsLoading(true)
      setProvider(providerName)
      
      console.log(`🔑 Iniciando login com ${providerName}...`)
      
      const result = await signIn(providerName, {
        callbackUrl: '/dashboard',
        redirect: false,
      })

      console.log('🔄 Resultado do signIn:', result)

      if (result?.ok) {
        console.log('✅ Login bem-sucedido, redirecionando...')
        router.push('/dashboard')
      } else if (result?.error) {
        console.error('❌ Erro no login:', result.error)
        alert(`Erro no login: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error)
      alert('Erro inesperado no login')
    } finally {
      setIsLoading(false)
      setProvider(null)
    }
  }

  // 🆕 Função atualizada para email/senha
  const handleEmailAuth = async () => {
    try {
      setIsLoading(true)
      
      // Validações
      if (!email.trim()) {
        alert('Email é obrigatório')
        return
      }
      
      if (!password.trim()) {
        alert('Senha é obrigatória')
        return
      }

      if (mode === 'register') {
        // Validações para cadastro
        if (!name.trim()) {
          alert('Nome é obrigatório para cadastro')
          return
        }
        
        if (password !== confirmPassword) {
          alert('Senhas não coincidem')
          return
        }
        
        if (password.length < 6) {
          alert('Senha deve ter pelo menos 6 caracteres')
          return
        }

        // Validação de email básica
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          alert('Email inválido')
          return
        }
      }

      console.log(`🔑 ${mode === 'login' ? 'Fazendo login' : 'Criando conta'} via email...`)
      
      const result = await signIn('credentials', {
        email: email.trim(),
        password: password.trim(),
        action: mode === 'login' ? 'signin' : 'signup',
        name: mode === 'register' ? name.trim() : undefined,
        redirect: false,
      })

      console.log('🔄 Resultado da autenticação:', result)

      if (result?.ok) {
        console.log('✅ Autenticação bem-sucedida!')
        
        // Verificar se a sessão foi criada
        const session = await getSession()
        console.log('📋 Sessão criada:', session)
        
        router.push('/dashboard')
      } else {
        console.error('❌ Erro na autenticação:', result?.error)
        
        // Mostrar erro mais amigável
        let errorMessage = result?.error || 'Erro na autenticação'
        
        if (errorMessage.includes('Email já cadastrado')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.'
        } else if (errorMessage.includes('Usuário não encontrado')) {
          errorMessage = 'Email não encontrado. Verifique o email ou crie uma conta.'
        } else if (errorMessage.includes('Senha incorreta')) {
          errorMessage = 'Senha incorreta. Tente novamente.'
        } else if (errorMessage.includes('ainda não implementado')) {
          errorMessage = 'Login via email ainda não disponível. Use login social (Google/GitHub).'
        }
        
        alert(errorMessage)
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error)
      alert('Erro inesperado na autenticação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Limpar formulário ao trocar de modo
  useEffect(() => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setName('')
  }, [mode])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-2xl animate-bounce"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz4KPHN2Zz4=')] opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          {/* Logo Section */}
          <div className="text-center mb-6 animate-fade-in">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                <h1 className="text-5xl font-bold mb-4 animate-gradient">
                  DefiGuardian
                </h1>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-300 mb-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <p className="text-lg">AI-Powered DeFi Risk Management</p>
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
              <Shield className="h-3 w-3" />
              <span>Secured by Advanced AI</span>
            </div>
          </div>

          {/* Main Card */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl animate-slide-up">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-white text-2xl font-bold mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Criar Conta'}
              </CardTitle>
              <p className="text-slate-300 text-sm">
                {mode === 'login' 
                  ? 'Entre na sua conta para acessar o dashboard' 
                  : 'Crie sua conta para começar a usar o DefiGuardian'
                }
              </p>
            </CardHeader>
            
            <CardContent className="pt-2 pb-8">
              {/* Login/Register Toggle */}
              <div className="flex mb-6 p-1 bg-black/20 rounded-lg backdrop-blur-sm">
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

              <div className="space-y-6">
                {/* Email and Password Fields */}
                <div className="space-y-4">
                  {mode === 'register' && (
                    <Input
                      id="name"
                      type="text"
                      placeholder="Nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
                      disabled={isLoading}
                    />
                  )}
                  
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
                    disabled={isLoading}
                  />
                  
                  <Input
                    id="password"
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
                    disabled={isLoading}
                  />

                  {mode === 'register' && (
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirmar senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
                      disabled={isLoading}
                    />
                  )}
                  
                  <Button 
                    onClick={handleEmailAuth}
                    disabled={isLoading}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : mode === 'login' ? (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Entrar
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar Conta
                      </>
                    )}
                  </Button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gradient-to-r from-purple-900 to-slate-900 px-4 text-slate-400 font-medium">
                      OU CONTINUE COM
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons - Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Google Login */}
                  <Button
                    onClick={() => handleSocialLogin('google')}
                    disabled={isLoading}
                    className="h-16 bg-white hover:bg-gray-50 text-gray-900 border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {isLoading && provider === 'google' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Chrome className="h-5 w-5" />
                      )}
                      <span className="font-semibold text-sm">Google</span>
                    </div>
                  </Button>

                  {/* GitHub Login */}
                  <Button
                    onClick={() => handleSocialLogin('github')}
                    disabled={isLoading}
                    className="h-16 bg-gray-900 hover:bg-gray-800 text-white border border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {isLoading && provider === 'github' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Github className="h-5 w-5" />
                      )}
                      <span className="font-semibold text-sm">GitHub</span>
                    </div>
                  </Button>
                </div>

                {/* Helper Text */}
                {mode === 'register' && (
                  <p className="text-xs text-slate-400 text-center">
                    Ao criar uma conta, você concorda com nossos{' '}
                    <span className="text-purple-400 hover:text-purple-300 cursor-pointer">
                      Termos de Uso
                    </span>{' '}
                    e{' '}
                    <span className="text-purple-400 hover:text-purple-300 cursor-pointer">
                      Política de Privacidade
                    </span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 animate-fade-in-delayed">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-2">
              <Shield className="h-4 w-4" />
              <span>Protected by DefiGuardian AI Security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-gradient {
          background: linear-gradient(-45deg, #7c3aed, #3b82f6, #7c3aed, #3b82f6);
          background-size: 400% 400%;
          animation: gradient 4s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-fade-in-delayed {
          animation: fade-in 0.8s ease-out 0.3s both;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        /* Glassmorphism enhanced */
        .backdrop-blur-xl {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </div>
  )
}