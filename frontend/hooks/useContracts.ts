/**
 * MÓDULO: Hook com ABIs Reais - VERSÃO FINAL CORRIGIDA
 * LOCALIZAÇÃO: hooks/useContracts.ts
 * DESCRIÇÃO: Hook que usa os ABIs reais dos contratos deployados
 */

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { CONTRACT_ADDRESSES } from '@/lib/web3-config';

// ABIs REAIS baseados nos seus contratos deployados
const PORTFOLIO_ANALYZER_ABI = [
  {
    name: 'calculatePortfolioRisk',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'getPortfolioAnalysis',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'totalValue', type: 'uint256' },
          { name: 'overallRisk', type: 'uint256' },
          { name: 'protocolCount', type: 'uint256' },
          { name: 'diversificationScore', type: 'uint256' }
        ]
      }
    ]
  },
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

const RISK_ORACLE_ABI = [
  {
    name: 'getAggregatedRisk',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_protocol', type: 'address' }],
    outputs: [
      { name: 'volatilityRisk', type: 'uint256' },
      { name: 'liquidityRisk', type: 'uint256' },
      { name: 'smartContractRisk', type: 'uint256' },
      { name: 'governanceRisk', type: 'uint256' },
      { name: 'externalRisk', type: 'uint256' },
      { name: 'overallRisk', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' }
    ]
  }
] as const;

const ALERT_SYSTEM_ABI = [
  {
    name: 'createSubscription',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_alertType', type: 'uint8' },
      { name: '_protocol', type: 'address' },
      { name: '_threshold', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'getUserActiveAlerts',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'tuple[]' }]
  }
] as const;

const RISK_INSURANCE_ABI = [
  {
    name: 'createPolicy',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_coverageAmount', type: 'uint256' },
      { name: '_riskThreshold', type: 'uint256' },
      { name: '_duration', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'getUserPolicies',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  }
] as const;

export function useContracts() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // 🔍 LEITURA: Portfolio Risk Score
  const {
    data: portfolioRisk,
    isLoading: isLoadingRisk,
    refetch: refetchRisk
  } = useReadContract({
    address: CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER as `0x${string}`,
    abi: PORTFOLIO_ANALYZER_ABI,
    functionName: 'calculatePortfolioRisk',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    }
  });

  // 🔍 LEITURA: Portfolio Analysis
  const {
    data: portfolioAnalysis,
    isLoading: isLoadingAnalysis,
    refetch: refetchAnalysis
  } = useReadContract({
    address: CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER as `0x${string}`,
    abi: PORTFOLIO_ANALYZER_ABI,
    functionName: 'getPortfolioAnalysis',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    }
  });

  // 🔍 LEITURA: Active Alerts
  const {
    data: activeAlerts,
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts
  } = useReadContract({
    address: CONTRACT_ADDRESSES.ALERT_SYSTEM as `0x${string}`,
    abi: ALERT_SYSTEM_ABI,
    functionName: 'getUserActiveAlerts',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    }
  });

  // ✍️ ESCRITA: Adicionar Posição
  const addPosition = async (protocolAddress: string, tokenAddress: string, amount: string) => {
    if (!address) {
      toast.error('Conecte sua carteira primeiro');
      return;
    }

    try {
      console.log('📝 REAL: Adicionando posição...', {
        protocol: protocolAddress,
        token: tokenAddress,
        amount,
        user: address
      });

      toast.loading('Adicionando posição...');
      
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER as `0x${string}`,
        abi: PORTFOLIO_ANALYZER_ABI,
        functionName: 'addPosition',
        args: [
          protocolAddress as `0x${string}`, 
          tokenAddress as `0x${string}`, 
          BigInt(amount)
        ]
      });

      console.log('✅ REAL: Posição adicionada:', txHash);
      toast.success('Posição adicionada com sucesso!');
      
      setTimeout(() => {
        refetchRisk();
        refetchAnalysis();
      }, 2000);
      
      return txHash;
    } catch (error: any) {
      console.error('❌ REAL: Erro ao adicionar posição:', error);
      
      let errorMessage = 'Erro ao adicionar posição';
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Saldo AVAX insuficiente para gas';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = 'Transação rejeitada pelo contrato';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transação cancelada pelo usuário';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // ✍️ ESCRITA: Criar Alerta - CORRIGINDO TIPO UINT8
  const createAlert = async (alertType: number, threshold: number) => {
    if (!address) {
      toast.error('Conecte sua carteira primeiro');
      return;
    }

    try {
      console.log('🚨 REAL: Criando alerta...', {
        user: address,
        alertType,
        threshold
      });

      toast.loading('Criando alerta...');
      
      // Endereço zero para alertas genéricos
      const protocolAddress = '0x0000000000000000000000000000000000000000';
      
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ALERT_SYSTEM as `0x${string}`,
        abi: ALERT_SYSTEM_ABI,
        functionName: 'createSubscription',
        args: [
          alertType, // 🔧 FIX: uint8 deve permanecer como number, não BigInt
          protocolAddress as `0x${string}`, 
          BigInt(threshold) // threshold como uint256 vira BigInt
        ]
      });

      console.log('✅ REAL: Alerta criado:', txHash);
      toast.success('Alerta criado com sucesso!');
      
      setTimeout(() => {
        refetchAlerts();
      }, 2000);
      
      return txHash;
    } catch (error: any) {
      console.error('❌ REAL: Erro ao criar alerta:', error);
      
      let errorMessage = 'Erro ao criar alerta';
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Saldo AVAX insuficiente para gas';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = 'Transação rejeitada pelo contrato';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transação cancelada pelo usuário';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // ✍️ ESCRITA: Criar Seguro
  const createInsurancePolicy = async (protocolAddress: string, coverageAmount: string) => {
    if (!address) {
      toast.error('Conecte sua carteira primeiro');
      return;
    }

    try {
      console.log('🛡️ REAL: Criando seguro...', {
        holder: address,
        protocolAddress,
        coverageAmount
      });

      toast.loading('Criando apólice de seguro...');
      
      // Converter coverage para Wei se necessário
      const coverage = BigInt(coverageAmount);
      const premium = coverage / BigInt(20); // 5%
      
      // Valores padrão
      const riskThreshold = 80;
      const duration = 30 * 24 * 60 * 60; // 30 dias
      
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.RISK_INSURANCE as `0x${string}`,
        abi: RISK_INSURANCE_ABI,
        functionName: 'createPolicy',
        args: [coverage, BigInt(riskThreshold), BigInt(duration)],
        value: premium
      });

      console.log('✅ REAL: Seguro criado:', txHash);
      toast.success('Seguro criado com sucesso!');
      
      return txHash;
    } catch (error: any) {
      console.error('❌ REAL: Erro ao criar seguro:', error);
      
      let errorMessage = 'Erro ao criar seguro';
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Saldo insuficiente para premium + gas';
      } else if (error.message?.includes('execution reverted')) {
        errorMessage = 'Transação rejeitada pelo contrato';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // 🔧 ALIAS PARA COMPATIBILIDADE COM CreateInsuranceModal
  const createInsurance = createInsurancePolicy;

  // 📈 FUNÇÃO: Analisar Portfolio
  const analyzePortfolio = () => {
    if (!isConnected) {
      toast.error('Conecte sua carteira para analisar portfolio');
      return;
    }

    console.log('📊 REAL: Atualizando análise de portfolio...');
    toast.loading('Analisando portfolio...');
    
    Promise.all([refetchRisk(), refetchAnalysis(), refetchAlerts()])
      .then(() => {
        console.log('✅ REAL: Análise atualizada');
        toast.success('Análise de portfolio atualizada!');
      })
      .catch((error) => {
        console.error('❌ REAL: Erro na análise:', error);
        toast.error('Erro ao analisar portfolio');
      });
  };

  // 📊 DADOS PROCESSADOS - CONVERSÕES BIGINT -> NUMBER SEGURAS
  const portfolioData = {
    // Risk Score do contrato - CONVERSÃO SEGURA
    riskScore: portfolioRisk ? Number(portfolioRisk.toString()) : 0,
    
    // Portfolio Analysis (se disponível) - CONVERSÕES SEGURAS  
    totalValue: portfolioAnalysis?.totalValue ? Number(portfolioAnalysis.totalValue.toString()) : 0,
    protocolCount: portfolioAnalysis?.protocolCount ? Number(portfolioAnalysis.protocolCount.toString()) : 0,
    diversificationScore: portfolioAnalysis?.diversificationScore ? Number(portfolioAnalysis.diversificationScore.toString()) : 0,
    
    // Active Alerts
    alertsCount: activeAlerts ? activeAlerts.length : 0,
  };

  const isLoading = isLoadingRisk || isLoadingAnalysis || isLoadingAlerts;

  // 🔍 DEBUG: Logs detalhados
  console.log('🔍 REAL DEBUG:', {
    address,
    isConnected,
    portfolioRisk: portfolioRisk?.toString(),
    portfolioAnalysis,
    activeAlerts,
    portfolioData,
    isLoading
  });

  return {
    // Dados
    portfolioData,
    isLoading,
    isConnected,
    
    // Dados brutos para debug
    raw: {
      portfolioRisk,
      portfolioAnalysis,
      activeAlerts
    },
    
    // Funções de leitura
    analyzePortfolio,
    refetchRisk,
    refetchAnalysis,
    refetchAlerts,
    
    // Funções de escrita
    addPosition,
    createAlert,
    createInsurancePolicy,
    createInsurance, // 🔧 ALIAS PARA COMPATIBILIDADE
  };
}
