import { defaultConfig } from '../config/alert-system.config';
import { AlertOrchestrator } from './services/AlertOrchestrator';

async function main() {
    try {
        const orchestrator = new AlertOrchestrator(defaultConfig);
        await orchestrator.start();

        // Exemplo de uso
        const mockPortfolioData = {
            totalValue: 100000,
            stopLoss: 95000,
            volatility: 0.15,
            maxVolatility: 0.2,
            assets: [
                { symbol: 'BTC', amount: 1.5, value: 60000 },
                { symbol: 'ETH', amount: 10, value: 40000 }
            ]
        };

        // Simula atualizações periódicas do portfólio
        setInterval(async () => {
            try {
                await orchestrator.processPortfolioUpdate('portfolio123', mockPortfolioData);
            } catch (error) {
                console.error('Erro ao processar atualização:', error);
            }
        }, 60000); // Atualiza a cada minuto

    } catch (error) {
        console.error('Erro ao iniciar o sistema:', error);
        process.exit(1);
    }
}

main(); 