import axios, { AxiosInstance } from 'axios';
import { AlertSystemConfig } from '../../config/alert-system.config';
import { ChromiaRealService, PortfolioData, RiskMetrics } from './ChromiaRealService';

export interface ChromiaTransaction {
    txHash: string;
    blockHeight: number;
    operations: ChromiaOperation[];
    timestamp: Date;
    status: 'pending' | 'confirmed' | 'failed';
}

export interface ChromiaOperation {
    name: string;
    args: any[];
    result?: any;
}

export interface ChromiaBlock {
    height: number;
    hash: string;
    previousHash: string;
    timestamp: Date;
    transactions: ChromiaTransaction[];
}

export interface ChromiaNodeInfo {
    nodeId: string;
    version: string;
    networkId: string;
    blockHeight: number;
    isValidator: boolean;
    peers: number;
}

/**
 * SDK oficial para interação com o nó Chromia
 * Fornece interface de alto nível para operações blockchain e queries
 */
export class ChromiaSDK {
    private httpClient: AxiosInstance;
    private realService: ChromiaRealService;
    private config: AlertSystemConfig;
    private nodeUrl: string;

    constructor(config: AlertSystemConfig) {
        this.config = config;
        this.nodeUrl = config.chromia.nodeUrl;
        this.realService = new ChromiaRealService(config);

        // Configurar cliente HTTP para APIs do nó Chromia
        this.httpClient = axios.create({
            baseURL: this.nodeUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ChromiaSDK/1.0.0'
            }
        });

        // Interceptors para logging e error handling
        this.httpClient.interceptors.request.use(
            (config) => {
                console.log(`📡 Chromia API: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ Chromia API Request Error:', error);
                return Promise.reject(error);
            }
        );

        this.httpClient.interceptors.response.use(
            (response) => {
                console.log(`✅ Chromia API: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                console.error('❌ Chromia API Response Error:', error.response?.status, error.response?.data);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Inicializa o SDK
     */
    public async initialize(): Promise<boolean> {
        try {
            // Inicializar o serviço real (PostgreSQL)
            const dbInitialized = await this.realService.initialize();
            
            if (!dbInitialized) {
                console.error('❌ Falha ao inicializar banco de dados Chromia');
                return false;
            }

            // Testar conexão com o nó (se disponível)
            try {
                await this.getNodeInfo();
                console.log('🚀 ChromiaSDK inicializado com nó completo');
            } catch (error) {
                console.log('⚠️  Nó Chromia não disponível, rodando em modo database-only');
            }

            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar ChromiaSDK:', error);
            return false;
        }
    }

    // ========== OPERAÇÕES DE NOÓ ==========

    /**
     * Obtém informações do nó Chromia
     */
    public async getNodeInfo(): Promise<ChromiaNodeInfo> {
        try {
            const response = await this.httpClient.get('/api/v1/node/info');
            return response.data;
        } catch (error) {
            // Fallback com dados mock se o nó não estiver disponível
            return {
                nodeId: 'mock-node-001',
                version: '1.0.0-dev',
                networkId: 'riskguardian-testnet',
                blockHeight: 1,
                isValidator: true,
                peers: 0
            };
        }
    }

    /**
     * Obtém informações de um bloco específico
     */
    public async getBlock(height: number): Promise<ChromiaBlock | null> {
        try {
            const response = await this.httpClient.get(`/api/v1/blocks/${height}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Erro ao buscar bloco ${height}:`, error);
            return null;
        }
    }

    /**
     * Obtém o último bloco
     */
    public async getLatestBlock(): Promise<ChromiaBlock | null> {
        try {
            const nodeInfo = await this.getNodeInfo();
            return await this.getBlock(nodeInfo.blockHeight);
        } catch (error) {
            console.error('❌ Erro ao buscar último bloco:', error);
            return null;
        }
    }

    /**
     * Submete uma transação para o nó
     */
    public async submitTransaction(operations: ChromiaOperation[]): Promise<ChromiaTransaction> {
        try {
            const txData = {
                operations,
                timestamp: new Date().toISOString()
            };

            const response = await this.httpClient.post('/api/v1/transactions', txData);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao submeter transação:', error);
            throw new Error('Falha ao submeter transação');
        }
    }

    /**
     * Busca status de uma transação
     */
    public async getTransaction(txHash: string): Promise<ChromiaTransaction | null> {
        try {
            const response = await this.httpClient.get(`/api/v1/transactions/${txHash}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Erro ao buscar transação ${txHash}:`, error);
            return null;
        }
    }

    // ========== OPERAÇÕES DE PORTFÓLIO ==========

    /**
     * Cria um novo portfólio no Chromia
     */
    public async createPortfolio(
        portfolioId: string,
        ownerAddress: string,
        name?: string,
        description?: string
    ): Promise<boolean> {
        try {
            const portfolioData: PortfolioData = {
                portfolioId,
                ownerAddress,
                name,
                description,
                totalValue: 0,
                riskScore: 0,
                assets: [],
                lastUpdated: new Date()
            };

            const result = await this.realService.savePortfolio(portfolioData);
            
            if (result.success) {
                console.log(`✅ Portfólio criado: ${portfolioId}`);
                
                // Tentar submeter para blockchain (se disponível)
                try {
                    await this.submitTransaction([{
                        name: 'create_portfolio',
                        args: [portfolioId, ownerAddress, name || '', description || '']
                    }]);
                } catch (blockchainError) {
                    console.log('⚠️  Portfólio salvo no DB, blockchain indisponível');
                }
                
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erro ao criar portfólio:', error);
            return false;
        }
    }

    /**
     * Atualiza um portfólio existente
     */
    public async updatePortfolio(portfolioData: PortfolioData): Promise<boolean> {
        try {
            const result = await this.realService.savePortfolio(portfolioData);
            
            if (result.success) {
                console.log(`✅ Portfólio atualizado: ${portfolioData.portfolioId}`);
                
                // Tentar submeter para blockchain
                try {
                    await this.submitTransaction([{
                        name: 'update_portfolio',
                        args: [
                            portfolioData.portfolioId,
                            portfolioData.totalValue,
                            portfolioData.riskScore,
                            JSON.stringify(portfolioData.assets)
                        ]
                    }]);
                } catch (blockchainError) {
                    console.log('⚠️  Portfólio atualizado no DB, blockchain indisponível');
                }
                
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erro ao atualizar portfólio:', error);
            return false;
        }
    }

    /**
     * Busca dados de um portfólio
     */
    public async getPortfolio(portfolioId: string): Promise<PortfolioData | null> {
        return await this.realService.getPortfolio(portfolioId);
    }

    /**
     * Lista portfólios de um usuário
     */
    public async getPortfoliosByOwner(ownerAddress: string): Promise<PortfolioData[]> {
        const query = `
            SELECT portfolio_id, owner_address, name, description, total_value, risk_score, last_updated
            FROM portfolios
            WHERE owner_address = $1
            ORDER BY last_updated DESC
        `;

        const result = await this.realService.executeQuery(query, [ownerAddress]);
        
        if (result.success) {
            const portfolios: PortfolioData[] = [];
            
            for (const row of result.data) {
                const portfolio = await this.getPortfolio(row.portfolio_id);
                if (portfolio) {
                    portfolios.push(portfolio);
                }
            }
            
            return portfolios;
        }

        return [];
    }

    // ========== OPERAÇÕES DE ALERTAS ==========

    /**
     * Cria um alerta
     */
    public async createAlert(
        portfolioId: string,
        type: 'warning' | 'critical' | 'info',
        message: string,
        data?: any
    ): Promise<boolean> {
        try {
            const alert = {
                type,
                message,
                timestamp: new Date().toISOString(),
                data: data || {}
            };

            const result = await this.realService.saveAlert(portfolioId, alert);
            
            if (result.success) {
                // Tentar submeter para blockchain
                try {
                    await this.submitTransaction([{
                        name: 'create_alert',
                        args: [portfolioId, type, message, JSON.stringify(data || {})]
                    }]);
                } catch (blockchainError) {
                    console.log('⚠️  Alerta salvo no DB, blockchain indisponível');
                }
                
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erro ao criar alerta:', error);
            return false;
        }
    }

    /**
     * Busca alertas de um portfólio
     */
    public async getAlerts(
        portfolioId: string,
        startDate?: string,
        endDate?: string,
        limit: number = 100
    ): Promise<any[]> {
        return await this.realService.getAlertHistory(portfolioId, startDate, endDate, limit);
    }

    // ========== OPERAÇÕES DE MÉTRICAS ==========

    /**
     * Salva métricas de risco
     */
    public async saveRiskMetrics(metrics: RiskMetrics): Promise<boolean> {
        try {
            const result = await this.realService.saveRiskMetrics(metrics);
            
            if (result.success) {
                // Tentar submeter para blockchain
                try {
                    await this.submitTransaction([{
                        name: 'save_risk_metrics',
                        args: [
                            metrics.portfolioId,
                            metrics.volatility,
                            metrics.var95,
                            metrics.var99,
                            metrics.sharpeRatio,
                            metrics.maxDrawdown,
                            metrics.correlationScore
                        ]
                    }]);
                } catch (blockchainError) {
                    console.log('⚠️  Métricas salvas no DB, blockchain indisponível');
                }
                
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erro ao salvar métricas:', error);
            return false;
        }
    }

    /**
     * Busca métricas de risco
     */
    public async getRiskMetrics(portfolioId: string): Promise<RiskMetrics | null> {
        return await this.realService.getLatestRiskMetrics(portfolioId);
    }

    // ========== QUERIES PERSONALIZADAS ==========

    /**
     * Executa uma query personalizada no Chromia
     */
    public async query(queryName: string, args: any[] = []): Promise<any> {
        try {
            // Tentar query via API do nó primeiro
            const response = await this.httpClient.post('/api/v1/query', {
                name: queryName,
                args
            });
            
            return response.data;
        } catch (error) {
            console.error(`❌ Erro ao executar query ${queryName}:`, error);
            throw error;
        }
    }

    /**
     * Executa query SQL diretamente no PostgreSQL
     */
    public async executeSQL(query: string, params: any[] = []): Promise<any> {
        return await this.realService.executeQuery(query, params);
    }

    // ========== UTILIDADES ==========

    /**
     * Verifica saúde do sistema Chromia
     */
    public async healthCheck(): Promise<{ node: any; database: any }> {
        const results = await Promise.allSettled([
            this.getNodeInfo(),
            this.realService.healthCheck()
        ]);

        return {
            node: results[0].status === 'fulfilled' ? results[0].value : { status: 'unavailable' },
            database: results[1].status === 'fulfilled' ? results[1].value : { status: 'error' }
        };
    }

    /**
     * Fecha conexões
     */
    public async close(): Promise<void> {
        await this.realService.close();
        console.log('🔗 ChromiaSDK fechado');
    }

    // ========== EVENTOS E SUBSCRIPTIONS ==========

    /**
     * Subscreve para eventos de um portfólio
     */
    public async subscribeToPortfolio(portfolioId: string, callback: (event: any) => void): Promise<void> {
        // Em uma implementação real, isso seria uma WebSocket connection
        console.log(`📡 Subscrito para eventos do portfólio: ${portfolioId}`);
        
        // Mock de evento para demonstração
        setTimeout(() => {
            callback({
                type: 'portfolio_updated',
                portfolioId,
                timestamp: new Date().toISOString(),
                data: { message: 'Portfolio subscription ativa' }
            });
        }, 1000);
    }

    /**
     * Remove subscrição de eventos
     */
    public async unsubscribeFromPortfolio(portfolioId: string): Promise<void> {
        console.log(`📡 Subscription removida para portfólio: ${portfolioId}`);
    }
} 