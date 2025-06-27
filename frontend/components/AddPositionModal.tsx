/**
 * MÓDULO: Modal para Adicionar Posição
 * LOCALIZAÇÃO: components/AddPositionModal.tsx
 * DESCRIÇÃO: Modal para cadastrar riscos/posições DeFi
 */

"use client";

import { useState } from 'react';
import { useContracts } from '@/hooks/useContracts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Loader2, TrendingUp, DollarSign, Shield } from 'lucide-react';

// Protocolos DeFi populares (endereços de exemplo - ajuste conforme necessário)
const PROTOCOLS = [
  {
    name: 'Uniswap V3',
    address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    description: 'DEX líquida',
    risk: 'Baixo'
  },
  {
    name: 'Aave',
    address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    description: 'Lending protocol',
    risk: 'Médio'
  },
  {
    name: 'Compound',
    address: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
    description: 'Lending protocol',
    risk: 'Médio'
  },
  {
    name: 'Curve',
    address: '0xD51a44d3FaE010294C616388b506AcdA1bfAAE46',
    description: 'Stablecoin DEX',
    risk: 'Baixo'
  }
];

// Tokens comuns
const TOKENS = [
  {
    name: 'USDC',
    address: '0xA0b86a33E6417c543439Ac4c4B9A13F1b8a59C3b',
    symbol: 'USDC'
  },
  {
    name: 'USDT',
    address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    symbol: 'USDT'
  },
  {
    name: 'AVAX',
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'AVAX'
  },
  {
    name: 'WETH',
    address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    symbol: 'WETH'
  }
];

interface AddPositionModalProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode; // 🔧 FIX: Adicionado children
}

export function AddPositionModal({ trigger, children }: AddPositionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [selectedProtocol, setSelectedProtocol] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  const { addPosition, isConnected } = useContracts();

  const handleSubmit = async () => {
    if (!selectedProtocol || !selectedToken || !amount) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Converter amount para wei (assumindo 18 decimais)
      const amountWei = (parseFloat(amount) * 1e18).toString();
      
      await addPosition(selectedProtocol, selectedToken, amountWei);
      
      // Reset form
      setSelectedProtocol('');
      setSelectedToken('');
      setAmount('');
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar posição:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProtocolData = PROTOCOLS.find(p => p.address === selectedProtocol);
  const selectedTokenData = TOKENS.find(t => t.address === selectedToken);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || trigger || (
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Riscos
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            Cadastrar Nova Posição DeFi
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Adicione uma posição para análise de risco do seu portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isConnected && (
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Conecte sua carteira para cadastrar posições
                </p>
              </CardContent>
            </Card>
          )}

          {/* Protocolo */}
          <div className="space-y-2">
            <Label htmlFor="protocol" className="text-sm font-medium">
              Protocolo DeFi
            </Label>
            <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Selecione um protocolo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {PROTOCOLS.map((protocol) => (
                  <SelectItem 
                    key={protocol.address} 
                    value={protocol.address}
                    className="text-white hover:bg-slate-700"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{protocol.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        protocol.risk === 'Baixo' ? 'bg-green-500/20 text-green-400' :
                        protocol.risk === 'Médio' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {protocol.risk}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProtocolData && (
              <p className="text-xs text-slate-400">
                {selectedProtocolData.description}
              </p>
            )}
          </div>

          {/* Token */}
          <div className="space-y-2">
            <Label htmlFor="token" className="text-sm font-medium">
              Token
            </Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Selecione um token" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {TOKENS.map((token) => (
                  <SelectItem 
                    key={token.address} 
                    value={token.address}
                    className="text-white hover:bg-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-600 px-2 py-1 rounded">
                        {token.symbol}
                      </span>
                      <span>{token.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Quantidade
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
              {selectedTokenData && (
                <span className="absolute right-3 top-3 text-sm text-slate-400">
                  {selectedTokenData.symbol}
                </span>
              )}
            </div>
          </div>

          {/* Preview */}
          {selectedProtocolData && selectedTokenData && amount && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-4 space-y-2">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  Preview da Posição
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Protocolo:</span>
                    <span className="text-white">{selectedProtocolData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Token:</span>
                    <span className="text-white">{selectedTokenData.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantidade:</span>
                    <span className="text-white">{amount} {selectedTokenData.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nível de Risco:</span>
                    <span className={`${
                      selectedProtocolData.risk === 'Baixo' ? 'text-green-400' :
                      selectedProtocolData.risk === 'Médio' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {selectedProtocolData.risk}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isConnected || !selectedProtocol || !selectedToken || !amount || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Posição
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}