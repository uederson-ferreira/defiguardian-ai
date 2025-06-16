import { SageMakerRuntime } from 'aws-sdk';
import { AlertSystemConfig } from '../../config/alert-system.config';

export class AnomalyDetectionService {
    private sageMaker: SageMakerRuntime;
    private config: AlertSystemConfig;

    constructor(config: AlertSystemConfig) {
        this.config = config;
        this.sageMaker = new SageMakerRuntime({
            region: config.aws.region,
            credentials: {
                accessKeyId: config.aws.credentials.accessKeyId,
                secretAccessKey: config.aws.credentials.secretAccessKey
            }
        });
    }

    async detectAnomaly(portfolioData: any): Promise<boolean> {
        try {
            const params = {
                EndpointName: this.config.ml.modelEndpoint,
                Body: JSON.stringify(portfolioData),
                ContentType: 'application/json'
            };

            const response = await this.sageMaker.invokeEndpoint(params).promise();
            const prediction = JSON.parse(response.Body.toString());
            
            return prediction.anomalyScore > this.config.ml.anomalyThreshold;
        } catch (error) {
            console.error('Erro na detecção de anomalia:', error);
            throw error;
        }
    }

    async analyzePortfolio(portfolioId: string, metrics: any): Promise<{
        isAnomaly: boolean;
        riskScore: number;
        alerts: string[];
    }> {
        const alerts: string[] = [];
        let riskScore = 0;

        // Análise de métricas básicas
        if (metrics.totalValue < metrics.stopLoss) {
            alerts.push('Stop Loss atingido');
            riskScore += 0.4;
        }

        if (metrics.volatility > metrics.maxVolatility) {
            alerts.push('Alta volatilidade detectada');
            riskScore += 0.3;
        }

        // Detecção de anomalias via ML
        const isAnomaly = await this.detectAnomaly({
            portfolioId,
            metrics,
            timestamp: new Date().toISOString()
        });

        if (isAnomaly) {
            alerts.push('Padrão anômalo detectado pelo ML');
            riskScore += 0.3;
        }

        return {
            isAnomaly,
            riskScore,
            alerts
        };
    }
} 