/**
 * MÓDULO: Hook otimizado para contratos DeFi
 * LOCALIZAÇÃO: hooks/useDefiContracts.ts
 * DESCRIÇÃO: Hook sem auto-execução e com loading controlado
 */

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';

interface PortfolioData {
  totalValue: number;
  riskScore: number;
  assets: Array<{
    name: string;
    value: number;
    risk: number;
  }>;
}

interface Alert {
  id: string;
  threshold: number;
  active: boolean;
}

interface InsurancePolicy {
  id: string;
  asset: string;
  coverage: string;
  premium: number;
}

interface MarketRisk {
  overall: number;
  volatility: number;
  liquidity: number;
}

export function useDefiContracts() {
  const { address, isConnected } = useAccount();
  
  // Estados
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [marketRisk, setMarketRisk] = useState<MarketRisk | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransactionPending, setIsTransactionPending] = useState(false);

  // 🔧 FIX: Não executar automaticamente ao conectar wallet
  // Removida a execução automática no useEffect

  const loadPortfolioData = useCallback(async () => {
    if (!isConnected || !address) {
      console.log('❌ Wallet não conectada, não carregando dados');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Carregando dados do portfolio para:', address);
      
      // Simular dados (substituir por chamadas reais)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPortfolioData({
        totalValue: 15000,
        riskScore: 65,
        assets: [
          { name: 'USDC', value: 5000, risk: 10 },
          { name: 'ETH', value: 8000, risk: 75 },
          { name: 'AVAX', value: 2000, risk: 80 },
        ]
      });

      setMarketRisk({
        overall: 60,
        volatility: 70,
        liquidity: 85
      });

      console.log('✅ Dados do portfolio carregados');
    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Error loading portfolio data');
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  const createAlert = useCallback(async (threshold: number) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsTransactionPending(true);
      
      console.log('🚨 Criando alerta com threshold:', threshold);
      
      // Simular transação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newAlert: Alert = {
        id: Date.now().toString(),
        threshold,
        active: true
      };
      
      setAlerts(prev => [...prev, newAlert]);
      
      console.log('✅ Alerta criado:', newAlert);
    } catch (err) {
      console.error('❌ Error creating alert:', err);
      throw err;
    } finally {
      setIsTransactionPending(false);
    }
  }, [isConnected]);

  const createInsurancePolicy = useCallback(async (asset: string, coverage: string) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsTransactionPending(true);
      
      console.log('🛡️ Criando política de seguro para:', asset);
      
      // Simular transação
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newPolicy: InsurancePolicy = {
        id: Date.now().toString(),
        asset,
        coverage,
        premium: 100
      };
      
      setInsurancePolicies(prev => [...prev, newPolicy]);
      
      console.log('✅ Política criada:', newPolicy);
    } catch (err) {
      console.error('❌ Error creating policy:', err);
      throw err;
    } finally {
      setIsTransactionPending(false);
    }
  }, [isConnected]);

  return {
    portfolioData,
    alerts,
    insurancePolicies,
    marketRisk,
    loading,
    error,
    createAlert,
    createInsurancePolicy,
    isTransactionPending,
    loadPortfolioData, // 🔧 FIX: Expor função para carregamento manual
  };
}