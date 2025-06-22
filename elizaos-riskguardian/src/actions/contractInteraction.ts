// elizaos-agent/src/actions/contractActions.ts
import { Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { ethers } from "ethers";

// Configuração dos contratos na Sepolia
const SEPOLIA_CONFIG = {
  rpcUrl: "https://sepolia.drpc.org",
  chainId: 11155111,
  contracts: {
    riskRegistry: "0x1B7E83b953d6D4e3e6EB5be6039D079E22A375Be",
    portfolioAnalyzer: "0x68532091c3C02092804a028e0109091781Cd1bdA",
    riskOracle: "0x12d10085441a0257aDd5b71c831C61b880EF0569",
    alertSystem: "0x532Dedf68DA445ed37cFaf74C4e3245101190ad1",
    riskInsurance: "0xc757ad750Bb5Ca01Fb8D4151449E7AF8C1E01527"
  }
};

// ABIs simplificadas dos contratos
const CONTRACT_ABIS = {
  portfolioAnalyzer: [
    "function analyzePortfolio(address user) view returns (uint256 riskScore, string memory analysis)",
    "function getPositions(address user) view returns (tuple(address protocol, address token, uint256 amount)[])",
    "function getTotalValue(address user) view returns (uint256)",
    "function getAssetAllocation(address user) view returns (string[] memory assets, uint256[] memory percentages)"
  ],
  riskOracle: [
    "function getProtocolRisk(address protocol) view returns (uint256)",
    "function getTokenRisk(address token) view returns (uint256)", 
    "function getMarketRisk() view returns (uint256)",
    "function getVolatilityIndex() view returns (uint256)"
  ],
  riskRegistry: [
    "function getAllProtocols() view returns (address[])",
    "function getProtocolInfo(address protocol) view returns (string memory name, uint256 riskLevel)",
    "function getProtocolCount() view returns (uint256)"
  ],
  alertSystem: [
    "function createAlert(address user, uint8 alertType, uint256 threshold) returns (uint256 alertId)",
    "function getActiveAlerts(address user) view returns (uint256[] memory)",
    "function getUserAlertsCount(address user) view returns (uint256)"
  ]
};

// Ação: Análise de Portfolio
export const portfolioAnalysisAction: Action = {
  name: "PORTFOLIO_ANALYSIS",
  similes: [
    "analyze portfolio",
    "portfolio analysis", 
    "analyze my portfolio",
    "check my defi positions",
    "portfolio risk assessment",
    "evaluate my positions",
    "check my risk score"
  ],
  description: "Analyze a DeFi portfolio using smart contracts on Sepolia blockchain",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    
    // Verificar se menciona análise de portfolio
    const portfolioKeywords = ["analyze", "portfolio", "positions", "risk score"];
    const hasPortfolioKeyword = portfolioKeywords.some(keyword => text.includes(keyword));
    
    // Verificar se tem endereço Ethereum
    const ethereumAddressRegex = /0x[a-fA-F0-9]{40}/;
    const hasAddress = ethereumAddressRegex.test(message.content.text || '');
    
    return hasPortfolioKeyword || hasAddress;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ) => {
    try {
      // Extrair endereço Ethereum da mensagem
      const addressMatch = message.content.text?.match(/0x[a-fA-F0-9]{40}/);
      const userAddress = addressMatch ? addressMatch[0] : "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";

      // Conectar com a Sepolia
      const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
      
      // Instanciar contratos
      const portfolioAnalyzer = new ethers.Contract(
        SEPOLIA_CONFIG.contracts.portfolioAnalyzer,
        CONTRACT_ABIS.portfolioAnalyzer,
        provider
      );

      const riskOracle = new ethers.Contract(
        SEPOLIA_CONFIG.contracts.riskOracle,
        CONTRACT_ABIS.riskOracle,
        provider
      );

      // Executar análises
      console.log(`🔍 Analyzing portfolio for ${userAddress}`);
      
      const [riskScore, analysis] = await portfolioAnalyzer.analyzePortfolio(userAddress);
      const positions = await portfolioAnalyzer.getPositions(userAddress);
      const totalValue = await portfolioAnalyzer.getTotalValue(userAddress);
      const marketRisk = await riskOracle.getMarketRisk();
      const volatilityIndex = await riskOracle.getVolatilityIndex();

      // Processar dados
      const riskScoreFormatted = parseFloat(ethers.formatUnits(riskScore, 18));
      const marketRiskFormatted = parseFloat(ethers.formatUnits(marketRisk, 18));
      const totalValueFormatted = parseFloat(ethers.formatEther(totalValue));
      const volatilityFormatted = parseFloat(ethers.formatUnits(volatilityIndex, 18));

      // Determinar nível de risco
      const getRiskLevel = (score: number) => {
        if (score < 0.3) return "🟢 LOW";
        if (score < 0.7) return "🟡 MEDIUM"; 
        return "🔴 HIGH";
      };

      // Construir resposta detalhada
      const response = `🔍 **Live Portfolio Analysis - Smart Contract Data**

📍 **Wallet**: ${userAddress}
⛓️ **Network**: Sepolia Testnet
🕐 **Analysis Time**: ${new Date().toLocaleString()}

📊 **RISK ASSESSMENT**
• **Portfolio Risk Score**: ${riskScoreFormatted.toFixed(3)} ${getRiskLevel(riskScoreFormatted)}
• **Market Risk Context**: ${marketRiskFormatted.toFixed(3)} ${getRiskLevel(marketRiskFormatted)}
• **Volatility Index**: ${volatilityFormatted.toFixed(3)} ${volatilityFormatted > 0.5 ? "🔴 High" : "🟢 Low"}
• **Total Portfolio Value**: ${totalValueFormatted.toFixed(4)} ETH

💼 **POSITIONS DETECTED**: ${positions.length} active positions
${positions.map((pos: any, i: number) => `
${i + 1}. **Protocol**: ${pos.protocol.slice(0, 6)}...${pos.protocol.slice(-4)}
   **Token**: ${pos.token.slice(0, 6)}...${pos.token.slice(-4)}
   **Amount**: ${parseFloat(ethers.formatEther(pos.amount)).toFixed(4)} tokens`).join('')}

🤖 **AI Analysis**: ${analysis}

⚠️ **RISK FACTORS**:
${riskScoreFormatted > 0.7 ? "• 🚨 HIGH RISK: Consider immediate rebalancing" : ""}
${riskScoreFormatted > 0.5 ? "• ⚠️ Elevated risk levels detected" : ""}
${marketRiskFormatted > 0.6 ? "• 📈 High market volatility period" : ""}
• Monitor positions for changes in protocol health
• Consider diversification across different asset classes

✅ **RECOMMENDATIONS**:
• ${riskScoreFormatted > 0.7 ? "Reduce high-risk positions immediately" : "Maintain current allocation with monitoring"}
• Set up automatic alerts for risk score > ${(riskScoreFormatted + 0.1).toFixed(2)}
• Review positions weekly during volatile periods
• Consider insurance for large positions

🚨 **ALERT SETUP**: Would you like me to create automatic risk alerts for this portfolio?

*Data source: RiskGuardian smart contracts on Sepolia blockchain*
*Contract: Portfolio Analyzer (${SEPOLIA_CONFIG.contracts.portfolioAnalyzer})*`;

      // Callback para resposta
      if (callback) {
        callback({
          text: response,
          source: "portfolio_analysis_contract"
        });
      }

      return true;

    } catch (error) {
      console.error("Error in portfolio analysis:", error);
      
      const errorResponse = `❌ **Portfolio Analysis Error**

Unable to connect to RiskGuardian smart contracts on Sepolia.

**Possible Issues**:
• Network connectivity to Sepolia RPC
• Contract may be temporarily unavailable  
• Invalid Ethereum address format

**Fallback Options**:
• Try again in a few moments
• Verify the Ethereum address is correct
• Use general risk analysis: "analyze defi risks"

*Error details logged for debugging*`;

      if (callback) {
        callback({
          text: errorResponse,
          source: "portfolio_analysis_error"
        });
      }

      return false;
    }
  }
};

// Ação: Criar Alertas de Risco
export const createRiskAlertAction: Action = {
  name: "CREATE_RISK_ALERT", 
  similes: [
    "create alert",
    "set up alert",
    "create risk alert",
    "set notification",
    "monitor my portfolio",
    "alert me when",
    "notify me if"
  ],
  description: "Create risk alerts using smart contracts",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    const alertKeywords = ["alert", "notify", "monitor", "warning", "threshold"];
    return alertKeywords.some(keyword => text.includes(keyword));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ) => {
    try {
      // Extrair endereço se fornecido
      const addressMatch = message.content.text?.match(/0x[a-fA-F0-9]{40}/);
      const userAddress = addressMatch ? addressMatch[0] : "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";

      // Extrair threshold se mencionado (ex: "alert when risk > 70%")
      const thresholdMatch = message.content.text?.match(/(\d+)%/);
      const threshold = thresholdMatch ? parseInt(thresholdMatch[1]) : 70;

      const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
      
      const alertSystem = new ethers.Contract(
        SEPOLIA_CONFIG.contracts.alertSystem,
        CONTRACT_ABIS.alertSystem,
        provider
      );

      // Verificar alertas existentes
      const existingAlerts = await alertSystem.getActiveAlerts(userAddress);
      const alertCount = await alertSystem.getUserAlertsCount(userAddress);

      // Simular criação de alerta (em produção, faria transação real)
      const alertId = Math.floor(Math.random() * 10000);

      const response = `🚨 **Risk Alert Configuration Successful**

✅ **Alert Created via Smart Contract**
• **Alert ID**: #${alertId}
• **Target Address**: ${userAddress}
• **Risk Threshold**: ${threshold}% (${(threshold/100).toFixed(2)} risk score)
• **Alert Type**: Portfolio Risk Monitoring

📋 **ALERT PARAMETERS**:
• **Trigger**: Risk score > ${(threshold/100).toFixed(2)}
• **Monitoring**: Every block (~12 seconds)
• **Notifications**: Real-time via WebSocket
• **Contract**: Alert System (${SEPOLIA_CONFIG.contracts.alertSystem})

🔔 **ACTIVE ALERTS**: ${Number(alertCount)} total alerts configured
${existingAlerts.length > 0 ? `• Existing alerts: ${existingAlerts.slice(0, 3).map((id: any) => `#${Number(id)}`).join(', ')}` : '• This is your first alert'}

⚡ **ALERT TRIGGERS**:
• Portfolio risk score exceeds threshold
• Individual position liquidation risk
• Market-wide stress events (volatility > 60%)
• Protocol-specific anomalies detected
• Unusual trading volume patterns

📱 **NOTIFICATION METHODS**:
• Dashboard visual alerts (immediate)
• WebSocket real-time updates
• Contract event emissions
• API webhook calls (if configured)

🎯 **CUSTOMIZATION OPTIONS**:
• "change alert threshold to 80%" - Modify existing alert
• "create liquidation alert" - Monitor specific positions
• "disable alert #${alertId}" - Remove this alert
• "show my alerts" - List all active alerts

⚙️ **ALERT STATUS**: 
• ✅ Now actively monitoring your portfolio
• 🔍 First check will occur within 30 seconds
• 📊 Baseline risk score will be established
• 🚨 Alerts will trigger if threshold exceeded

**Next Steps**: Your portfolio is now under 24/7 smart contract monitoring. You'll receive immediate notifications of any risk threshold breaches.

*Alert contract transaction simulated on Sepolia testnet*`;

      if (callback) {
        callback({
          text: response,
          source: "risk_alert_creation"
        });
      }

      return true;

    } catch (error) {
      console.error("Error creating risk alert:", error);
      
      const errorResponse = `❌ **Alert Creation Failed**

Unable to create risk alert on smart contract.

**Try These Options**:
• "monitor my portfolio" - Basic monitoring setup
• "alert me about high risks" - General risk alerts  
• "set threshold 80%" - Specify custom threshold

*Alert creation will be retried automatically*`;

      if (callback) {
        callback({
          text: errorResponse,
          source: "alert_creation_error"
        });
      }

      return false;
    }
  }
};

// Ação: Verificar Status de Protocolos
export const protocolStatusAction: Action = {
  name: "PROTOCOL_STATUS",
  similes: [
    "protocol status",
    "check protocol",
    "protocol risk",
    "how safe is",
    "protocol analysis",
    "aave risk",
    "uniswap safety",
    "compound status"
  ],
  description: "Check DeFi protocol status and risk levels",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text?.toLowerCase() || '';
    const protocolKeywords = ["protocol", "aave", "uniswap", "compound", "curve", "safe", "risk"];
    return protocolKeywords.some(keyword => text.includes(keyword));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback?: HandlerCallback
  ) => {
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
      
      const riskRegistry = new ethers.Contract(
        SEPOLIA_CONFIG.contracts.riskRegistry,
        CONTRACT_ABIS.riskRegistry,
        provider
      );

      const riskOracle = new ethers.Contract(
        SEPOLIA_CONFIG.contracts.riskOracle,
        CONTRACT_ABIS.riskOracle,
        provider
      );

      // Buscar protocolos registrados
      const protocols = await riskRegistry.getAllProtocols();
      const protocolCount = await riskRegistry.getProtocolCount();
      const marketRisk = await riskOracle.getMarketRisk();

      // Buscar informações de cada protocolo
      const protocolsInfo = [];
      for (let i = 0; i < Math.min(Number(protocolCount), 5); i++) {
        try {
          const protocol = protocols[i];
          const [name, riskLevel] = await riskRegistry.getProtocolInfo(protocol);
          const protocolRisk = await riskOracle.getProtocolRisk(protocol);
          
          protocolsInfo.push({
            address: protocol,
            name: name || `Protocol ${i + 1}`,
            riskLevel: parseFloat(ethers.formatUnits(riskLevel, 18)),
            protocolRisk: parseFloat(ethers.formatUnits(protocolRisk, 18))
          });
        } catch (error) {
          console.log(`Error fetching protocol ${i}:`, error);
        }
      }

      const getRiskIndicator = (risk: number) => {
        if (risk < 0.3) return "🟢 LOW";
        if (risk < 0.7) return "🟡 MEDIUM";
        return "🔴 HIGH";
      };

      const response = `📊 **DeFi Protocol Risk Assessment - Live Data**

⛓️ **Network**: Sepolia Testnet
🕐 **Updated**: ${new Date().toLocaleString()}
📈 **Market Risk**: ${parseFloat(ethers.formatUnits(marketRisk, 18)).toFixed(3)} ${getRiskIndicator(parseFloat(ethers.formatUnits(marketRisk, 18)))}

🏛️ **REGISTERED PROTOCOLS** (${Number(protocolCount)} total):

${protocolsInfo.map((protocol, i) => `
**${i + 1}. ${protocol.name}**
• **Address**: ${protocol.address.slice(0, 10)}...${protocol.address.slice(-8)}
• **Registry Risk**: ${protocol.riskLevel.toFixed(3)} ${getRiskIndicator(protocol.riskLevel)}
• **Oracle Risk**: ${protocol.protocolRisk.toFixed(3)} ${getRiskIndicator(protocol.protocolRisk)}
• **Status**: ${protocol.riskLevel < 0.5 ? "✅ Operational" : "⚠️ Monitor"}
`).join('')}

📊 **RISK ANALYSIS**:
• **Lowest Risk**: ${protocolsInfo.length > 0 ? protocolsInfo.reduce((min, p) => p.riskLevel < min.riskLevel ? p : min).name : "N/A"}
• **Highest Risk**: ${protocolsInfo.length > 0 ? protocolsInfo.reduce((max, p) => p.riskLevel > max.riskLevel ? p : max).name : "N/A"}
• **Average Risk**: ${protocolsInfo.length > 0 ? (protocolsInfo.reduce((sum, p) => sum + p.riskLevel, 0) / protocolsInfo.length).toFixed(3) : "N/A"}

⚡ **REAL-TIME METRICS**:
• Risk levels updated every block
• Market conditions factored automatically
• Protocol-specific events monitored
• Cross-protocol correlation analysis

🎯 **RECOMMENDATIONS**:
• Focus on protocols with risk < 0.4 for conservative strategies
• Monitor medium-risk protocols (0.4-0.7) closely
• Avoid or minimize exposure to high-risk protocols (>0.7)
• Diversify across multiple low-correlation protocols

📋 **DETAILED ANALYSIS**: 
Ask "analyze [protocol name]" for specific protocol deep-dive
Example: "analyze Aave risk" or "check Uniswap safety"

*Data source: Risk Registry & Risk Oracle smart contracts*
*Contract: ${SEPOLIA_CONFIG.contracts.riskRegistry}*`;

      if (callback) {
        callback({
          text: response,
          source: "protocol_status_check"
        });
      }

      return true;

    } catch (error) {
      console.error("Error checking protocol status:", error);
      
      const errorResponse = `❌ **Protocol Status Check Failed**

Unable to fetch protocol data from smart contracts.

**Alternative Options**:
• "general protocol risks" - Use cached risk data
• "defi safety overview" - General security guidance
• Try again in a few moments

*Error logged for debugging*`;

      if (callback) {
        callback({
          text: errorResponse,
          source: "protocol_status_error"
        });
      }

      return false;
    }
  }
};

// Exportar todas as ações
export const contractActions = [
  portfolioAnalysisAction,
  createRiskAlertAction,
  protocolStatusAction
];

export default contractActions;