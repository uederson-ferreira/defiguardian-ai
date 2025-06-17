"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { WalletModal } from '@/components/wallet-modal'

interface User {
  address: string
  nonce?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  connectWallet: () => Promise<string | null>
  login: (address: string) => Promise<boolean>
  logout: () => Promise<void>
  isWalletModalOpen: boolean
  setIsWalletModalOpen: (isOpen: boolean) => void
  connectWithWallet: (walletType: string) => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isBackendAvailable, setIsBackendAvailable] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession()
  }, [])

  async function checkExistingSession() {
    try {
      const token = localStorage.getItem('auth_token')
      const address = localStorage.getItem('wallet_address')

      if (address) {
        // Primeiro, definimos o usuário com o endereço da carteira
        // independentemente do backend
        setUser({ address })
        
        // Se tiver token, tentamos verificar com o backend
        if (token) {
          try {
            const response = await fetch('http://localhost:8002/api/auth/profile', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })

            if (response.ok) {
              setIsAuthenticated(true)
              console.log('✅ Session restored for:', address)
            } else {
              // Token inválido, limpar apenas o token
              localStorage.removeItem('auth_token')
              setIsBackendAvailable(true)
            }
          } catch (error: unknown) {
            console.error('Backend check failed:', error)
            // Problema com o backend, mas mantemos o usuário conectado
            setIsBackendAvailable(false)
            localStorage.removeItem('auth_token')
          }
        }
      }
    } catch (error: unknown) {
      console.error('Session check failed:', error)
      // Clear any invalid session data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('wallet_address')
    } finally {
      setLoading(false)
    }
  }

  async function connectWallet(): Promise<string | null> {
    try {
      // Open wallet selection modal instead of directly connecting
      setIsWalletModalOpen(true)
      return null
    } catch (error: unknown) {
      console.error('❌ Wallet connection failed:', error)
      throw error
    }
  }

  async function connectWithWallet(walletType: string): Promise<string | null> {
    try {
      console.log(`🔄 Conectando com ${walletType}...`)
      
      // Handle different wallet types
      if (walletType === 'metamask') {
        // Verificar se o MetaMask está instalado
        if (!window.ethereum) {
          console.error('❌ Ethereum provider não encontrado')
          alert('MetaMask não encontrado! Por favor, instale o MetaMask para continuar.')
          return null
        }
        
        if (!window.ethereum.isMetaMask) {
          console.error('❌ MetaMask não encontrado, mas outro provider ethereum está disponível')
          alert('MetaMask não encontrado! Por favor, instale o MetaMask para continuar.')
          return null
        }
        
        console.log('🦊 Solicitando conexão do MetaMask...')
        console.log('Provider ethereum:', window.ethereum)
        
        try {
          // Verificar a rede atual
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          console.log('🔗 Chain ID atual:', chainId)
          
          // Solicitar contas
          console.log('Solicitando contas...')
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          })
      
          console.log('Contas retornadas:', accounts)
      
          if (!accounts || accounts.length === 0) {
            throw new Error('Nenhuma conta encontrada')
          }
      
          const address = accounts[0]
          console.log('✅ Carteira conectada:', address)
          
          // Atualizar o estado do usuário imediatamente após conectar a carteira
          setUser({ address })
          localStorage.setItem('wallet_address', address)
          
          return address
        } catch (metamaskError: any) {
          console.error('Erro específico do MetaMask:', metamaskError)
          
          // Tratamento específico para erros comuns do MetaMask
          if (metamaskError.code === 4001) {
            alert('Você rejeitou a conexão com o MetaMask. Por favor, tente novamente e aprove a conexão.')
          } else if (metamaskError.code === -32002) {
            alert('Já existe uma solicitação de conexão pendente no MetaMask. Por favor, abra a extensão e aprove a conexão.')
          } else {
            alert(`Erro ao conectar com MetaMask: ${metamaskError.message || 'Erro desconhecido'}`)
          }
          
          return null
        }
      } 
      else if (walletType === 'brave') {
        if (!window.ethereum) {
          alert('Brave Wallet not found! Please enable Brave Wallet to continue.')
          return null
        }
        
        console.log('🦁 Requesting Brave Wallet connection...')
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })

        if (accounts.length === 0) {
          throw new Error('No accounts found')
        }

        const address = accounts[0]
        console.log('✅ Wallet connected:', address)
        
        // Atualizar o estado do usuário imediatamente após conectar a carteira
        setUser({ address })
        localStorage.setItem('wallet_address', address)
        
        return address
      }
      else if (walletType === 'coinbase') {
        if (!window.ethereum || typeof (window.ethereum as any).isCoinbaseWallet === 'undefined') {
          alert('Coinbase Wallet not found! Please install Coinbase Wallet to continue.')
          return null
        }
        
        console.log('💰 Requesting Coinbase Wallet connection...')
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })

        if (accounts.length === 0) {
          throw new Error('No accounts found')
        }

        const address = accounts[0]
        console.log('✅ Wallet connected:', address)
        
        // Atualizar o estado do usuário imediatamente após conectar a carteira
        setUser({ address })
        localStorage.setItem('wallet_address', address)
        
        return address
      }
      else if (walletType === 'walletconnect') {
        // For WalletConnect, we would need to initialize the WalletConnect provider
        // This is a simplified implementation
        alert('WalletConnect support coming soon!')
        return null
      }
      else if (walletType === 'rabby') {
        // For Rabby Wallet
        if (!window.ethereum) {
          alert('Rabby Wallet not found! Please install Rabby Wallet to continue.')
          return null
        }
        
        console.log('🐰 Requesting Rabby Wallet connection...')
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })

        if (accounts.length === 0) {
          throw new Error('No accounts found')
        }

        const address = accounts[0]
        console.log('✅ Wallet connected:', address)
        
        // Atualizar o estado do usuário imediatamente após conectar a carteira
        setUser({ address })
        localStorage.setItem('wallet_address', address)
        
        return address
      }
      else {
        alert('Unsupported wallet type')
        return null
      }
    } catch (error: unknown) {
      console.error('❌ Falha na conexão da carteira:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Falha na conexão da carteira: ${errorMessage}`);
      return null
    }
  }

  async function getProfile(): Promise<any> {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return null

      const response = await fetch('http://localhost:8002/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get profile')
      }

      const data = await response.json()
      return data
    } catch (error: unknown) {
      console.error('Failed to get profile:', error)
      return null
    }
  }

  async function login(address: string): Promise<boolean> {
    try {
      console.log('🔐 Iniciando processo de login para:', address)

      try {
        // Verificar se o backend está disponível antes de tentar login
        const healthCheck = await fetch('http://localhost:8002/health')
          .then(res => res.ok)
          .catch(() => false)
        
        if (!healthCheck) {
          console.log('⚠️ Backend não está disponível. Continuando apenas com a carteira conectada.')
          setIsBackendAvailable(false)
          return true // Retorna true mesmo sem backend para permitir uso da aplicação
        }
        
        setIsBackendAvailable(true)
        
        // 1. Request nonce from backend
        console.log('Solicitando nonce do backend em http://localhost:8002/api/auth/nonce')
        const nonceResponse = await fetch('http://localhost:8002/api/auth/nonce', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address }),
        })
        
        console.log('Resposta do nonce recebida:', nonceResponse.status, nonceResponse.statusText)
    
        if (!nonceResponse.ok) {
          const errorData = await nonceResponse.json().catch(() => ({
            error: 'Não foi possível ler o erro do servidor'
          }));
          console.error('Erro na resposta do nonce:', errorData)
          throw new Error(`Falha ao obter nonce: ${nonceResponse.status} ${nonceResponse.statusText} ${errorData.error || ''}`)
        }
    
        const responseData = await nonceResponse.json()
        console.log('Dados da resposta do nonce:', responseData)
        
        if (!responseData.data || !responseData.data.message) {
          throw new Error('Formato de resposta inválido do servidor: message não encontrada')
        }
        
        const { data } = responseData
        const { message } = data
    
        console.log('📝 Assinando mensagem:', message)
    
        // 2. Sign message with wallet
        if (!window.ethereum) {
          throw new Error('Carteira não está disponível para assinar a mensagem')
        }
        
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        })
    
        console.log('✍️ Mensagem assinada')
    
        // 3. Send signature to backend for verification
        console.log('Enviando assinatura para verificação...')
        const loginResponse = await fetch('http://localhost:8002/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address,
            signature,
            message,
          }),
        })
        
        console.log('Resposta de login recebida:', loginResponse.status, loginResponse.statusText)
    
        const loginData = await loginResponse.json()
        console.log('Dados da resposta de login:', loginData)
    
        if (loginData.success) {
          // Store token and address
          localStorage.setItem('auth_token', loginData.token)
          localStorage.setItem('wallet_address', address)
          
          // Update context state
          setUser({ address })
          setIsAuthenticated(true)
          
          console.log('✅ Login bem-sucedido!')
          return true
        } else {
          throw new Error(loginData.error || 'Falha no login')
        }
      } catch (fetchError: any) {
        console.error('Erro de conexão com o backend:', fetchError)
        
        // Verificar se é um erro de rede
        if (fetchError.message && fetchError.message.includes('Failed to fetch')) {
          console.log('⚠️ Backend não está disponível. Continuando apenas com a carteira conectada.')
          setIsBackendAvailable(false)
          return true // Retorna true mesmo sem backend para permitir uso da aplicação
        }
        
        throw new Error(`Erro de conexão com o backend: ${fetchError.message || 'Servidor indisponível'}`)
      }
    } catch (error: any) {
      console.error('❌ Falha no login:', error)
      alert(`Falha no login: ${error.message || 'Erro desconhecido'}. Você pode continuar usando o aplicativo com funcionalidades limitadas.`)
      return false
    }
  }

  async function logout() {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Call backend logout if token exists
      if (token) {
        try {
          await fetch('http://localhost:8002/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        } catch (error: unknown) {
          console.error('Error during logout:', error)
        }
      }
      
      // Clear local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('wallet_address')
      
      // Update context state
      setUser(null)
      setIsAuthenticated(false)
      
      console.log('✅ Logout successful')
      
    } catch (error: unknown) {
      console.error('Logout error:', error)
      // Force logout anyway
      localStorage.clear()
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
    connectWallet,
    login,
    logout,
    isWalletModalOpen,
    setIsWalletModalOpen,
    connectWithWallet
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={async (walletType: string): Promise<void> => {
          const address = await connectWithWallet(walletType);
          if (address) {
            try {
              // Tentamos fazer login com o backend, mas não bloqueamos o uso do app
              await login(address);
            } catch (error) {
              console.error('Erro ao fazer login com o backend:', error);
              // Continuamos mesmo com erro no backend
            }
          }
          setIsWalletModalOpen(false);
          return;
        }}
      />
    </AuthContext.Provider>
  )
}
