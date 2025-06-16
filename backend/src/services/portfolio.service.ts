import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface PortfolioAnalysisResult {
  portfolioId: string;
  totalValueUSD: string;
  overallRisk: number;
  diversificationScore: number;
  riskLevel: string;
  positionCount: number;
  topRisks: string[];
  lastUpdated: Date;
}

export interface PortfolioPosition {
  id: string;
  portfolioId: string;
  protocolAddress: string;
  protocolName: string;
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
  valueUSD: string;
  riskScore: number;
  createdAt: Date;
}

export class PortfolioService {

  async getUserPortfolios(userId: string) {
    try {
      logger.info(`📊 Getting portfolios for user: ${userId}`);
      
      // ✅ TEMPORÁRIO: Usar apenas campos que sabemos que existem
      const portfolios = await prisma.portfolio.findMany({
        where: {
          userId,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          userId: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastRiskScore: true
          // ✅ Removido campos problemáticos temporariamente
        }
      });

      logger.info(`✅ Found ${portfolios.length} portfolios`);
      return portfolios;
      
    } catch (error) {
      logger.error('❌ Error getting user portfolios:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get portfolios');
    }
  }

  async createPortfolio(userId: string, data: CreatePortfolioRequest) {
    try {
      logger.info(`📊 Creating portfolio for user: ${userId}`);
      
      const portfolio = await prisma.portfolio.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          isActive: true
        }
      });
      
      logger.info(`✅ Portfolio created: ${portfolio.id}`);
      return portfolio;
      
    } catch (error) {
      logger.error('❌ Error creating portfolio:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create portfolio');
    }
  }

  async analyzePortfolio(userId: string, portfolioId: string): Promise<PortfolioAnalysisResult> {
    try {
      logger.info(`📈 Analyzing portfolio: ${portfolioId}`);
      
      // Verificar se portfolio existe e pertence ao usuário
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          userId,
          isActive: true
        }
      });
      
      if (!portfolio) {
        throw new Error('Portfolio not found or access denied');
      }
      
      // Mock positions para desenvolvimento
      const mockPositions = await this.getMockPositions(portfolioId);
      
      const totalValueUSD = mockPositions.reduce((sum, pos) => sum + parseFloat(pos.valueUSD), 0);
      
      if (totalValueUSD === 0) {
        return {
          portfolioId,
          totalValueUSD: '0',
          overallRisk: 0,
          diversificationScore: 0,
          riskLevel: 'NONE',
          positionCount: 0,
          topRisks: ['No positions'],
          lastUpdated: new Date()
        };
      }
      
      // Calcular risk score ponderado
      const weightedRisk = mockPositions.reduce((sum, pos) => {
        const weight = parseFloat(pos.valueUSD) / totalValueUSD;
        return sum + (pos.riskScore * weight);
      }, 0);
      
      const overallRisk = Math.round(weightedRisk);
      const uniqueProtocols = new Set(mockPositions.map(p => p.protocolAddress)).size;
      const diversificationScore = Math.min(uniqueProtocols * 2500, 10000);
      const adjustedRisk = Math.max(overallRisk - (diversificationScore / 100), 0);
      
      // Determinar nível de risco
      let riskLevel: string;
      if (adjustedRisk < 3000) riskLevel = 'LOW';
      else if (adjustedRisk < 6000) riskLevel = 'MEDIUM';
      else if (adjustedRisk < 8000) riskLevel = 'HIGH';
      else riskLevel = 'CRITICAL';
      
      // Identificar principais riscos
      const topRisks: string[] = [];
      if (adjustedRisk > 5000) topRisks.push('Smart Contract Risk');
      if (adjustedRisk > 6000) topRisks.push('Liquidity Risk');
      if (diversificationScore < 5000) topRisks.push('Concentration Risk');
      if (mockPositions.some(p => p.riskScore > 7000)) topRisks.push('Protocol Risk');
      
      const analysis: PortfolioAnalysisResult = {
        portfolioId,
        totalValueUSD: totalValueUSD.toString(),
        overallRisk: adjustedRisk,
        diversificationScore,
        riskLevel,
        positionCount: mockPositions.length,
        topRisks: topRisks.length > 0 ? topRisks : ['Low Risk Portfolio'],
        lastUpdated: new Date()
      };
      
      // ✅ TEMPORÁRIO: Atualizar apenas campos que sabemos que existem
      await prisma.portfolio.update({
        where: { id: portfolioId },
        data: {
          lastRiskScore: adjustedRisk,
          updatedAt: new Date()
          // ✅ Removido campos problemáticos temporariamente
        }
      });
      
      logger.info(`✅ Portfolio analysis completed: ${riskLevel} risk (${adjustedRisk})`);
      return analysis;
      
    } catch (error) {
      logger.error('❌ Error analyzing portfolio:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze portfolio');
    }
  }

  async getPortfolioSummary(userId: string) {
    try {
      logger.info(`📊 Getting portfolio summary for user: ${userId}`);
      
      const portfolios = await this.getUserPortfolios(userId);
      
      if (portfolios.length === 0) {
        return {
          totalPortfolios: 0,
          totalValue: '0',
          averageRisk: 0,
          riskLevel: 'NONE',
          needsAttention: 0
        };
      }
      
      let totalValue = 0;
      let weightedRisk = 0;
      let needsAttention = 0;
      
      for (const portfolio of portfolios) {
        // ✅ TEMPORÁRIO: Usar valores mock até schema ser corrigido
        const value = 1000; // Mock value
        const risk = portfolio.lastRiskScore || 0;
        
        totalValue += value;
        weightedRisk += risk * value;
        
        if (risk > 7000) needsAttention++;
      }
      
      const averageRisk = totalValue > 0 ? Math.round(weightedRisk / totalValue) : 0;
      
      let riskLevel: string;
      if (averageRisk < 3000) riskLevel = 'LOW';
      else if (averageRisk < 6000) riskLevel = 'MEDIUM';
      else if (averageRisk < 8000) riskLevel = 'HIGH';
      else riskLevel = 'CRITICAL';
      
      return {
        totalPortfolios: portfolios.length,
        totalValue: totalValue.toString(),
        averageRisk,
        riskLevel,
        needsAttention
      };
      
    } catch (error) {
      logger.error('❌ Error getting portfolio summary:', error);
      throw new Error('Failed to get portfolio summary');
    }
  }

  async getPortfolioDetails(userId: string, portfolioId: string) {
    try {
      logger.info(`📋 Getting portfolio details: ${portfolioId}`);
      
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          userId,
          isActive: true
        }
      });
      
      if (!portfolio) {
        throw new Error('Portfolio not found or access denied');
      }
      
      const analysis = await this.analyzePortfolio(userId, portfolioId);
      const positions = await this.getMockPositions(portfolioId);
      
      return {
        portfolio,
        analysis,
        positions
      };
      
    } catch (error) {
      logger.error('❌ Error getting portfolio details:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get portfolio details');
    }
  }

  async updatePortfolio(userId: string, portfolioId: string, data: CreatePortfolioRequest) {
    try {
      logger.info(`📝 Updating portfolio: ${portfolioId} for user: ${userId}`);
      
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          userId,
          isActive: true
        }
      });
      
      if (!portfolio) {
        logger.warn(`❌ Portfolio not found or access denied: ${portfolioId}`);
        return null;
      }
      
      const updated = await prisma.portfolio.update({
        where: { id: portfolioId },
        data: {
          name: data.name,
          description: data.description,
          updatedAt: new Date()
        }
      });
      
      logger.info(`✅ Portfolio updated: ${portfolioId}`);
      return updated;
      
    } catch (error) {
      logger.error('❌ Error updating portfolio:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update portfolio');
    }
  }

  async removePortfolio(userId: string, portfolioId: string): Promise<boolean> {
    try {
      logger.info(`🗑️ Removing portfolio: ${portfolioId} for user: ${userId}`);
      
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          id: portfolioId,
          userId,
          isActive: true
        }
      });
      
      if (!portfolio) {
        logger.warn(`❌ Portfolio not found or already inactive: ${portfolioId}`);
        return false;
      }
      
      await prisma.portfolio.update({
        where: { id: portfolioId },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });
      
      logger.info(`✅ Portfolio marked as inactive: ${portfolioId}`);
      return true;
      
    } catch (error) {
      logger.error('❌ Error removing portfolio:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to remove portfolio');
    }
  }

  private async getMockPositions(portfolioId: string): Promise<PortfolioPosition[]> {
    // Mock data para desenvolvimento - em produção viria da blockchain
    return [
      {
        id: 'pos_uniswap_1',
        portfolioId,
        protocolAddress: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
        protocolName: 'Uniswap V3',
        tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        tokenSymbol: 'ETH',
        amount: '1.5',
        valueUSD: '3000',
        riskScore: 4200,
        createdAt: new Date()
      },
      {
        id: 'pos_aave_1',
        portfolioId,
        protocolAddress: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
        protocolName: 'Aave V3',
        tokenAddress: '0xA0b86a33E6411b0fCb8B6E65FA8b6f16b6F7c8a2',
        tokenSymbol: 'USDC',
        amount: '5000',
        valueUSD: '5000',
        riskScore: 4550,
        createdAt: new Date()
      }
    ];
  }
}

export const portfolioService = new PortfolioService();