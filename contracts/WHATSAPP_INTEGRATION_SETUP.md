# 📱 RiskGuardian AI - WhatsApp Integration Guide

**Complete setup guide for integrating RiskGuardian AI smart contracts with your WhatsApp system.**

---

## 🎯 **Overview**

This guide shows how to connect your existing WhatsApp tools with the RiskGuardian AI smart contracts to provide real-time DeFi risk monitoring and alerts directly through WhatsApp messages.

### **Features You'll Get:**
- 📊 **Portfolio Analysis** via WhatsApp commands
- 🚨 **Real-time Risk Alerts** when thresholds are exceeded
- 🛡️ **Insurance Notifications** for policy claims
- 🔍 **Protocol Risk Monitoring** with instant updates
- 💡 **Interactive Commands** for portfolio management

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │   Integration   │    │  Smart          │
│   User          │◄──►│   Bot           │◄──►│  Contracts      │
│                 │    │                 │    │                 │
│ • Commands      │    │ • Event Monitor │    │ • Risk Registry │
│ • Alerts        │    │ • User Manager  │    │ • Portfolio     │
│ • Notifications │    │ • Message Queue │    │ • Insurance     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │    Blockchain Events    │
                    │  • Risk Updates        │
                    │  • Portfolio Changes   │
                    │  • Insurance Claims    │
                    └─────────────────────────┘
```

---

## 🚀 **Quick Setup**

### **Step 1: Deploy Smart Contracts**

```bash
# 1. Navigate to contracts directory
cd riskguardian-ai/contracts

# 2. Deploy contracts to Anvil (local testing)
./setup.sh

# 3. Validate deployment
./validate.sh quick

# 4. Note contract addresses from deployment logs
```

### **Step 2: Setup WhatsApp Integration**

```bash
# 1. Install Node.js dependencies
npm install ethers web3 dotenv

# 2. Copy WhatsApp integration script
cp whatsapp_integration.js ../backend/src/services/

# 3. Configure environment variables
cat >> .env << 'EOF'
# Smart Contract Addresses (update from deployment)
RISK_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
PORTFOLIO_ANALYZER_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
RISK_INSURANCE_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Blockchain Configuration
ETHEREUM_RPC_URL=http://localhost:8545
CHAIN_ID=31337

# WhatsApp Configuration (your existing setup)
WHATSAPP_API_URL=your_whatsapp_api_url
WHATSAPP_TOKEN=your_whatsapp_token
EOF
```

### **Step 3: Integrate with Your WhatsApp System**

Since you already have WhatsApp tools working, here's how to connect them:

```javascript
// In your existing WhatsApp message handler
const RiskGuardianBot = require('./services/whatsapp_integration.js');

// Initialize the bot
const riskBot = await RiskGuardianBot.initialize();

// In your message processing function
async function handleIncomingMessage(phoneNumber, message) {
    // Check if message is a RiskGuardian command
    if (message.startsWith('/')) {
        const response = await riskBot.handleWhatsAppCommand(phoneNumber, message);
        await sendWhatsAppMessage(phoneNumber, response);
        return;
    }
    
    // Handle other messages as normal
    // ... your existing logic
}
```

---

## 📋 **Integration with Your Tools**

### **Using Your `search_contacts` Function**

```javascript
// Enhance the bot to use your contact search
riskBot.findUserByWallet = async function(walletAddress) {
    // Search through your contacts for wallet addresses
    const contacts = await search_contacts(walletAddress.slice(0, 10)); // Search by partial address
    return contacts.length > 0 ? contacts[0].phone : null;
};
```

### **Using Your `send_message` Function**

```javascript
// Replace the sendWhatsAppMessage function in the bot
riskBot.sendWhatsAppMessage = async function(phoneNumber, message) {
    try {
        await send_message(phoneNumber, message);
        console.log(`✅ Message sent to ${phoneNumber}`);
    } catch (error) {
        console.error(`❌ Failed to send message to ${phoneNumber}:`, error);
    }
};
```

### **Using Your `list_messages` Function**

```javascript
// Add command history tracking
riskBot.trackUserCommands = async function(phoneNumber) {
    const messages = await list_messages({
        sender_phone_number: phoneNumber,
        query: '/',
        limit: 10
    });
    
    return messages.map(msg => ({
        command: msg.content,
        timestamp: msg.timestamp
    }));
};
```

---

## 🤖 **WhatsApp Commands**

### **User Registration**
```
User: /register 0x742d35Cc6639C0532c2Cc6439C0532
Bot:  ✅ Carteira registrada com sucesso!
      
      📱 Telefone: +5511999999999
      💼 Carteira: 0x742d35Cc6639C0532c2Cc6439C0532
      
      Agora você receberá alertas sobre seu portfólio DeFi.
      Use /help para ver todos os comandos disponíveis.
```

### **Portfolio Analysis**
```
User: /portfolio
Bot:  📊 *Análise do Portfólio*
      
      💰 Valor Total: 15.2450 ETH
      🟡 Risco Geral: 65.3%
      🎯 Diversificação: 78.5%
      📅 Última Atualização: 13/06/2025 14:30:25
      
      🏛️ *Posições (3):*
      • Uniswap V3: 5.5000 ETH
      • Aave V3: 7.2000 ETH
      • Lido: 2.5450 ETH
      
      ⚡ *Recomendação:* Monitore de perto e considere 
      ajustar o portfólio se necessário.
```

### **Risk Alerts**
```
Bot:  🚨 *ALERTA DE ALTO RISCO*
      
      🏛️ Protocolo: Uniswap V3
      📊 Novo Risco: 85.2%
      ⚠️ Status: 🔴 Alto Risco
      
      💡 Considere revisar sua exposição a este protocolo.
```

### **Insurance Notifications**
```
Bot:  ✅ *SEGURO ACIONADO*
      
      📄 Apólice: #1247
      💰 Valor Pago: 2.5000 ETH
      📅 Data: 13/06/2025 15:45:12
      
      🎉 O pagamento foi processado automaticamente!
      Verifique seu saldo na carteira.
```

---

## ⚙️ **Configuration Options**

### **Alert Thresholds**

```javascript
// Customize alert levels in the bot
riskBot.alertThresholds = {
    HIGH_RISK: 8000,    // 80% - Red alert
    MEDIUM_RISK: 6000,  // 60% - Yellow alert  
    LOW_RISK: 4000      // 40% - Green status
};
```

### **User Preferences**

```javascript
// Allow users to customize their experience
const userPrefs = {
    alertsEnabled: true,
    riskThreshold: 6000,        // Personal threshold
    language: 'pt-BR',          // Portuguese Brazil
    notificationFrequency: 'immediate', // or 'daily', 'hourly'
    protocolsToWatch: [         // Specific protocols to monitor
        '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Uniswap
        '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'  // Aave
    ]
};
```

---

## 🔄 **Real-time Monitoring**

### **Event Listeners Setup**

```javascript
// Monitor blockchain events and send WhatsApp alerts
async function setupEventMonitoring() {
    // Risk updates
    riskRegistry.on('RiskMetricsUpdated', async (protocol, risk, event) => {
        const affectedUsers = await findUsersWithProtocol(protocol);
        
        for (const user of affectedUsers) {
            if (risk >= user.alertThreshold) {
                await sendRiskAlert(user.phone, protocol, risk);
            }
        }
    });
    
    // Portfolio changes
    portfolioAnalyzer.on('PortfolioUpdated', async (userAddress, value, risk) => {
        const phone = await findPhoneByAddress(userAddress);
        if (phone) {
            await sendPortfolioUpdate(phone, value, risk);
        }
    });
    
    // Insurance claims
    riskInsurance.on('ClaimPaid', async (policyId, holder, amount) => {
        const phone = await findPhoneByAddress(holder);
        if (phone) {
            await sendInsuranceNotification(phone, policyId, amount);
        }
    });
}
```

### **Batch Processing**

```javascript
// Process multiple users efficiently
async function processBatchAlerts() {
    const alerts = await getPendingAlerts();
    
    // Group by phone number to avoid spam
    const groupedAlerts = groupBy(alerts, 'phoneNumber');
    
    for (const [phone, userAlerts] of Object.entries(groupedAlerts)) {
        const summary = createAlertSummary(userAlerts);
        await send_message(phone, summary);
        
        // Mark alerts as sent
        await markAlertsAsSent(userAlerts.map(a => a.id));
    }
}

// Run every 5 minutes
setInterval(processBatchAlerts, 5 * 60 * 1000);
```

---

## 📊 **Dashboard Integration**

### **Web Dashboard Commands**

Add these commands for users who want web access:

```javascript
// Generate dashboard links
riskBot.handleDashboardCommand = async function(phoneNumber) {
    const user = this.users.get(phoneNumber);
    if (!user) return 'Register first with /register';
    
    const dashboardUrl = `https://riskguardian.ai/dashboard?wallet=${user.walletAddress}`;
    
    return `🌐 *Dashboard Web*\n\n` +
           `Acesse seu dashboard completo:\n` +
           `${dashboardUrl}\n\n` +
           `💡 No dashboard você pode:\n` +
           `• Ver gráficos detalhados\n` +
           `• Gerenciar posições\n` +
           `• Contratar seguros\n` +
           `• Exportar relatórios`;
};
```

---

## 🔐 **Security Considerations**

### **Access Control**

```javascript
// Implement user verification
riskBot.verifyUser = async function(phoneNumber, walletAddress) {
    // Check if phone number is verified
    const isVerified = await checkPhoneVerification(phoneNumber);
    if (!isVerified) {
        return 'Please verify your phone number first';
    }
    
    // Optional: Require wallet signature for registration
    const challenge = generateChallenge();
    return `To verify wallet ownership, sign this message: ${challenge}`;
};
```

### **Rate Limiting**

```javascript
// Prevent spam and abuse
const rateLimiter = new Map();

riskBot.checkRateLimit = function(phoneNumber) {
    const now = Date.now();
    const userLimit = rateLimiter.get(phoneNumber) || { count: 0, resetTime: now };
    
    if (now > userLimit.resetTime) {
        // Reset counter every minute
        userLimit.count = 0;
        userLimit.resetTime = now + 60000;
    }
    
    if (userLimit.count >= 10) { // Max 10 commands per minute
        return false;
    }
    
    userLimit.count++;
    rateLimiter.set(phoneNumber, userLimit);
    return true;
};
```

---

## 🧪 **Testing Your Integration**

### **Test Scenarios**

```bash
# 1. Test basic commands
./test_whatsapp.sh

# 2. Test with mock data
node test_integration.js

# 3. Test event monitoring
node test_events.js
```

### **Mock Test Script**

```javascript
// test_whatsapp_integration.js
const RiskGuardianBot = require('./whatsapp_integration.js');

async function runTests() {
    const bot = await RiskGuardianBot.initialize();
    const testPhone = '+5511999999999';
    const testWallet = '0x742d35Cc6639C0532c2Cc6439C0532c2Cc6439C0532';
    
    console.log('🧪 Testing WhatsApp Integration...');
    
    // Test registration
    const regResponse = await bot.handleWhatsAppCommand(testPhone, `/register ${testWallet}`);
    console.log('Registration:', regResponse);
    
    // Test portfolio command
    const portfolioResponse = await bot.handleWhatsAppCommand(testPhone, '/portfolio');
    console.log('Portfolio:', portfolioResponse);
    
    // Test help command
    const helpResponse = await bot.handleWhatsAppCommand(testPhone, '/help');
    console.log('Help:', helpResponse);
    
    console.log('✅ All tests completed!');
}

runTests().catch(console.error);
```

---

## 📈 **Performance Optimization**

### **Caching Strategy**

```javascript
// Cache frequently accessed data
const cache = new Map();

riskBot.getCachedProtocolInfo = async function(protocolAddress) {
    const cacheKey = `protocol_${protocolAddress}`;
    
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes
            return cached.data;
        }
    }
    
    const protocolInfo = await this.riskRegistry.getProtocol(protocolAddress);
    cache.set(cacheKey, {
        data: protocolInfo,
        timestamp: Date.now()
    });
    
    return protocolInfo;
};
```

### **Message Queue**

```javascript
// Handle high volume of alerts
const messageQueue = [];
let isProcessingQueue = false;

async function queueMessage(phoneNumber, message, priority = 'normal') {
    messageQueue.push({
        phoneNumber,
        message,
        priority,
        timestamp: Date.now()
    });
    
    if (!isProcessingQueue) {
        processMessageQueue();
    }
}

async function processMessageQueue() {
    isProcessingQueue = true;
    
    while (messageQueue.length > 0) {
        // Sort by priority and timestamp
        messageQueue.sort((a, b) => {
            if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
            if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
            return a.timestamp - b.timestamp;
        });
        
        const msg = messageQueue.shift();
        await send_message(msg.phoneNumber, msg.message);
        
        // Rate limit: 1 message per second
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    isProcessingQueue = false;
}
```

---

## 🚀 **Deployment Checklist**

### **Before Going Live:**

- [ ] ✅ Smart contracts deployed and verified
- [ ] ✅ All tests passing (run `./validate.sh`)
- [ ] ✅ WhatsApp integration tested with real messages
- [ ] ✅ Event monitoring working correctly
- [ ] ✅ Rate limiting configured
- [ ] ✅ Error handling implemented
- [ ] ✅ User data backup strategy in place
- [ ] ✅ Monitoring and logging setup

### **Environment Variables Check:**

```bash
# Verify all required variables are set
echo "Checking environment variables..."
echo "RISK_REGISTRY_ADDRESS: ${RISK_REGISTRY_ADDRESS:-❌ Not set}"
echo "PORTFOLIO_ANALYZER_ADDRESS: ${PORTFOLIO_ANALYZER_ADDRESS:-❌ Not set}"
echo "RISK_INSURANCE_ADDRESS: ${RISK_INSURANCE_ADDRESS:-❌ Not set}"
echo "ETHEREUM_RPC_URL: ${ETHEREUM_RPC_URL:-❌ Not set}"
echo "WHATSAPP_API_URL: ${WHATSAPP_API_URL:-❌ Not set}"
```

---

## 🆘 **Troubleshooting**

### **Common Issues:**

**1. Contract Not Found**
```bash
# Check if contracts are deployed
curl -X POST -H "Content-Type: application/json" \
  -d '{"method":"eth_getCode","params":["CONTRACT_ADDRESS","latest"],"id":1,"jsonrpc":"2.0"}' \
  http://localhost:8545
```

**2. Event Monitoring Not Working**
```javascript
// Check if events are being emitted
const filter = contract.filters.RiskMetricsUpdated();
const events = await contract.queryFilter(filter, -100); // Last 100 blocks
console.log('Recent events:', events.length);
```

**3. WhatsApp Messages Not Sending**
```javascript
// Test your WhatsApp function directly
await send_message('+5511999999999', 'Test message from RiskGuardian');
```

---

## 🎉 **You're Ready!**

Your RiskGuardian AI WhatsApp integration is now complete! Users can:

- 📱 **Monitor their DeFi portfolios** via WhatsApp
- 🚨 **Receive real-time risk alerts** 
- 🛡️ **Get insurance notifications**
- 💡 **Access help and tutorials**
- 📊 **Get detailed risk analysis**

The system will automatically monitor the blockchain and send relevant notifications to your users, making DeFi risk management as simple as sending a WhatsApp message!

---

**Need help?** Check the logs, run the validation script, or review the troubleshooting section above. 🚀

