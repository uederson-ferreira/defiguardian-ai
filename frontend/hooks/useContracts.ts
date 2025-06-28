/**
 * MÓDULO: Hook com ABIs Reais - VERSÃO FINAL CORRIGIDA
 * LOCALIZAÇÃO: hooks/useContracts.ts
 * DESCRIÇÃO: Hook que usa os ABIs reais dos contratos deployados
 */

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { CONTRACT_ADDRESSES } from "@/lib/web3-config";

// ABIs REAIS baseados nos seus contratos deployados
const PORTFOLIO_ANALYZER_ABI = [
  {
    name: "calculatePortfolioRisk",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getPortfolioAnalysis",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "totalValue", type: "uint256" },
          { name: "overallRisk", type: "uint256" },
          { name: "protocolCount", type: "uint256" },
          { name: "diversificationScore", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "addPosition",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_protocol", type: "address" },
      { name: "_token", type: "address" },
      { name: "_amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

const RISK_ORACLE_ABI = [
  {
    name: "getAggregatedRisk",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_protocol", type: "address" }],
    outputs: [
      { name: "volatilityRisk", type: "uint256" },
      { name: "liquidityRisk", type: "uint256" },
      { name: "smartContractRisk", type: "uint256" },
      { name: "governanceRisk", type: "uint256" },
      { name: "externalRisk", type: "uint256" },
      { name: "overallRisk", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
  },
] as const;

const ALERT_SYSTEM_ABI = [
  {
    name: "createSubscription",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_alertType", type: "uint8" },
      { name: "_protocol", type: "address" },
      { name: "_threshold", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "getUserActiveAlerts",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [{ name: "", type: "tuple[]" }],
  },
] as const;

const RISK_INSURANCE_ABI = [
  {
    name: "createPolicy",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_coverageAmount", type: "uint256" },
      { name: "_riskThreshold", type: "uint256" },
      { name: "_duration", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "getUserPolicies",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
] as const;

// Export ABIs for use in other parts of the application
export { RISK_ORACLE_ABI };

export function useContracts() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // 🔍 LEITURA: Portfolio Risk Score
  const {
    data: portfolioRisk,
    isLoading: isLoadingRisk,
    refetch: refetchRisk,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER as `0x${string}`,
    abi: PORTFOLIO_ANALYZER_ABI,
    functionName: "calculatePortfolioRisk",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // 🔍 LEITURA: Portfolio Analysis
  const {
    data: portfolioAnalysis,
    isLoading: isLoadingAnalysis,
    refetch: refetchAnalysis,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER as `0x${string}`,
    abi: PORTFOLIO_ANALYZER_ABI,
    functionName: "getPortfolioAnalysis",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // 🔍 LEITURA: Active Alerts
  const {
    data: activeAlerts,
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.ALERT_SYSTEM as `0x${string}`,
    abi: ALERT_SYSTEM_ABI,
    functionName: "getUserActiveAlerts",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // ✍️ ESCRITA: Adicionar Posição
  const addPosition = async (
    protocolAddress: string,
    tokenAddress: string,
    amount: string
  ) => {
    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }

    // ✅ VALIDAÇÃO: Prevenir endereços zero
    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      toast.error("Select a valid token");
      return;
    }

    if (protocolAddress === "0x0000000000000000000000000000000000000000") {
      toast.error("Select a valid protocol");
      return;
    }

    try {
      console.log("📝 REAL: Adicionando posição...", {
        protocol: protocolAddress,
        token: tokenAddress,
        amount,
        user: address,
      });

      toast.loading("Adicionando posição...");

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER as `0x${string}`,
        abi: PORTFOLIO_ANALYZER_ABI,
        functionName: "addPosition",
        args: [
          protocolAddress as `0x${string}`,
          tokenAddress as `0x${string}`,
          BigInt(amount),
        ],
      });

      console.log("✅ REAL: Posição adicionada:", txHash);
      toast.success("Posição adicionada com sucesso!");

      setTimeout(() => {
        refetchRisk();
        refetchAnalysis();
      }, 2000);

      return txHash;
    } catch (error: unknown) {
      console.error("❌ REAL: Error adding position:", error);

      let errorMessage = "Error adding position";
      if (error instanceof Error && error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient AVAX balance for gas";
      } else if (error instanceof Error && error.message?.includes("execution reverted")) {
        errorMessage = "Transaction rejected by contract";
      } else if (error instanceof Error && error.message?.includes("user rejected")) {
        errorMessage = "Transaction cancelled by user";
      }

      toast.error(errorMessage);
      throw error;
    }
  };

  // ✍️ ESCRITA: Criar Alerta - CORRIGINDO TIPO UINT8
  const createAlert = async (alertType: number, threshold: number) => {
    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }

    try {
      console.log("🚨 REAL: Criando alerta...", {
        user: address,
        alertType,
        threshold,
      });

      toast.loading("Creating alert...");

      // Endereço zero para alertas genéricos
      const protocolAddress = "0x0000000000000000000000000000000000000000";

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ALERT_SYSTEM as `0x${string}`,
        abi: ALERT_SYSTEM_ABI,
        functionName: "createSubscription",
        args: [
          alertType, // 🔧 FIX: uint8 deve permanecer como number, não BigInt
          protocolAddress as `0x${string}`,
          BigInt(threshold), // threshold como uint256 vira BigInt
        ],
      });

      console.log("✅ REAL: Alerta criado:", txHash);
      toast.success("Alerta criado com sucesso!");

      setTimeout(() => {
        refetchAlerts();
      }, 2000);

      return txHash;
    } catch (error: unknown) {
      console.error("❌ REAL: Error creating alert:", error);

      let errorMessage = "Error creating alert";
      if (error instanceof Error && error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient AVAX balance for gas";
      } else if (error instanceof Error && error.message?.includes("execution reverted")) {
        errorMessage = "Transaction rejected by contract";
      } else if (error instanceof Error && error.message?.includes("user rejected")) {
        errorMessage = "Transaction cancelled by user";
      }

      toast.error(errorMessage);
      throw error;
    }
  };

  // ✍️ ESCRITA: Criar Seguro
  const createInsurancePolicy = async (
    protocolAddress: string,
    coverageAmount: string
  ) => {
    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }

    try {
      console.log("🛡️ REAL: Criando seguro...", {
        holder: address,
        protocolAddress,
        coverageAmount,
      });

      toast.loading("Creating insurance policy...");

      // Converter coverage para Wei se necessário
      const coverage = BigInt(coverageAmount);
      const premium = coverage / BigInt(20); // 5%

      // Valores padrão
      const riskThreshold = 80;
      const duration = 30 * 24 * 60 * 60; // 30 dias

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.RISK_INSURANCE as `0x${string}`,
        abi: RISK_INSURANCE_ABI,
        functionName: "createPolicy",
        args: [coverage, BigInt(riskThreshold), BigInt(duration)],
        value: premium,
      });

      console.log("✅ REAL: Insurance created:", txHash);
      toast.success("Insurance created successfully!");

      return txHash;
    } catch (error: unknown) {
      console.error("❌ REAL: Error creating insurance:", error);

      let errorMessage = "Error creating insurance";
      if (error instanceof Error && error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient balance for premium + gas";
      } else if (error instanceof Error && error.message?.includes("execution reverted")) {
        errorMessage = "Transaction rejected by contract";
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
      toast.error("Connect your wallet to analyze portfolio");
      return;
    }

    console.log("📊 REAL: Atualizando análise de portfolio...");
    toast.loading("Analisando portfolio...");

    Promise.all([refetchRisk(), refetchAnalysis(), refetchAlerts()])
      .then(() => {
        console.log("✅ REAL: Análise atualizada");
        toast.success("Análise de portfolio atualizada!");
      })
      .catch((error) => {
        console.error("❌ REAL: Error in analysis:", error);
        toast.error("Error analyzing portfolio");
      });
  };

  // 🔧 FUNÇÃO HELPER PARA CONVERSÃO INTELIGENTE
  const smartConvert = (
    value: bigint | undefined,
    type: "percentage" | "count" | "wei"
  ) => {
    if (!value) return 0;

    const bigIntValue = BigInt(value.toString());

    switch (type) {
      case "percentage":
        // Se o valor é muito grande (provavelmente em wei), converter
        if (bigIntValue > BigInt(1000)) {
          const converted = Number(bigIntValue) / 1e16;
          return Math.min(Math.max(converted, 0), 100);
        }
        // Se é um valor pequeno, tratar como percentual direto
        const directPercent = Number(bigIntValue);
        return Math.min(Math.max(directPercent, 0), 100);

      case "count":
        // Para contadores, converter diretamente e limitar
        const count = Number(bigIntValue);
        return Math.min(Math.max(count, 0), 50);

      case "wei":
        // Para valores monetários, sempre converter de wei para ether
        return Number(bigIntValue) / 1e18;

      default:
        return Number(bigIntValue);
    }
  };

  // 📊 DADOS PROCESSADOS - CONVERSÕES BIGINT -> NUMBER SEGURAS
  const portfolioData = {
    // Risk Score do contrato - CONVERSÃO INTELIGENTE
    riskScore: smartConvert(portfolioRisk, "percentage"),

    // Portfolio Analysis (se disponível) - CONVERSÕES SEGURAS
    totalValue: smartConvert(portfolioAnalysis?.totalValue, "wei"),
    protocolCount: smartConvert(portfolioAnalysis?.protocolCount, "count"),
    diversificationScore: smartConvert(
      portfolioAnalysis?.diversificationScore,
      "percentage"
    ),

    // Active Alerts
    alertsCount: activeAlerts ? activeAlerts.length : 0,
  };

  const isLoading = isLoadingRisk || isLoadingAnalysis || isLoadingAlerts;

  // 🔍 DEBUG: Logs detalhados com valores brutos
  console.log("🔍 REAL DEBUG - VALORES BRUTOS:", {
    address,
    isConnected,
    portfolioRisk: {
      raw: portfolioRisk?.toString(),
      converted: smartConvert(portfolioRisk, "percentage"),
    },
    portfolioAnalysis: {
      totalValue: {
        raw: portfolioAnalysis?.totalValue?.toString(),
        converted: smartConvert(portfolioAnalysis?.totalValue, "wei"),
      },
      protocolCount: {
        raw: portfolioAnalysis?.protocolCount?.toString(),
        converted: smartConvert(portfolioAnalysis?.protocolCount, "count"),
      },
      diversificationScore: {
        raw: portfolioAnalysis?.diversificationScore?.toString(),
        converted: smartConvert(
          portfolioAnalysis?.diversificationScore,
          "percentage"
        ),
      },
    },
    activeAlerts: activeAlerts?.length,
    portfolioData,
    isLoading,
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
      activeAlerts,
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
