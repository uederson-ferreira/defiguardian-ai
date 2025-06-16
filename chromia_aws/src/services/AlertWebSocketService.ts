import { Server } from 'socket.io';
import { AlertSystemConfig } from '../../config/alert-system.config';
import { ChromiaStorageService } from './ChromiaStorageService';

export class AlertWebSocketService {
    private io: Server;
    private chromiaStorage: ChromiaStorageService;

    constructor(config: AlertSystemConfig, chromiaStorage: ChromiaStorageService) {
        this.io = new Server({
            path: config.websocket.path,
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        this.chromiaStorage = chromiaStorage;
        this.setupWebSocket();
    }

    private setupWebSocket(): void {
        this.io.on('connection', (socket) => {
            console.log('Cliente conectado:', socket.id);

            socket.on('subscribe', (portfolioId: string) => {
                socket.join(`portfolio_${portfolioId}`);
                console.log(`Cliente ${socket.id} inscrito no portfólio ${portfolioId}`);
            });

            socket.on('unsubscribe', (portfolioId: string) => {
                socket.leave(`portfolio_${portfolioId}`);
                console.log(`Cliente ${socket.id} desinscrito do portfólio ${portfolioId}`);
            });

            socket.on('disconnect', () => {
                console.log('Cliente desconectado:', socket.id);
            });
        });
    }

    public async broadcastAlert(portfolioId: string, alert: {
        type: 'warning' | 'critical' | 'info';
        message: string;
        timestamp: string;
        data: any;
    }): Promise<void> {
        // Persiste o alerta no Chromia
        await this.chromiaStorage.saveAlert(portfolioId, alert);

        // Envia o alerta para todos os clientes inscritos neste portfólio
        this.io.to(`portfolio_${portfolioId}`).emit('alert', {
            ...alert,
            portfolioId
        });
    }

    public start(port: number): void {
        this.io.listen(port);
        console.log(`Serviço de WebSocket iniciado na porta ${port}`);
    }
} 