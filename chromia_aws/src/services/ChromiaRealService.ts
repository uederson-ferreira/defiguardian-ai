import { Pool, PoolClient } from 'pg';
import { AlertSystemConfig } from '../../config/alert-system.config';
import { Alert } from './ChromiaStorageService';

export interface ChromiaQueryResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface PortfolioData {
    portfolioId: string;
    ownerAddress: string;
    name?: string;
    description?: string;
    totalValue: number;
    riskScore: number;
    assets: PortfolioAsset[];
    lastUpdated: Date;
}

export interface PortfolioAsset {
    symbol: string;
    address?: string;
    amount: number;
    valueUsd: number;
    lastPrice?: number;
    weightPercentage?: number;
}

export interface RiskMetrics {
    portfolioId: string;
    volatility: number;
    var95: number;
    var99: number;
    sharpeRatio: number;
    maxDrawdown: number;
    correlationScore: number;
    calculatedAt: Date;
}

/**
 * Serviço real do Chromia que implementa comunicação com PostgreSQL/Postchain
 * Substitui o ChromiaStorageService mock por implementação funcional
 */
export class ChromiaRealService {
    private pool: Pool;
    private config: AlertSystemConfig;
    private isInitialized: boolean = false;

    constructor(config: AlertSystemConfig) {
        this.config = config;
        this.initializePostgreSQLConnection();
    }

    /**
     * Inicializa a conexão com PostgreSQL (backend do Chromia/Postchain)
     */
    private initializePostgreSQLConnection(): void {
        this.pool = new Pool({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            database: process.env.POSTGRES_DB || 'chromia',
            user: process.env.POSTGRES_USER || 'chromia',
            password: process.env.POSTGRES_PASSWORD || 'chromia_password',
            schema: 'chromia',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Configurar handlers de eventos
        this.pool.on('connect', () => {
            console.log('🔗 Chromia: Conectado ao PostgreSQL');
        });

        this.pool.on('error', (err) => {
            console.error('❌ Chromia: Erro na conexão PostgreSQL:', err);
        });
    }

    /**
     * Inicializa o serviço e verifica conectividade
     */
    public async initialize(): Promise<boolean> {
        try {
            const client = await this.pool.connect();
            
            // Testa a conexão com uma query simples
            const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
            console.log('✅ Chromia: PostgreSQL conectado -', result.rows[0].current_time);
            
            // Verifica se o schema chromia existe
            const schemaCheck = await client.query(`
                SELECT schema_name FROM information_schema.schemata 
                WHERE schema_name = 'chromia'
            `);
            
            if (schemaCheck.rows.length === 0) {
                console.log('⚠️  Schema chromia não encontrado, criando...');
                await this.createSchema(client);
            }

            client.release();
            this.isInitialized = true;
            console.log('🚀 ChromiaRealService inicializado com sucesso');
            return true;

        } catch (error) {
            console.error('❌ Erro ao inicializar ChromiaRealService:', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Cria o schema chromia se não existir
     */
    private async createSchema(client: PoolClient): Promise<void> {
        await client.query('CREATE SCHEMA IF NOT EXISTS chromia');
        await client.query('SET search_path TO chromia, public');
        
        // Criar tabelas básicas
        await client.query(`
            CREATE TABLE IF NOT EXISTS portfolio_alerts (
                id SERIAL PRIMARY KEY,
                portfolio_id VARCHAR(255) NOT NULL,
                alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('warning', 'critical', 'info')),
                message TEXT NOT NULL,
                alert_data JSONB,
                severity INTEGER DEFAULT 1,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_portfolio_alerts_portfolio 
            ON portfolio_alerts(portfolio_id)
        `);

        console.log('✅ Schema chromia criado com sucesso');
    }

    /**
     * Executa uma query no Chromia/PostgreSQL
     */
    public async executeQuery(query: string, params: any[] = []): Promise<ChromiaQueryResult> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const client = await this.pool.connect();
        try {
            await client.query('SET search_path TO chromia, public');
            const result = await client.query(query, params);
            
            return {
                success: true,
                data: result.rows
            };
        } catch (error) {
            console.error('❌ Erro ao executar query Chromia:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        } finally {
            client.release();
        }
    }

    /**
     * Salva um alerta no Chromia
     */
    public async saveAlert(portfolioId: string, alert: Omit<Alert, 'portfolioId'>): Promise<ChromiaQueryResult> {
        const query = `
            INSERT INTO portfolio_alerts (portfolio_id, alert_type, message, alert_data, severity)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `;

        const params = [
            portfolioId,
            alert.type,
            alert.message,
            JSON.stringify(alert.data),
            this.getAlertSeverity(alert.type)
        ];

        const result = await this.executeQuery(query, params);
        
        if (result.success) {
            console.log(`✅ Alerta salvo no Chromia - Portfolio: ${portfolioId}, Tipo: ${alert.type}`);
        }

        return result;
    }

    /**
     * Busca histórico de alertas
     */
    public async getAlertHistory(
        portfolioId: string,
        startDate?: string,
        endDate?: string,
        limit: number = 100
    ): Promise<Alert[]> {
        let query = `
            SELECT portfolio_id, alert_type as type, message, alert_data as data, created_at as timestamp
            FROM portfolio_alerts
            WHERE portfolio_id = $1
        `;

        const params: any[] = [portfolioId];

        if (startDate) {
            query += ` AND created_at >= $${params.length + 1}`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND created_at <= $${params.length + 1}`;
            params.push(endDate);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await this.executeQuery(query, params);
        
        if (result.success) {
            return result.data.map((row: any) => ({
                portfolioId: row.portfolio_id,
                type: row.type,
                message: row.message,
                timestamp: row.timestamp.toISOString(),
                data: row.data || {}
            }));
        }

        return [];
    }

    /**
     * Remove alertas antigos
     */
    public async deleteOldAlerts(daysToKeep: number = 30): Promise<ChromiaQueryResult> {
        const query = `
            DELETE FROM portfolio_alerts
            WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
        `;

        const result = await this.executeQuery(query);
        
        if (result.success) {
            console.log(`🧹 Alertas antigos removidos (+ de ${daysToKeep} dias)`);
        }

        return result;
    }

    /**
     * Cria ou atualiza um portfólio
     */
    public async savePortfolio(portfolio: PortfolioData): Promise<ChromiaQueryResult> {
        const upsertQuery = `
            INSERT INTO portfolios (portfolio_id, owner_address, name, description, total_value, risk_score, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT (portfolio_id) 
            DO UPDATE SET 
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                total_value = EXCLUDED.total_value,
                risk_score = EXCLUDED.risk_score,
                last_updated = CURRENT_TIMESTAMP
            RETURNING id
        `;

        const params = [
            portfolio.portfolioId,
            portfolio.ownerAddress,
            portfolio.name || null,
            portfolio.description || null,
            portfolio.totalValue,
            portfolio.riskScore
        ];

        const result = await this.executeQuery(upsertQuery, params);

        // Salvar ativos do portfólio
        if (result.success && portfolio.assets.length > 0) {
            await this.savePortfolioAssets(portfolio.portfolioId, portfolio.assets);
        }

        return result;
    }

    /**
     * Salva ativos de um portfólio
     */
    private async savePortfolioAssets(portfolioId: string, assets: PortfolioAsset[]): Promise<void> {
        // Primeiro remove ativos antigos
        await this.executeQuery('DELETE FROM portfolio_assets WHERE portfolio_id = $1', [portfolioId]);

        // Insere novos ativos
        for (const asset of assets) {
            const query = `
                INSERT INTO portfolio_assets (portfolio_id, asset_symbol, asset_address, amount, value_usd, last_price, weight_percentage)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;

            const params = [
                portfolioId,
                asset.symbol,
                asset.address || null,
                asset.amount,
                asset.valueUsd,
                asset.lastPrice || null,
                asset.weightPercentage || null
            ];

            await this.executeQuery(query, params);
        }
    }

    /**
     * Busca dados de um portfólio
     */
    public async getPortfolio(portfolioId: string): Promise<PortfolioData | null> {
        const portfolioQuery = `
            SELECT portfolio_id, owner_address, name, description, total_value, risk_score, last_updated
            FROM portfolios
            WHERE portfolio_id = $1
        `;

        const portfolioResult = await this.executeQuery(portfolioQuery, [portfolioId]);
        
        if (!portfolioResult.success || portfolioResult.data.length === 0) {
            return null;
        }

        const portfolioRow = portfolioResult.data[0];

        // Buscar ativos do portfólio
        const assetsQuery = `
            SELECT asset_symbol, asset_address, amount, value_usd, last_price, weight_percentage
            FROM portfolio_assets
            WHERE portfolio_id = $1
        `;

        const assetsResult = await this.executeQuery(assetsQuery, [portfolioId]);
        const assets = assetsResult.success ? assetsResult.data.map((row: any) => ({
            symbol: row.asset_symbol,
            address: row.asset_address,
            amount: parseFloat(row.amount),
            valueUsd: parseFloat(row.value_usd),
            lastPrice: row.last_price ? parseFloat(row.last_price) : undefined,
            weightPercentage: row.weight_percentage ? parseFloat(row.weight_percentage) : undefined
        })) : [];

        return {
            portfolioId: portfolioRow.portfolio_id,
            ownerAddress: portfolioRow.owner_address,
            name: portfolioRow.name,
            description: portfolioRow.description,
            totalValue: parseFloat(portfolioRow.total_value),
            riskScore: parseFloat(portfolioRow.risk_score),
            assets,
            lastUpdated: portfolioRow.last_updated
        };
    }

    /**
     * Salva métricas de risco
     */
    public async saveRiskMetrics(metrics: RiskMetrics): Promise<ChromiaQueryResult> {
        const query = `
            INSERT INTO risk_metrics (portfolio_id, volatility, var_95, var_99, sharpe_ratio, max_drawdown, correlation_score, calculated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        const params = [
            metrics.portfolioId,
            metrics.volatility,
            metrics.var95,
            metrics.var99,
            metrics.sharpeRatio,
            metrics.maxDrawdown,
            metrics.correlationScore,
            metrics.calculatedAt
        ];

        return await this.executeQuery(query, params);
    }

    /**
     * Busca métricas de risco mais recentes
     */
    public async getLatestRiskMetrics(portfolioId: string): Promise<RiskMetrics | null> {
        const query = `
            SELECT * FROM risk_metrics
            WHERE portfolio_id = $1
            ORDER BY calculated_at DESC
            LIMIT 1
        `;

        const result = await this.executeQuery(query, [portfolioId]);
        
        if (result.success && result.data.length > 0) {
            const row = result.data[0];
            return {
                portfolioId: row.portfolio_id,
                volatility: parseFloat(row.volatility),
                var95: parseFloat(row.var_95),
                var99: parseFloat(row.var_99),
                sharpeRatio: parseFloat(row.sharpe_ratio),
                maxDrawdown: parseFloat(row.max_drawdown),
                correlationScore: parseFloat(row.correlation_score),
                calculatedAt: row.calculated_at
            };
        }

        return null;
    }

    /**
     * Função auxiliar para determinar severidade do alerta
     */
    private getAlertSeverity(alertType: string): number {
        switch (alertType) {
            case 'critical': return 5;
            case 'warning': return 3;
            case 'info': return 1;
            default: return 1;
        }
    }

    /**
     * Verifica saúde da conexão
     */
    public async healthCheck(): Promise<{ status: string; details: any }> {
        try {
            const result = await this.executeQuery('SELECT NOW() as timestamp, COUNT(*) as alert_count FROM portfolio_alerts');
            
            if (result.success) {
                return {
                    status: 'healthy',
                    details: {
                        database: 'connected',
                        timestamp: result.data[0].timestamp,
                        totalAlerts: result.data[0].alert_count
                    }
                };
            } else {
                return {
                    status: 'unhealthy',
                    details: { error: result.error }
                };
            }
        } catch (error) {
            return {
                status: 'unhealthy',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }

    /**
     * Fecha conexões do pool
     */
    public async close(): Promise<void> {
        await this.pool.end();
        console.log('🔗 Chromia: Conexões PostgreSQL fechadas');
    }
} 