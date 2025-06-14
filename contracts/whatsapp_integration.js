// =============================================================================
// 📱 RiskGuardian AI - WhatsApp Smart Contracts Integration
// =============================================================================
// Real-time contract monitoring and notifications via WhatsApp
// Portfolio alerts, risk warnings, and contract status updates
// =============================================================================

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Import contract ABIs
const RiskRegistryABI = require('./docs/abi/RiskRegistry.json');
const PortfolioRiskAnalyzerABI = require('./docs/abi/PortfolioRiskAnalyzer.json');
const RiskInsuranceABI = require('./docs/abi/RiskInsurance.json');

class RiskGuardianWhatsAppBot {
    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(
            process.env.ETHEREUM_RPC_URL || 'http://localhost:8545'
        );
        
        // Contract addresses - update these after deployment
        this.contracts = {
            riskRegistry: null,
            portfolioAnalyzer: null,
            riskInsurance: null
        };
        
        this.users = new Map(); // Store user wallets and preferences
        this.alertThresholds = {
            HIGH_RISK: 8000,    // 80% risk score
            MEDIUM_RISK: 6000,  // 60% risk score
            LOW_RISK: 4000      // 40% risk score
        };
        
        this.loadContractAddresses();
        this.setupContracts();
        this.startMonitoring();
    }

    /**
     * Load deployed contract addresses from broadcast files
     */
    loadContractAddresses() {
        try {
            const broadcastPath = './broadcast/Deploy.s.sol/31337/run-latest.json';
            if (fs.existsSync(broadcastPath)) {
                const deployment = JSON.parse(fs.readFileSync(broadcastPath, 'utf8'));
                
                // Extract contract addresses from deployment
                deployment.transactions.forEach(tx => {
                    if (tx.contractName === 'RiskRegistry') {
                        this.contracts.riskRegistry = tx.contractAddress;
                    } else if (tx.contractName === 'PortfolioRiskAnalyzer') {
                        this.contracts.portfolioAnalyzer = tx.contractAddress;
                    } else if (tx.contractName === 'RiskInsurance') {
                        this.contracts.riskInsurance = tx.contractAddress;
                    }
                });
                
                console.log('📋 Contract addresses loaded:', this.contracts);
            } else {
                console.log('⚠️ No deployment found, using default addresses');
                // Use default addresses for testing
                this.contracts = {
                    riskRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
                    portfolioAnalyzer: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
                    riskInsurance: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
                };
            }
        } catch (error) {
            console.error('❌ Error loading contract addresses:', error);
        }
    }

    /**
     * Setup contract instances
     */
    setupContracts() {
        try {
            this.riskRegistry = new ethers.Contract(
                this.contracts.riskRegistry,
                RiskRegistryABI,
                this.provider
            );
            
            this.portfolioAnalyzer = new ethers.Contract(
                this.contracts.portfolioAnalyzer,
                PortfolioRiskAnalyzerABI,
                this.provider
            );
            
            this.riskInsurance = new ethers.Contract(
                this.contracts.riskInsurance,
                RiskInsuranceABI,
                this.provider
            );
            
            console.log('✅ Smart contracts initialized');
        } catch (error) {
            console.error('❌ Error setting up contracts:', error);
        }
    }

    /**
     * Start monitoring blockchain events
     */
    startMonitoring() {
        console.log('👁️ Starting blockchain monitoring...');
        
        // Monitor risk metrics updates
        this.riskRegistry.on('RiskMetricsUpdated', (protocol, overallRisk, event) => {
            this.handleRiskUpdate(protocol, overallRisk, event);
        });
        
        // Monitor portfolio updates
        this.portfolioAnalyzer.on('PortfolioUpdated', (user, totalValue, riskScore, event) => {
            this.handlePortfolioUpdate(user, totalValue, riskScore, event);
        });
        
        // Monitor insurance claims
        this.riskInsurance.on('ClaimPaid', (policyId, holder, amount, event) => {
            this.handleInsuranceClaim(policyId, holder, amount, event);
        });
        
        console.log('✅ Event monitoring started');
    }

    /**
     * Handle WhatsApp commands for portfolio management
     */
    async handleWhatsAppCommand(phoneNumber, message) {
        try {
            const command = message.toLowerCase().trim();
            
            if (command.startsWith('/register')) {
                return await this.handleRegisterCommand(phoneNumber, command);
            } else if (command.startsWith('/portfolio')) {
                return await this.handlePortfolioCommand(phoneNumber);
            } else if (command.startsWith('/risk')) {
                return await this.handleRiskCommand(phoneNumber, command);
            } else if (command.startsWith('/insurance')) {
                return await this.handleInsuranceCommand(phoneNumber);
            } else if (command.startsWith('/alerts')) {
                return await this.handleAlertsCommand(phoneNumber, command);
            } else if (command === '/help') {
                return this.getHelpMessage();
            } else {
                return this.getUnknownCommandMessage();
            }
        } catch (error) {
            console.error('❌ Error handling WhatsApp command:', error);
            return '❌ Ocorreu um erro ao processar seu comando. Tente novamente.';
        }
    }

    /**
     * Register user wallet address
     */
    async handleRegisterCommand(phoneNumber, command) {
        const parts = command.split(' ');
        if (parts.length !== 2) {
            return '❌ Uso correto: /register 0x1234567890123456789012345678901234567890';
        }
        
        const walletAddress = parts[1];
        if (!ethers.utils.isAddress(walletAddress)) {
            return '❌ Endereço de carteira inválido. Use um endereço Ethereum válido.';
        }
        
        this.users.set(phoneNumber, {
            walletAddress: walletAddress,
            alertsEnabled: true,
            riskThreshold: this.alertThresholds.MEDIUM_RISK
        });
        
        return `✅ Carteira registrada com sucesso!\n\n` +
               `📱 Telefone: ${phoneNumber}\n` +
               `💼 Carteira: ${walletAddress}\n\n` +
               `Agora você receberá alertas sobre seu portfólio DeFi.\n` +
               `Use /help para ver todos os comandos disponíveis.`;
    }

    /**
     * Get portfolio analysis
     */
    async handlePortfolioCommand(phoneNumber) {
        const user = this.users.get(phoneNumber);
        if (!user) {
            return '❌ Primeiro registre sua carteira com /register 0xSuaCarteira';
        }
        
        try {
            const analysis = await this.portfolioAnalyzer.getPortfolioAnalysis(user.walletAddress);
            const positions = await this.portfolioAnalyzer.getUserPositions(user.walletAddress);
            
            if (!analysis.isValid || positions.length === 0) {
                return '📊 *Análise do Portfólio*\n\n' +
                       '🔍 Nenhuma posição encontrada em seu portfólio.\n' +
                       'Adicione posições DeFi para receber análises de risco.';
            }
            
            const riskLevel = this.getRiskLevel(analysis.overallRisk);
            const totalValueEth = ethers.utils.formatEther(analysis.totalValue);
            
            let message = `📊 *Análise do Portfólio*\n\n`;
            message += `💰 Valor Total: ${parseFloat(totalValueEth).toFixed(4)} ETH\n`;
            message += `${riskLevel.emoji} Risco Geral: ${(analysis.overallRisk / 100).toFixed(1)}%\n`;
            message += `🎯 Diversificação: ${(analysis.diversificationScore / 100).toFixed(1)}%\n`;
            message += `📅 Última Atualização: ${new Date(analysis.timestamp * 1000).toLocaleString('pt-BR')}\n\n`;
            
            message += `🏛️ *Posições (${positions.length}):*\n`;
            for (let i = 0; i < Math.min(positions.length, 5); i++) {
                const pos = positions[i];
                const protocol = await this.getProtocolName(pos.protocol);
                const amount = ethers.utils.formatEther(pos.amount);
                message += `• ${protocol}: ${parseFloat(amount).toFixed(4)} ETH\n`;
            }
            
            if (positions.length > 5) {
                message += `• ... e mais ${positions.length - 5} posições\n`;
            }
            
            message += `\n${riskLevel.advice}`;
            
            return message;
        } catch (error) {
            console.error('Error getting portfolio:', error);
            return '❌ Erro ao obter análise do portfólio. Tente novamente.';
        }
    }

    /**
     * Get risk information for a specific protocol
     */
    async handleRiskCommand(phoneNumber, command) {
        const parts = command.split(' ');
        if (parts.length !== 2) {
            return '❌ Uso correto: /risk 0xEnderecoDoProtocolo\n\n' +
                   'Exemplo: /risk 0x1F98431c8aD98523631AE4a59f267346ea31F984';
        }
        
        const protocolAddress = parts[1];
        if (!ethers.utils.isAddress(protocolAddress)) {
            return '❌ Endereço de protocolo inválido. Use um endereço Ethereum válido.';
        }
        
        try {
            const protocol = await this.riskRegistry.getProtocol(protocolAddress);
            
            if (protocol.protocolAddress === ethers.constants.AddressZero) {
                return '❌ Protocolo não encontrado no registro de riscos.';
            }
            
            const metrics = protocol.riskMetrics;
            const riskLevel = this.getRiskLevel(metrics.overallRisk);
            
            let message = `🔍 *Análise de Risco do Protocolo*\n\n`;
            message += `🏛️ Nome: ${protocol.name}\n`;
            message += `📂 Categoria: ${protocol.category}\n`;
            message += `📊 Risco Geral: ${(metrics.overallRisk / 100).toFixed(1)}% ${riskLevel.emoji}\n\n`;
            
            message += `📈 *Métricas Detalhadas:*\n`;
            message += `• Volatilidade: ${(metrics.volatilityScore / 100).toFixed(1)}%\n`;
            message += `• Liquidez: ${(metrics.liquidityScore / 100).toFixed(1)}%\n`;
            message += `• Smart Contract: ${(metrics.smartContractScore / 100).toFixed(1)}%\n`;
            message += `• Governança: ${(metrics.governanceScore / 100).toFixed(1)}%\n\n`;
            
            message += `📅 Última Atualização: ${new Date(metrics.lastUpdated * 1000).toLocaleString('pt-BR')}\n\n`;
            message += riskLevel.advice;
            
            return message;
        } catch (error) {
            console.error('Error getting protocol risk:', error);
            return '❌ Erro ao obter informações de risco. Tente novamente.';
        }
    }

    /**
     * Get insurance information
     */
    async handleInsuranceCommand(phoneNumber) {
        const user = this.users.get(phoneNumber);
        if (!user) {
            return '❌ Primeiro registre sua carteira com /register 0xSuaCarteira';
        }
        
        try {
            const policies = await this.riskInsurance.getUserPolicies(user.walletAddress);
            
            if (policies.length === 0) {
                return '🛡️ *Seguros DeFi*\n\n' +
                       '📋 Você não possui nenhuma apólice de seguro ativa.\n\n' +
                       '💡 Considere contratar um seguro para proteger seu portfólio contra riscos elevados.\n' +
                       'Acesse nossa plataforma para criar uma apólice.';
            }
            
            let message = `🛡️ *Suas Apólices de Seguro*\n\n`;
            message += `📊 Total de Apólices: ${policies.length}\n\n`;
            
            for (let i = 0; i < Math.min(policies.length, 3); i++) {
                const policyId = policies[i];
                const policy = await this.riskInsurance.policies(policyId);
                
                const coverage = ethers.utils.formatEther(policy.coverageAmount);
                const premium = ethers.utils.formatEther(policy.premium);
                const status = policy.isActive ? '🟢 Ativa' : '🔴 Inativa';
                
                message += `📄 *Apólice #${policyId}*\n`;
                message += `${status}\n`;
                message += `💰 Cobertura: ${parseFloat(coverage).toFixed(2)} ETH\n`;
                message += `💳 Prêmio: ${parseFloat(premium).toFixed(4)} ETH\n`;
                message += `🎯 Gatilho: ${(policy.riskThreshold / 100).toFixed(1)}%\n\n`;
            }
            
            if (policies.length > 3) {
                message += `... e mais ${policies.length - 3} apólices\n`;
            }
            
            return message;
        } catch (error) {
            console.error('Error getting insurance:', error);
            return '❌ Erro ao obter informações de seguro. Tente novamente.';
        }
    }

    /**
     * Configure alert settings
     */
    async handleAlertsCommand(phoneNumber, command) {
        const user = this.users.get(phoneNumber);
        if (!user) {
            return '❌ Primeiro registre sua carteira com /register 0xSuaCarteira';
        }
        
        const parts = command.split(' ');
        if (parts.length === 1) {
            // Show current settings
            const status = user.alertsEnabled ? '🟢 Ativados' : '🔴 Desativados';
            const threshold = (user.riskThreshold / 100).toFixed(1);
            
            return `🔔 *Configurações de Alertas*\n\n` +
                   `Status: ${status}\n` +
                   `🎯 Limite de Risco: ${threshold}%\n\n` +
                   `Para alterar use:\n` +
                   `/alerts on - Ativar alertas\n` +
                   `/alerts off - Desativar alertas\n` +
                   `/alerts 60 - Definir limite para 60%`;
        }
        
        const setting = parts[1].toLowerCase();
        
        if (setting === 'on') {
            user.alertsEnabled = true;
            this.users.set(phoneNumber, user);
            return '🟢 Alertas ativados! Você receberá notificações sobre mudanças de risco.';
        } else if (setting === 'off') {
            user.alertsEnabled = false;
            this.users.set(phoneNumber, user);
            return '🔴 Alertas desativados.';
        } else if (!isNaN(setting)) {
            const threshold = parseInt(setting) * 100;
            if (threshold < 1000 || threshold > 9000) {
                return '❌ Limite deve estar entre 10% e 90%.';
            }
            user.riskThreshold = threshold;
            this.users.set(phoneNumber, user);
            return `🎯 Limite de risco definido para ${setting}%`;
        } else {
            return '❌ Comando inválido. Use: /alerts [on|off|número]';
        }
    }

    /**
     * Get help message
     */
    getHelpMessage() {
        return `🤖 *RiskGuardian AI - Comandos*\n\n` +
               `📱 *Configuração:*\n` +
               `/register 0xCarteira - Registrar carteira\n` +
               `/alerts [on|off|%] - Configurar alertas\n\n` +
               `📊 *Análises:*\n` +
               `/portfolio - Ver portfólio\n` +
               `/risk 0xProtocolo - Risco de protocolo\n` +
               `/insurance - Ver seguros\n\n` +
               `❓ *Ajuda:*\n` +
               `/help - Este menu\n\n` +
               `💡 *Dica:* Mantenha alertas ativos para monitorar riscos em tempo real!`;
    }

    /**
     * Get unknown command message
     */
    getUnknownCommandMessage() {
        return `❓ Comando não reconhecido.\n\n` +
               `Use /help para ver todos os comandos disponíveis.\n\n` +
               `💡 Certifique-se de que o comando está correto e tente novamente.`;
    }

    /**
     * Handle risk update events
     */
    async handleRiskUpdate(protocolAddress, overallRisk, event) {
        console.log(`📊 Risk update: ${protocolAddress} - ${overallRisk}`);
        
        try {
            const protocol = await this.riskRegistry.getProtocol(protocolAddress);
            const riskLevel = this.getRiskLevel(overallRisk);
            
            // Find users with positions in this protocol
            const affectedUsers = await this.findUsersWithProtocol(protocolAddress);
            
            for (const [phoneNumber, user] of affectedUsers) {
                if (!user.alertsEnabled) continue;
                
                if (overallRisk >= this.alertThresholds.HIGH_RISK) {
                    const message = `🚨 *ALERTA DE ALTO RISCO*\n\n` +
                                  `🏛️ Protocolo: ${protocol.name}\n` +
                                  `📊 Novo Risco: ${(overallRisk / 100).toFixed(1)}%\n` +
                                  `⚠️ Status: ${riskLevel.emoji} ${riskLevel.name}\n\n` +
                                  `💡 Considere revisar sua exposição a este protocolo.`;
                    
                    await this.sendWhatsAppMessage(phoneNumber, message);
                }
            }
        } catch (error) {
            console.error('Error handling risk update:', error);
        }
    }

    /**
     * Handle portfolio update events
     */
    async handlePortfolioUpdate(userAddress, totalValue, riskScore, event) {
        console.log(`📊 Portfolio update: ${userAddress} - Risk: ${riskScore}`);
        
        try {
            const phoneNumber = this.findPhoneByAddress(userAddress);
            if (!phoneNumber) return;
            
            const user = this.users.get(phoneNumber);
            if (!user || !user.alertsEnabled) return;
            
            if (riskScore >= user.riskThreshold) {
                const riskLevel = this.getRiskLevel(riskScore);
                const valueEth = ethers.utils.formatEther(totalValue);
                
                const message = `⚠️ *ALERTA DE PORTFÓLIO*\n\n` +
                              `💰 Valor: ${parseFloat(valueEth).toFixed(4)} ETH\n` +
                              `📊 Risco: ${(riskScore / 100).toFixed(1)}%\n` +
                              `🎯 Seu limite: ${(user.riskThreshold / 100).toFixed(1)}%\n\n` +
                              `${riskLevel.advice}`;
                
                await this.sendWhatsAppMessage(phoneNumber, message);
            }
        } catch (error) {
            console.error('Error handling portfolio update:', error);
        }
    }

    /**
     * Handle insurance claim events
     */
    async handleInsuranceClaim(policyId, holder, amount, event) {
        console.log(`🛡️ Insurance claim: Policy ${policyId} - ${ethers.utils.formatEther(amount)} ETH`);
        
        try {
            const phoneNumber = this.findPhoneByAddress(holder);
            if (!phoneNumber) return;
            
            const amountEth = ethers.utils.formatEther(amount);
            
            const message = `✅ *SEGURO ACIONADO*\n\n` +
                          `📄 Apólice: #${policyId}\n` +
                          `💰 Valor Pago: ${parseFloat(amountEth).toFixed(4)} ETH\n` +
                          `📅 Data: ${new Date().toLocaleString('pt-BR')}\n\n` +
                          `🎉 O pagamento foi processado automaticamente!\n` +
                          `Verifique seu saldo na carteira.`;
            
            await this.sendWhatsAppMessage(phoneNumber, message);
        } catch (error) {
            console.error('Error handling insurance claim:', error);
        }
    }

    /**
     * Send WhatsApp message (implement your WhatsApp API integration here)
     */
    async sendWhatsAppMessage(phoneNumber, message) {
        try {
            // TODO: Implement actual WhatsApp API call
            console.log(`📱 Sending WhatsApp to ${phoneNumber}:`);
            console.log(message);
            console.log('---');
            
            // Example implementation would be:
            // await whatsappApi.sendMessage(phoneNumber, message);
            
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
        }
    }

    /**
     * Helper functions
     */
    getRiskLevel(riskScore) {
        if (riskScore >= this.alertThresholds.HIGH_RISK) {
            return {
                name: 'Alto Risco',
                emoji: '🔴',
                advice: '⚠️ *Recomendação:* Considere reduzir a exposição ou diversificar mais seu portfólio.'
            };
        } else if (riskScore >= this.alertThresholds.MEDIUM_RISK) {
            return {
                name: 'Risco Moderado',
                emoji: '🟡',
                advice: '⚡ *Recomendação:* Monitore de perto e considere ajustar o portfólio se necessário.'
            };
        } else {
            return {
                name: 'Baixo Risco',
                emoji: '🟢',
                advice: '✅ *Status:* Portfólio com risco baixo. Continue monitorando!'
            };
        }
    }

    async getProtocolName(protocolAddress) {
        try {
            const protocol = await this.riskRegistry.getProtocol(protocolAddress);
            return protocol.name || 'Protocolo Desconhecido';
        } catch (error) {
            return 'Protocolo Desconhecido';
        }
    }

    async findUsersWithProtocol(protocolAddress) {
        const affectedUsers = new Map();
        
        for (const [phoneNumber, user] of this.users) {
            try {
                const positions = await this.portfolioAnalyzer.getUserPositions(user.walletAddress);
                const hasProtocol = positions.some(pos => pos.protocol.toLowerCase() === protocolAddress.toLowerCase());
                
                if (hasProtocol) {
                    affectedUsers.set(phoneNumber, user);
                }
            } catch (error) {
                console.error(`Error checking positions for ${phoneNumber}:`, error);
            }
        }
        
        return affectedUsers;
    }

    findPhoneByAddress(address) {
        for (const [phoneNumber, user] of this.users) {
            if (user.walletAddress.toLowerCase() === address.toLowerCase()) {
                return phoneNumber;
            }
        }
        return null;
    }

    /**
     * Initialize the bot
     */
    static async initialize() {
        console.log('🚀 Initializing RiskGuardian WhatsApp Bot...');
        const bot = new RiskGuardianWhatsAppBot();
        
        // Save instance for external access
        global.riskGuardianBot = bot;
        
        console.log('✅ WhatsApp bot initialized and monitoring started!');
        return bot;
    }
}

// Export for use in other modules
module.exports = RiskGuardianWhatsAppBot;

// Initialize if run directly
if (require.main === module) {
    RiskGuardianWhatsAppBot.initialize().catch(console.error);
}
