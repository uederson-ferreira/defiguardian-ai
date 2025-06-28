/**
 * MÓDULO: Debug de Transações
 * LOCALIZAÇÃO: hooks/useTransactionDebug.ts
 * DESCRIÇÃO: Hook para debugar transações que falham
 */

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { toast } from 'sonner';
import { CONTRACT_ADDRESSES } from '@/lib/web3-config';

// ABI mínima para teste
const MINIMAL_ABI = [
  {
    name: 'addPosition',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_protocol', type: 'address' },
      { name: '_token', type: 'address' },
      { name: '_amount', type: 'uint256' }
    ],
    outputs: []
  }
] as const;

export function useTransactionDebug() {
  const { address } = useAccount();
  const [lastTxHash, setLastTxHash] = useState<string>('');
  const { writeContractAsync } = useWriteContract();

  // Verificar saldo
  const { data: balance } = useBalance({
    address: address,
  });

  // Monitorar transação
  const { isLoading: isConfirming, isSuccess, isError, error: txError } = 
    useWaitForTransactionReceipt({
      hash: lastTxHash as `0x${string}`,
    });

  // Função de teste simples
  const testSimpleTransaction = async () => {
    if (!address) {
      toast.error('Connect your wallet first');
      return;
    }

    try {
      console.log('🧪 TESTE: Iniciando transação simples...');
      console.log('💰 Saldo AVAX:', balance?.formatted);
      console.log('📍 Endereço:', address);
      console.log('🏗️ Contrato:', CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER);

      // Valores de teste mínimos
      const testProtocol = '0x1F98431c8aD98523631AE4a59f267346ea31F984'; // Uniswap
      const testToken = '0x0000000000000000000000000000000000000000'; // ETH
      const testAmount = '1000000000000000'; // 0.001 ETH

      toast.loading('🧪 Testando transação...');

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER as `0x${string}`,
        abi: MINIMAL_ABI,
        functionName: 'addPosition',
        args: [
          testProtocol as `0x${string}`,
          testToken as `0x${string}`,
          BigInt(testAmount)
        ],
        // Especificar gas explicitamente
        gas: BigInt(100000), // 100k gas
      });

      setLastTxHash(txHash);

      console.log('✅ TESTE: Transação enviada:', txHash);
      toast.success(`Transação enviada: ${txHash.slice(0, 10)}...`);

      return txHash;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ TEST: Detailed error:', error);
      
      // Análise detalhada do erro
      let errorMessage = 'Transaction error';
      
      if (error.message) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient AVAX balance for gas';
        } else if (error.message.includes('execution reverted')) {
          errorMessage = 'Transaction rejected by contract';
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction cancelled by user';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(`Erro: ${errorMessage}`);
      return null;
    }
  };

  // Verificar contrato existe
  const checkContract = async () => {
    try {
      console.log('🔍 VERIFICANDO: Contrato existe...');
      
      const response = await fetch('https://api.avax-test.network/ext/bc/C/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getCode',
          params: [CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER, 'latest']
        })
      });

      const data = await response.json();
      const code = data.result;

      console.log('🏗️ Código do contrato:', code);

      if (code === '0x') {
        console.error('❌ CONTRACT DOES NOT EXIST!');
        toast.error('Contract not found at specified address');
        return false;
      } else {
        console.log('✅ Contract exists!');
        toast.success('Contract found');
        return true;
      }

    } catch (error) {
      console.error('❌ Error verifying contract:', error);
      toast.error('Error verifying contract');
      return false;
    }
  };

  return {
    // Estados
    balance,
    isConfirming,
    isSuccess,
    isError,
    txError,
    lastTxHash,
    
    // Funções
    testSimpleTransaction,
    checkContract,
  };
}