// components/wallet/WalletConnect.tsx
// ✅ COMPONENTE DE CONEXÃO DE CARTEIRAS - IGUAL À IMAGEM

'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertTriangle, 
  Wallet, 
  Chrome, 
  Smartphone,
  Shield,
  CheckCircle,
  ExternalLink
} from 'lucide-react'

interface WalletConnectProps {
  onConnect?: (address: string) => void
  onDisconnect?: () => void
}

export function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async (connector: any) => {
    try {
      setIsConnecting(true)
      await connect({ connector })
      if (address && onConnect) {
        onConnect(address)
      }
    } catch (error) {
      console.error('Erro ao conectar carteira:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    if (onDisconnect) {
      onDisconnect()
    }
  }

  const getConnectorIcon = (connectorId: string) => {
    switch (connectorId) {
      case 'injected':
        return <Chrome className="h-6 w-6" />
      case 'metaMask':
        return <Wallet className="h-6 w-6" />
      case 'walletConnect':
        return <Smartphone className="h-6 w-6" />
      default:
        return <Wallet className="h-6 w-6" />
    }
  }

  const getConnectorName = (connectorId: string) => {
    switch (connectorId) {
      case 'injected':
        return 'Conectar Injected'
      case 'metaMask':
        return 'Conectar MetaMask'
      case 'walletConnect':
        return 'Conectar WalletConnect'
      default:
        return `Conectar ${connectorId}`
    }
  }

  // Se já estiver conectado, mostrar informações da carteira
  if (isConnected && address) {
    return (
      <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
            <CheckCircle className="h-8 w-8" />
          </div>
          <CardTitle className="text-green-800 text-xl">
            Carteira Conectada
          </CardTitle>
          <p className="text-green-600 text-sm">
            Sua carteira Web3 está conectada com sucesso
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-white/70 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Endereço</p>
              <p className="font-mono text-sm break-all">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
            
            {chain && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Rede</p>
                <p className="text-sm font-medium">{chain.name}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="flex-1"
            >
              Desconectar
            </Button>
            
            <Button
              onClick={() => window.open(`${chain?.blockExplorers?.default.url}/address/${address}`, '_blank')}
              variant="outline"
              size="icon"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Tela de conexão de carteiras
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-slate-700 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 text-yellow-500 mb-4">
            <div className="relative">
              <AlertTriangle className="h-12 w-12" />
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"></div>
            </div>
          </div>
          <CardTitle className="text-white text-2xl font-bold mb-2">
            Carteira Necessária
          </CardTitle>
          <p className="text-slate-300 text-sm">
            Conecte sua carteira para jogar
          </p>
        </CardHeader>
        
        <CardContent className="pb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
            <h3 className="text-white text-xl font-semibold mb-4 text-center">
              Conectar Carteira
            </h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              Conecte sua carteira para jogar. Suporte para múltiplas carteiras.
            </p>
            
            <div className="space-y-3">
              {connectors.map((connector) => (
                <Button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={isPending || isConnecting}
                  className="w-full h-14 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    {isPending ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                      getConnectorIcon(connector.id)
                    )}
                    <span>{getConnectorName(connector.id)}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Info sobre carteiras suportadas */}
          <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700/50">
            <h4 className="text-blue-300 font-semibold mb-3 text-center">
              Carteiras suportadas:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-blue-200">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                MetaMask, Coinbase, WalletConnect
              </div>
              <div className="flex items-center gap-2 text-blue-200">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                Rainbow, Trust Wallet, Phantom
              </div>
              <div className="flex items-center gap-2 text-blue-200">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                Injected wallets e extensões
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
              <Shield className="h-3 w-3" />
              <span>Powered by Wagmi - Conexão segura com carteiras Web3</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}