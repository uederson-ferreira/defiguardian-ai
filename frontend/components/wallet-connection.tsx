// components/wallet-connection.tsx
// COMPONENTE DE CONEXÃO METAMASK

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react'
import { ethers } from 'ethers'

interface WalletState {
  address: string | null
  balance: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

export function WalletConnection() {
  const { data: session, update } = useSession()
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null
  })
  const [copied, setCopied] = useState(false)

  // Verificar se MetaMask está instalado
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask
  }

  // Conectar MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setWallet(prev => ({
        ...prev,
        error: 'MetaMask não está instalado! Instale em metamask.io'
      }))
      return
    }

    if (!window.ethereum) {
      setWallet(prev => ({
        ...prev,
        error: 'Ethereum provider não encontrado'
      }))
      return
    }

    try {
      setWallet(prev => ({ ...prev, isConnecting: true, error: null }))

      // Solicitar conexão
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts.length === 0) {
        throw new Error('Nenhuma conta selecionada')
      }

      const address = accounts[0]
      
      // Criar provider
      const provider = new ethers.BrowserProvider(window.ethereum)
      const balance = await provider.getBalance(address)
      const network = await provider.getNetwork()

      // Verificar se está na rede correta (Avalanche Fuji)
      const expectedChainId = 43113 // Avalanche Fuji
      if (Number(network.chainId) !== expectedChainId) {
        // Tentar trocar para Avalanche Fuji
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Rede não adicionada, adicionar Avalanche Fuji
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${expectedChainId.toString(16)}`,
                chainName: 'Avalanche Fuji Testnet',
                nativeCurrency: {
                  name: 'AVAX',
                  symbol: 'AVAX',
                  decimals: 18
                },
                rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
                blockExplorerUrls: ['https://testnet.snowtrace.io/']
              }]
            })
          } else {
            throw switchError
          }
        }
      }

      // Atualizar estado
      setWallet({
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
        isConnected: true,
        isConnecting: false,
        error: null
      })

      // Salvar endereço da wallet no Supabase via API
      await saveWalletToDatabase(address)

      console.log('✅ Wallet conectada:', address)

    } catch (error: any) {
      console.error('❌ Erro ao conectar wallet:', error)
      setWallet(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Erro ao conectar wallet'
      }))
    }
  }

  // Salvar endereço da wallet no banco
  const saveWalletToDatabase = async (walletAddress: string) => {
    try {
      const response = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress })
      })

      if (response.ok) {
        console.log('✅ Endereço da wallet salvo no banco')
        // Atualizar sessão para incluir wallet
        await update()
      }
    } catch (error) {
      console.error('❌ Erro ao salvar wallet no banco:', error)
    }
  }

  // Desconectar wallet
  const disconnectWallet = () => {
    setWallet({
      address: null,
      balance: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null
    })
  }

  // Copiar endereço
  const copyAddress = async () => {
    if (wallet.address) {
      await navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Formatar endereço
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Verificar conexão ao carregar
  useEffect(() => {
    if (isMetaMaskInstalled() && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connectWallet()
          }
        })
        .catch(console.error)
    }
  }, [])

  if (!session) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Faça login primeiro para conectar sua wallet.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="backdrop-blur-lg bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          MetaMask Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isMetaMaskInstalled() ? (
          <div className="text-center">
            <p className="text-slate-300 mb-4">MetaMask não detectado</p>
            <Button 
              onClick={() => window.open('https://metamask.io', '_blank')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Instalar MetaMask
            </Button>
          </div>
        ) : !wallet.isConnected ? (
          <div className="text-center">
            <p className="text-slate-300 mb-4">Conecte sua wallet para acessar recursos DeFi</p>
            <Button 
              onClick={connectWallet}
              disabled={wallet.isConnecting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {wallet.isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="mr-2 h-4 w-4" />
              )}
              {wallet.isConnecting ? 'Conectando...' : 'Conectar MetaMask'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Endereço da Wallet */}
            <div>
              <label className="text-sm text-slate-400">Endereço da Wallet</label>
              <div className="flex items-center mt-1 p-2 bg-black/20 rounded border border-white/10">
                <span className="text-white flex-1 font-mono text-sm">
                  {formatAddress(wallet.address!)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyAddress}
                  className="text-slate-400 hover:text-white"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Saldo */}
            <div>
              <label className="text-sm text-slate-400">Saldo AVAX</label>
              <div className="text-white font-mono text-lg">
                {parseFloat(wallet.balance!).toFixed(4)} AVAX
              </div>
            </div>

            {/* Rede */}
            <div>
              <label className="text-sm text-slate-400">Rede</label>
              <div className="flex items-center mt-1">
                <Badge variant={wallet.chainId === 43113 ? 'default' : 'destructive'}>
                  {wallet.chainId === 43113 ? 'Avalanche Fuji ✅' : `Chain ID: ${wallet.chainId} ❌`}
                </Badge>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                onClick={() => window.open(`https://testnet.snowtrace.io/address/${wallet.address}`, '_blank')}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver no Explorer
              </Button>
              <Button
                onClick={disconnectWallet}
                variant="outline"
                size="sm"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Desconectar
              </Button>
            </div>
          </div>
        )}

        {/* Erro */}
        {wallet.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{wallet.error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}