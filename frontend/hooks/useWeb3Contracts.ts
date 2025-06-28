"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESSES,
  CONTRACT_ABIS,
  CHAIN_CONFIG,
} from "@/lib/web3-config";

interface ContractState {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  contracts: {
    portfolioAnalyzer: ethers.Contract | null;
    riskOracle: ethers.Contract | null;
    riskRegistry: ethers.Contract | null;
    alertSystem: ethers.Contract | null;
    riskInsurance: ethers.Contract | null;
  };
  isConnected: boolean;
  chainId: number | null;
  account: string | null;
}

interface PortfolioData {
  riskScore: number;
  analysis: string;
  positions: Array<{
    protocol: string;
    token: string;
    amount: string;
  }>;
  totalValue: string;
  assetAllocation: {
    assets: string[];
    percentages: number[];
  };
}

export function useWeb3Contracts() {
  const [state, setState] = useState<ContractState>({
    provider: null,
    signer: null,
    contracts: {
      portfolioAnalyzer: null,
      riskOracle: null,
      riskRegistry: null,
      alertSystem: null,
      riskInsurance: null,
    },
    isConnected: false,
    chainId: null,
    account: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Switch to Avalanche Fuji network
  const switchToFujiNetwork = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CHAIN_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError && typeof switchError === 'object' && 'code' in switchError && (switchError as { code: number }).code === 4902) {
        try {
          await window.ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${CHAIN_CONFIG.chainId.toString(16)}`,
                chainName: CHAIN_CONFIG.chainName,
                nativeCurrency: CHAIN_CONFIG.nativeCurrency,
                rpcUrls: [CHAIN_CONFIG.rpcUrl],
                blockExplorerUrls: [CHAIN_CONFIG.blockExplorer],
              },
            ],
          });
        } catch (addError) {
          console.error("❌ Error adding network:", addError);
          throw addError;
        }
      } else {
        console.error("❌ Error switching network:", switchError);
        throw switchError;
      }
    }
  }, []);

  // Initialize Web3 connection
  const initializeWeb3 = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask is not installed");
      }

      let provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      let signer = await provider.getSigner();
      let account = await signer.getAddress();

      // Check if we're on the correct network
      if (Number(network.chainId) !== CHAIN_CONFIG.chainId) {
        console.log(
          `🔄 Rede incorreta detectada. Tentando trocar para ${CHAIN_CONFIG.chainName}...`
        );
        try {
          await switchToFujiNetwork();
          // After switching, get the new provider and network
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          const newNetwork = await newProvider.getNetwork();

          if (Number(newNetwork.chainId) !== CHAIN_CONFIG.chainId) {
            throw new Error(
              `Please connect to ${CHAIN_CONFIG.chainName} network`
            );
          }

          // Update provider and signer with new network
          const newSigner = await newProvider.getSigner();
          const newAccount = await newSigner.getAddress();

          // Use the new provider/signer for contract initialization
          provider = newProvider;
          signer = newSigner;
          account = newAccount;
        } catch (switchError) {
          console.error("❌ Error switching network:", switchError);
          throw new Error(
            `Por favor, conecte-se à rede ${CHAIN_CONFIG.chainName}`
          );
        }
      }

      // Initialize contracts
      const portfolioAnalyzer = new ethers.Contract(
        CONTRACT_ADDRESSES.PORTFOLIO_ANALYZER,
        CONTRACT_ABIS.PORTFOLIO_ANALYZER,
        signer
      );

      const riskOracle = new ethers.Contract(
        CONTRACT_ADDRESSES.RISK_ORACLE,
        CONTRACT_ABIS.RISK_ORACLE,
        signer
      );

      const riskRegistry = new ethers.Contract(
        CONTRACT_ADDRESSES.RISK_REGISTRY,
        CONTRACT_ABIS.RISK_REGISTRY,
        signer
      );

      const alertSystem = new ethers.Contract(
        CONTRACT_ADDRESSES.ALERT_SYSTEM,
        CONTRACT_ABIS.ALERT_SYSTEM,
        signer
      );

      const riskInsurance = new ethers.Contract(
        CONTRACT_ADDRESSES.RISK_INSURANCE,
        CONTRACT_ABIS.RISK_INSURANCE,
        signer
      );

      setState({
        provider,
        signer,
        contracts: {
          portfolioAnalyzer,
          riskOracle,
          riskRegistry,
          alertSystem,
          riskInsurance,
        },
        isConnected: true,
        chainId: Number(network.chainId),
        account,
      });

      console.log("✅ Web3 contracts initialized successfully");
      console.log("📍 Connected account:", account);
      console.log("🌐 Network:", CHAIN_CONFIG.chainName);
    } catch (err: unknown) {
      console.error("❌ Failed to initialize Web3:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [switchToFujiNetwork, setLoading, setError, setState]);

  // Portfolio Analysis Functions
  const analyzePortfolio = useCallback(
    async (userAddress?: string): Promise<PortfolioData | null> => {
      try {
        if (!state.contracts.portfolioAnalyzer) {
          throw new Error("Portfolio Analyzer contract not initialized");
        }

        const address = userAddress || state.account;
        if (!address) {
          throw new Error("No address provided");
        }

        console.log(`🔍 Analyzing portfolio for: ${address}`);

        const [riskScore, analysis] =
          await state.contracts.portfolioAnalyzer.analyzePortfolio(address);
        const positions = await state.contracts.portfolioAnalyzer.getPositions(
          address
        );
        const totalValue =
          await state.contracts.portfolioAnalyzer.getTotalValue(address);
        const [assets, percentages] =
          await state.contracts.portfolioAnalyzer.getAssetAllocation(address);

        return {
          riskScore: Number(riskScore) / 100, // Convert to percentage
          analysis,
          positions: positions.map((pos: { protocol: string; token: string; amount: bigint }) => ({
            protocol: pos.protocol,
            token: pos.token,
            amount: ethers.formatEther(pos.amount),
          })),
          totalValue: ethers.formatEther(totalValue),
          assetAllocation: {
            assets,
            percentages: percentages.map((p: bigint) => Number(p)),
          },
        };
      } catch (err: unknown) {
        console.error("❌ Error analyzing portfolio:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    [state.contracts.portfolioAnalyzer, state.account]
  );

  // Risk Oracle Functions
  const getProtocolRisk = useCallback(
    async (protocolAddress: string): Promise<number | null> => {
      try {
        if (!state.contracts.riskOracle) {
          throw new Error("Risk Oracle contract not initialized");
        }

        const risk = await state.contracts.riskOracle.getProtocolRisk(
          protocolAddress
        );
        return Number(risk) / 100; // Convert to percentage
      } catch (err: unknown) {
        console.error("❌ Error getting protocol risk:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    [state.contracts.riskOracle]
  );

  const getMarketRisk = useCallback(async (): Promise<number | null> => {
    try {
      if (!state.contracts.riskOracle) {
        throw new Error("Risk Oracle contract not initialized");
      }

      const risk = await state.contracts.riskOracle.getMarketRisk();
      return Number(risk) / 100; // Convert to percentage
    } catch (err: unknown) {
      console.error("❌ Error getting market risk:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [state.contracts.riskOracle]);

  // Alert System Functions
  const createAlert = useCallback(
    async (alertType: number, threshold: number): Promise<string | null> => {
      try {
        if (!state.contracts.alertSystem || !state.account) {
          throw new Error(
            "Alert System contract not initialized or no account connected"
          );
        }

        const tx = await state.contracts.alertSystem.createAlert(
          state.account,
          alertType,
          threshold * 100 // Convert percentage to basis points
        );

        const receipt = await tx.wait();
        console.log("✅ Alert created successfully:", receipt.hash);
        return receipt.hash;
      } catch (err: unknown) {
        console.error("❌ Error creating alert:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    [state.contracts.alertSystem, state.account]
  );

  const getUserAlerts = useCallback(async (): Promise<number[] | null> => {
    try {
      if (!state.contracts.alertSystem || !state.account) {
        throw new Error(
          "Alert System contract not initialized or no account connected"
        );
      }

      const alerts = await state.contracts.alertSystem.getActiveAlerts(
        state.account
      );
      return alerts.map((alert: bigint) => Number(alert));
    } catch (err: unknown) {
      console.error("❌ Error getting user alerts:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [state.contracts.alertSystem, state.account]);

  // Insurance Functions
  const createInsurancePolicy = useCallback(
    async (
      protocolAddress: string,
      coverage: string
    ): Promise<string | null> => {
      try {
        if (!state.contracts.riskInsurance || !state.account) {
          throw new Error(
            "Risk Insurance contract not initialized or no account connected"
          );
        }

        const coverageWei = ethers.parseEther(coverage);
        const tx = await state.contracts.riskInsurance.createPolicy(
          state.account,
          protocolAddress,
          coverageWei
        );

        const receipt = await tx.wait();
        console.log("✅ Insurance policy created successfully:", receipt.hash);
        return receipt.hash;
      } catch (err: unknown) {
        console.error("❌ Error creating insurance policy:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        return null;
      }
    },
    [state.contracts.riskInsurance, state.account]
  );

  // Listen for account and network changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        if (accounts.length === 0) {
          // User disconnected
          setState((prev) => ({
            ...prev,
            isConnected: false,
            account: null,
          }));
        } else {
          // Account changed
          initializeWeb3();
        }
      };

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [initializeWeb3]);

  return {
    // State
    ...state,
    loading,
    error,

    // Functions
    initializeWeb3,
    switchToFujiNetwork,

    // Portfolio functions
    analyzePortfolio,

    // Risk functions
    getProtocolRisk,
    getMarketRisk,

    // Alert functions
    createAlert,
    getUserAlerts,

    // Insurance functions
    createInsurancePolicy,

    // Utility
    clearError: () => setError(null),
  };
}

export default useWeb3Contracts;
