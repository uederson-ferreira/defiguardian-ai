import { AlertSystemConfig } from '../../config/alert-system.config';
import { AnomalyDetectionService } from './AnomalyDetectionService';
import { AlertWebSocketService } from './AlertWebSocketService';
import { ChromiaStorageService } from './ChromiaStorageService';

export class AlertOrchestrator {
    private anomalyDetection: AnomalyDetectionService;
    private webSocket: AlertWebSocketService;
    private storage: ChromiaStorageService;
    private config: AlertSystemConfig;

    constructor(config: AlertSystemConfig) {
        this.config = config;
        this.storage = new ChromiaStorageService(config);
        this.anomalyDetection = new AnomalyDetectionService(config);
        this.webSocket = new AlertWebSocketService(config, this.storage);
    }

    public async start(): Promise<void> {
        try {
            // Inicia o serviço WebSocket
            this.webSocket.start(this.config.websocket.port);

            // Configura limpeza periódica de alertas antigos
            setInterval(() => {
                this.storage.deleteOldAlerts(30).catch(console.error);
            }, 24 * 60 * 60 * 1000); // Executa diariamente

            console.log('Sistema de alertas iniciado com sucesso');
        } catch (error) {
            console.error('Erro ao iniciar sistema de alertas:', error);
            throw error;
        }
    }

    public async processPortfolioUpdate(portfolioId: string, metrics: any): Promise<void> {
        try {
            // Analisa o portfólio em busca de anomalias
            const analysis = await this.anomalyDetection.analyzePortfolio(portfolioId, metrics);

            if (analysis.alerts.length > 0) {
                const alertType = analysis.riskScore >= 0.7 ? 'critical' : 
                                analysis.riskScore >= 0.4 ? 'warning' : 'info';

                // Cria e envia o alerta
                await this.webSocket.broadcastAlert(portfolioId, {
                    type: alertType,
                    message: analysis.alerts.join('; '),
                    timestamp: new Date().toISOString(),
                    data: {
                        riskScore: analysis.riskScore,
                        metrics,
                        isAnomaly: analysis.isAnomaly
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao processar atualização do portfólio:', error);
            throw error;
        }
    }

    public async getPortfolioAlertHistory(
        portfolioId: string,
        startDate?: string,
        endDate?: string
    ): Promise<any[]> {
        return this.storage.getAlertHistory(portfolioId, startDate, endDate);
    }
} 