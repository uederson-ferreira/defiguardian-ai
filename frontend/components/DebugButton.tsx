/**
 * MÓDULO: Botão de Debug
 * LOCALIZAÇÃO: components/DebugButton.tsx
 * DESCRIÇÃO: Botão temporário para debugar problemas de transação
 */

"use client";

import { useTransactionDebug } from '@/hooks/useTransactionDebug';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bug, 
  TestTube, 
  CheckCircle, 
  Loader2,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

export function DebugButton() {
  const {
    balance,
    isConfirming,
    isSuccess,
    isError,
    txError,
    lastTxHash,
    testSimpleTransaction,
    checkContract,
  } = useTransactionDebug();

  return (
    <Card className="bg-slate-800/50 border-slate-700 mt-6">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Bug className="h-4 w-4 text-red-400" />
          Debug Transações (Temporário)
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status do Saldo */}
        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <span className="text-sm text-slate-300">AVAX Balance:</span>
          </div>
          <div className="text-right">
            <div className="text-white font-medium">
              {balance ? `${parseFloat(balance.formatted).toFixed(4)} AVAX` : 'Carregando...'}
            </div>
            <div className="text-xs text-slate-400">
              {balance && parseFloat(balance.formatted) < 0.01 && (
                <span className="text-red-400">⚠️ Low for gas</span>
              )}
            </div>
          </div>
        </div>

        {/* Last Transaction Status */}
        {lastTxHash && (
          <div className="space-y-2">
            <div className="text-sm text-slate-300">Last Transaction:</div>
            <div className="p-3 bg-slate-700/30 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Hash:</span>
                <a 
                  href={`https://testnet.snowtrace.io/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                >
                  {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}
                </a>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Status:</span>
                <Badge className={
                  isConfirming ? 'bg-yellow-500/20 text-yellow-400' :
                  isSuccess ? 'bg-green-500/20 text-green-400' :
                  isError ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }>
                  {isConfirming ? 'Confirmando...' :
                   isSuccess ? 'Sucesso' :
                   isError ? 'Failed' :
                   'Pendente'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Error */}
        {isError && txError && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400 text-xs">
              <strong>Error:</strong> {txError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Botões de Debug */}
        <div className="space-y-2">
          <Button
            onClick={checkContract}
            variant="outline"
            className="w-full bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            1. Verificar se Contrato Existe
          </Button>
          
          <Button
            onClick={testSimpleTransaction}
            disabled={isConfirming}
            className="w-full bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                2. Testar Transação Simples
              </>
            )}
          </Button>
        </div>

        {/* Instruções */}
        <div className="text-xs text-slate-400 space-y-1">
          <div>📝 <strong>Como usar:</strong></div>
          <div>1. Verifique se tem AVAX suficiente (min 0.01)</div>
          <div>2. Clique &quot;Verificar Contrato&quot; primeiro</div>
          <div>3. Se OK, teste transação simples</div>
          <div>4. Veja logs no console (F12)</div>
        </div>

        {/* Link para Faucet */}
        {balance && parseFloat(balance.formatted) < 0.01 && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <DollarSign className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-400 text-xs">
              Low balance! Get free AVAX at{' '}
              <a 
                href="https://faucet.avax.network/" 
                target="_blank"
                className="text-yellow-300 underline hover:text-yellow-200"
              >
                Official Faucet
              </a>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}