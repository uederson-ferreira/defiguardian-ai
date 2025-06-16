import { logger } from '../utils/logger';

export interface RiskAssessment {
  address: string;
  riskScore: number;
  volatilityScore: number;
  liquidityScore: number;
  auditScore: number;
  factors: RiskFactor[];
  timestamp: Date;
}

export interface RiskFactor {
  type: string;
  score: number;
  weight: number;
  description: string;
}

export interface MarketRisk {
  protocol: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  factors: string[];
  lastUpdated: Date;
}

export class RiskOracleService {
  async getMarketRisk(protocol: string): Promise<number> {
    try {
      logger.info(`Getting market risk for protocol: ${protocol}`);
      
      // Mock implementation - In production, this would connect to real oracles
      const mockRisks: Record<string, number> = {
        'uniswap': 0.2,
        'aave': 0.3,
        'compound': 0.25,
        'curve': 0.35,
        'yearn': 0.4,
        'default': 0.3
      };
      
      const protocolKey = protocol.toLowerCase();
      const riskScore = mockRisks[protocolKey] || mockRisks.default;
      
      logger.debug(`Market risk for ${protocol}: ${riskScore}`);
      return riskScore;
      
    } catch (error) {
      logger.error(`Error getting market risk for ${protocol}:`, error);
      // Return default moderate risk in case of error
      return 0.5;
    }
  }

  async getProtocolRisk(address: string): Promise<number> {
    try {
      logger.info(`Getting protocol risk for address: ${address}`);
      
      // Mock implementation - In production, this would analyze:
      // - Smart contract audits
      // - TVL stability
      // - Historical exploits
      // - Code complexity
      // - Admin controls
      
      // For demo purposes, return risk based on address characteristics
      const addressLower = address.toLowerCase();
      
      // Simulate different risk levels based on address patterns
      if (addressLower.includes('aaa') || addressLower.includes('000')) {
        return 0.1; // Low risk
      } else if (addressLower.includes('bbb') || addressLower.includes('111')) {
        return 0.3; // Medium risk
      } else if (addressLower.includes('ccc') || addressLower.includes('222')) {
        return 0.6; // High risk
      } else if (addressLower.includes('ddd') || addressLower.includes('333')) {
        return 0.8; // Very high risk
      } else {
        // Default risk calculation based on address
        const hash = this.simpleHash(addressLower);
        const normalizedRisk = (hash % 100) / 100; // 0-1 range
        return Math.max(0.1, Math.min(0.9, normalizedRisk)); // Clamp between 0.1 and 0.9
      }
      
    } catch (error) {
      logger.error(`Error getting protocol risk for ${address}:`, error);
      // Return default moderate risk in case of error
      return 0.5;
    }
  }

  async getWalletRisk(address: string): Promise<number> {
    try {
      logger.info(`Getting wallet risk for address: ${address}`);
      
      // Mock implementation - In production, this would analyze:
      // - Transaction patterns
      // - Interaction with risky protocols
      // - Liquidity exposure
      // - Diversification
      
      const addressLower = address.toLowerCase();
      const hash = this.simpleHash(addressLower);
      
      // Generate deterministic but pseudo-random risk score
      const baseRisk = (hash % 50) / 100; // 0-0.5 base risk
      const volatilityFactor = ((hash >> 8) % 30) / 100; // 0-0.3 volatility
      
      const totalRisk = Math.min(0.9, baseRisk + volatilityFactor);
      
      logger.debug(`Wallet risk for ${address}: ${totalRisk}`);
      return totalRisk;
      
    } catch (error) {
      logger.error(`Error getting wallet risk for ${address}:`, error);
      return 0.4; // Default moderate risk
    }
  }

  async getDetailedRiskAssessment(address: string): Promise<RiskAssessment> {
    try {
      logger.info(`Getting detailed risk assessment for: ${address}`);
      
      const protocolRisk = await this.getProtocolRisk(address);
      const walletRisk = await this.getWalletRisk(address);
      
      // Calculate component scores
      const volatilityScore = Math.min(1, protocolRisk * 1.2);
      const liquidityScore = Math.min(1, walletRisk * 0.8);
      const auditScore = Math.max(0, 1 - protocolRisk * 1.5);
      
      // Overall risk score (weighted average)
      const riskScore = (protocolRisk * 0.4) + (walletRisk * 0.3) + (volatilityScore * 0.3);
      
      const factors: RiskFactor[] = [
        {
          type: 'Protocol Risk',
          score: protocolRisk,
          weight: 0.4,
          description: 'Smart contract and protocol-specific risks'
        },
        {
          type: 'Wallet Risk',
          score: walletRisk,
          weight: 0.3,
          description: 'Wallet behavior and exposure patterns'
        },
        {
          type: 'Volatility Risk',
          score: volatilityScore,
          weight: 0.3,
          description: 'Price volatility and market risks'
        }
      ];
      
      return {
        address,
        riskScore,
        volatilityScore,
        liquidityScore,
        auditScore,
        factors,
        timestamp: new Date()
      };
      
    } catch (error) {
      logger.error(`Error getting detailed risk assessment for ${address}:`, error);
      throw new Error('Failed to generate risk assessment');
    }
  }

  async getMarketInsights(): Promise<MarketRisk[]> {
    try {
      logger.info('Getting market insights');
      
      // Mock market insights
      const insights: MarketRisk[] = [
        {
          protocol: 'Uniswap V3',
          riskLevel: 'low',
          score: 0.2,
          factors: ['High TVL', 'Audited', 'Established'],
          lastUpdated: new Date()
        },
        {
          protocol: 'Compound',
          riskLevel: 'medium',
          score: 0.3,
          factors: ['Governance risks', 'Liquidation risks'],
          lastUpdated: new Date()
        },
        {
          protocol: 'New DeFi Protocol',
          riskLevel: 'high',
          score: 0.7,
          factors: ['Unaudited', 'Low TVL', 'New'],
          lastUpdated: new Date()
        }
      ];
      
      return insights;
      
    } catch (error) {
      logger.error('Error getting market insights:', error);
      return [];
    }
  }

  async updateRiskScores(): Promise<void> {
    try {
      logger.info('Updating risk scores from oracles...');
      
      // Mock implementation - In production, this would:
      // - Fetch data from Chainlink oracles
      // - Update internal risk models
      // - Refresh cached scores
      
      logger.info('Risk scores updated successfully');
      
    } catch (error) {
      logger.error('Error updating risk scores:', error);
      throw new Error('Failed to update risk scores');
    }
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private normalizeRiskScore(score: number): number {
    return Math.max(0, Math.min(1, score));
  }
}

export const riskOracleService = new RiskOracleService();