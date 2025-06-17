/**
 * RiskGuardian Chromia AWS - Sistema Principal
 * Integração completa com nó Chromia real e PostgreSQL
 */

import { defaultConfig } from '../config/alert-system.config';
import { AlertOrchestrator } from './services/AlertOrchestrator';
import { ChromiaNodeIntegration } from './services/ChromiaNodeIntegration';
import { ChromiaRealService } from './services/ChromiaRealService';
import { ChromiaSDK } from './services/ChromiaSDK';

class RiskGuardianChromiaAWS {
    private orchestrator: AlertOrchestrator;
    private chromiaIntegration: ChromiaNodeIntegration;
    private chromiaService: ChromiaRealService;
    private chromiaSDK: ChromiaSDK;
    private isRunning: boolean = false;

    constructor() {
        this.orchestrator = new AlertOrchestrator(defaultConfig);
        this.chromiaIntegration = new ChromiaNodeIntegration();
        this.chromiaService = new ChromiaRealService({
            host: process.env.POSTGRES_HOST || 'postgres',
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            database: process.env.POSTGRES_DB || 'chromia',
            user: process.env.POSTGRES_USER || 'chromia',
            password: process.env.POSTGRES_PASSWORD || 'chromia_password'
        });
        this.chromiaSDK = new ChromiaSDK('http://chromia-node:7740');
    }

    async start(): Promise<void> {
        try {
            console.log('🚀 Iniciando RiskGuardian Chromia AWS...');

            // 1. Conectar com PostgreSQL
            console.log('📊 Conectando com PostgreSQL...');
            const dbHealth = await this.chromiaService.healthCheck();
            if (dbHealth.status !== 'healthy') {
                throw new Error('PostgreSQL não está saudável');
            }
            console.log('✅ PostgreSQL conectado');

            // 2. Tentar conectar com nó Chromia
            console.log('🔗 Tentando conectar com nó Chromia...');
            const nodeConnected = await this.chromiaIntegration.connect();
            if (nodeConnected) {
                console.log('✅ Nó Chromia conectado');
            } else {
                console.log('⚠️  Nó Chromia offline - continuando com PostgreSQL apenas');
            }

            // 3. Iniciar orchestrador de alertas
            console.log('🚨 Iniciando sistema de alertas...');
            await this.orchestrator.start();
            console.log('✅ Sistema de alertas ativo');

            // 4. Configurar monitoramento periódico
            this.setupPeriodicTasks();

            this.isRunning = true;
            console.log('🎉 RiskGuardian Chromia AWS iniciado com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao iniciar sistema:', error);
            throw error;
        }
    }

    private setupPeriodicTasks(): void {
        // Sync de portfolios a cada 2 minutos
        setInterval(async () => {
            try {
                await this.syncAllPortfolios();
            } catch (error) {
                console.error('Erro no sync de portfolios:', error);
            }
        }, 120000);

        // Update de preços a cada 30 segundos
        setInterval(async () => {
            try {
                await this.updatePrices();
            } catch (error) {
                console.error('Erro no update de preços:', error);
            }
        }, 30000);

        // Health check a cada 60 segundos
        setInterval(async () => {
            try {
                await this.healthCheck();
            } catch (error) {
                console.error('Erro no health check:', error);
            }
        }, 60000);

        // Processamento de alertas mockado a cada minuto
        setInterval(async () => {
            try {
                await this.processMockAlerts();
            } catch (error) {
                console.error('Erro ao processar alertas mock:', error);
            }
        }, 60000);
    }

    private async syncAllPortfolios(): Promise<void> {
        try {
            // Simulando portfolios para demo
            const mockPortfolios = [
                { rowid: 1, name: 'DeFi Portfolio', total_value: 10000 },
                { rowid: 2, name: 'Conservative Portfolio', total_value: 25000 }
            ];
            
            for (const portfolio of mockPortfolios) {
                await this.chromiaIntegration.syncPortfolio(portfolio.rowid);
            }

            console.log(`📈 ${mockPortfolios.length} portfolios sincronizados`);
        } catch (error) {
            console.error('Erro ao sincronizar portfolios:', error);
        }
    }

    private async updatePrices(): Promise<void> {
        try {
            const symbols = ['ETH', 'BTC', 'USDC', 'LINK', 'UNI', 'AAVE'];
            const prices = await this.chromiaIntegration.updatePricesFromChainlink(symbols);
            
            // Atualizar preços no banco
            for (const priceData of prices) {
                await this.chromiaService.updateAssetPrice(
                    priceData.symbol,
                    priceData.price
                );
            }

            console.log(`💰 ${prices.length} preços atualizados`);
        } catch (error) {
            console.error('Erro ao atualizar preços:', error);
        }
    }

    private async healthCheck(): Promise<void> {
        try {
            const status = await this.chromiaIntegration.checkHealth();
            const blockchainStatus = await this.chromiaIntegration.getBlockchainStatus();
            
            console.log('❤️  Health check:', {
                system: status.status,
                node: this.chromiaIntegration.connected ? 'online' : 'offline',
                database: blockchainStatus.database?.status || 'unknown'
            });
        } catch (error) {
            console.error('Erro no health check:', error);
        }
    }

    private async processMockAlerts(): Promise<void> {
        try {
            // Buscar portfolios e simular alertas
            const portfolios = await this.chromiaService.getAllPortfolios();
            
            for (const portfolio of portfolios.slice(0, 2)) { // Apenas primeiros 2
                // Simular volatilidade alta
                if (Math.random() > 0.7) {
                    const alert = {
                        portfolioId: portfolio.rowid,
                        alertType: 'volatility_high',
                        severity: 'medium' as const,
                        message: `Portfolio ${portfolio.name} apresenta alta volatilidade`,
                        currentValue: portfolio.total_value * (0.9 + Math.random() * 0.2)
                    };

                    const alertId = await this.chromiaIntegration.processAlert(alert);
                    if (alertId) {
                        console.log(`🚨 Alerta processado: ${alertId}`);
                    }
                }

                // Simular atualização de portfolio
                const mockData = {
                    totalValue: portfolio.total_value * (0.95 + Math.random() * 0.1),
                    stopLoss: portfolio.total_value * 0.85,
                    volatility: Math.random() * 0.3,
                    maxVolatility: 0.25,
                    assets: [
                        { symbol: 'ETH', amount: 2.5, value: 5000 },
                        { symbol: 'USDC', amount: 3000, value: 3000 }
                    ]
                };

                await this.orchestrator.processPortfolioUpdate(
                    `portfolio_${portfolio.rowid}`,
                    mockData
                );
            }
        } catch (error) {
            console.error('Erro ao processar alertas mock:', error);
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) return;

        console.log('🛑 Parando RiskGuardian Chromia AWS...');
        
        try {
            await this.chromiaIntegration.disconnect();
            await this.chromiaService.close();
            
            this.isRunning = false;
            console.log('✅ Sistema parado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao parar sistema:', error);
        }
    }

    // Getters para status
    get running(): boolean {
        return this.isRunning;
    }

    get nodeConnected(): boolean {
        return this.chromiaIntegration.connected;
    }
}

// Função principal
async function main() {
    const app = new RiskGuardianChromiaAWS();

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        console.log(`\n📡 Recebido sinal ${signal}, parando sistema...`);
        await app.stop();
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    try {
        await app.start();
        
        // Manter processo vivo
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        });

    } catch (error) {
        console.error('❌ Falha crítica:', error);
        process.exit(1);
    }
}

// Executar se for o arquivo principal
if (require.main === module) {
    main();
}

export { RiskGuardianChromiaAWS }; 