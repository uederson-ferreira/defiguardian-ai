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

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession()
  }, [])

  async function checkExistingSession() {
    try {
      const token = localStorage.getItem('auth_token')
      const address = localStorage.getItem('wallet_address')

      if (token && address) {
        // Verify token with backend
        const response = await fetch('http://localhost:8002/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setUser({ address })
          setIsAuthenticated(true)
          console.log('✅ Session restored for:', address)
        } else {
          // Invalid token, clear storage
          localStorage.removeItem('auth_token')
          localStorage.removeItem('wallet_address')
        }
      }
    } catch (error) {
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
    } catch (error) {
      console.error('❌ Wallet connection failed:', error)
      throw error
    }
  }

  async function connectWithWallet(walletType: string): Promise<string | null> {
    try {
      console.log(`🔄 Connecting with ${walletType}...`)
      
      // Handle different wallet types
      if (walletType === 'metamask') {
        if (!window.ethereum?.isMetaMask) {
          alert('MetaMask not found! Please install MetaMask to continue.')
          return null
        }
        
        console.log('🦊 Requesting MetaMask connection...')
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })

        if (accounts.length === 0) {
          throw new Error('No accounts found')
        }

        const address = accounts[0]
        console.log('✅ Wallet connected:', address)
        return address
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
        return address
      }
      else {
        alert('Unsupported wallet type')
        return null
      }
    } catch (error) {
      console.error('❌ Wallet connection failed:', error)
      throw error
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
    } catch (error) {
      console.error('Failed to get profile:', error)
      return null
    }
  }

  async function login(address: string): Promise<boolean> {
    try {
      console.log('🔐 Starting login process for:', address)

      // 1. Request nonce from backend
      const nonceResponse = await fetch('http://localhost:8002/api/auth/nonce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      })

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce')
      }

      const { data } = await nonceResponse.json()
      const { message } = data

      console.log('📝 Signing message:', message)

      // 2. Sign message with MetaMask
      const signature = await window.ethereum?.request({
        method: 'personal_sign',
        params: [message, address],
      })

      console.log('✍️ Message signed')

      // 3. Send signature to backend for verification
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

      const loginData = await loginResponse.json()

      if (loginData.success) {
        // Store token and address
        localStorage.setItem('auth_token', loginData.token)
        localStorage.setItem('wallet_address', address)
        
        // Update context state
        setUser({ address })
        setIsAuthenticated(true)
        
        console.log('✅ Login successful!')
        return true
      } else {
        throw new Error(loginData.error || 'Login failed')
      }

    } catch (error) {
      console.error('❌ Login failed:', error)
      alert('Login failed. Please try again.')
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
        } catch (error) {
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
      
    } catch (error) {
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
            await login(address);
          }
          return;
        }}
      />
    </AuthContext.Provider>
  )
}
