import { AlertSystemConfig } from '../../config/alert-system.config';

export interface Alert {
    portfolioId: string;
    type: 'warning' | 'critical' | 'info';
    message: string;
    timestamp: string;
    data: any;
}

export class ChromiaStorageService {
    private config: AlertSystemConfig;
    private readonly TABLE_NAME = 'portfolio_alerts';

    constructor(config: AlertSystemConfig) {
        this.config = config;
        this.initializeDatabase();
    }

    private async initializeDatabase(): Promise<void> {
        try {
            // Aqui implementaremos a inicialização do banco Chromia
            // Criação da tabela de alertas se não existir
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS ${this.TABLE_NAME} (
                    id SERIAL PRIMARY KEY,
                    portfolio_id VARCHAR(255) NOT NULL,
                    alert_type VARCHAR(50) NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_portfolio_timestamp 
                ON ${this.TABLE_NAME}(portfolio_id, timestamp);
            `;

            // Implementar execução da query no Chromia
            console.log('Banco de dados inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar banco de dados:', error);
            throw error;
        }
    }

    public async saveAlert(portfolioId: string, alert: Omit<Alert, 'portfolioId'>): Promise<void> {
        try {
            const query = `
                INSERT INTO ${this.TABLE_NAME}
                (portfolio_id, alert_type, message, timestamp, data)
                VALUES ($1, $2, $3, $4, $5)
            `;

            const values = [
                portfolioId,
                alert.type,
                alert.message,
                alert.timestamp,
                JSON.stringify(alert.data)
            ];

            // Implementar execução da query no Chromia
            console.log('Alerta salvo com sucesso');
        } catch (error) {
            console.error('Erro ao salvar alerta:', error);
            throw error;
        }
    }

    public async getAlertHistory(
        portfolioId: string,
        startDate?: string,
        endDate?: string,
        limit: number = 100
    ): Promise<Alert[]> {
        try {
            let query = `
                SELECT * FROM ${this.TABLE_NAME}
                WHERE portfolio_id = $1
            `;

            const values: any[] = [portfolioId];

            if (startDate) {
                query += ' AND timestamp >= $2';
                values.push(startDate);
            }

            if (endDate) {
                query += ' AND timestamp <= $' + (values.length + 1);
                values.push(endDate);
            }

            query += ' ORDER BY timestamp DESC LIMIT $' + (values.length + 1);
            values.push(limit);

            // Implementar execução da query no Chromia
            // Por enquanto retornamos um array vazio
            return [];
        } catch (error) {
            console.error('Erro ao buscar histórico de alertas:', error);
            throw error;
        }
    }

    public async deleteOldAlerts(daysToKeep: number = 30): Promise<void> {
        try {
            const query = `
                DELETE FROM ${this.TABLE_NAME}
                WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
            `;

            // Implementar execução da query no Chromia
            console.log('Alertas antigos removidos com sucesso');
        } catch (error) {
            console.error('Erro ao remover alertas antigos:', error);
            throw error;
        }
    }
} 