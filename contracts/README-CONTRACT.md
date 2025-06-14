# 🏗️ RiskGuardian AI - Smart Contracts

**Comprehensive DeFi risk management and insurance smart contracts built with Solidity and Foundry.**

---

## 📋 **Overview**

RiskGuardian AI smart contracts provide a complete infrastructure for DeFi risk assessment and management. The system consists of three main contracts that work together to offer real-time risk analysis, portfolio management, and decentralized insurance.

### **🎯 Key Features**

- 🔍 **Real-time Risk Assessment** - Dynamic protocol risk scoring
- 📊 **Portfolio Analysis** - Multi-protocol portfolio risk calculation  
- 🛡️ **Decentralized Insurance** - Risk-based insurance policies
- 🔗 **Chainlink Integration** - Real-time price feeds
- ⚙️ **Governance Ready** - Owner and multi-assessor management
- 🔐 **Security First** - Comprehensive access controls and emergency functions

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    RiskGuardian AI                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐ │
│  │  RiskRegistry   │  │PortfolioAnalyzer│  │Insurance │ │
│  │                 │  │                 │  │          │ │
│  │ • Protocol DB   │  │ • Risk Calc     │  │ • Policies│ │
│  │ • Risk Metrics  │  │ • Diversify     │  │ • Claims  │ │
│  │ • Assessors     │  │ • Price Feeds   │  │ • Payouts │ │
│  └─────────────────┘  └─────────────────┘  └──────────┘ │
├─────────────────────────────────────────────────────────┤
│                 Chainlink Price Feeds                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📑 **Smart Contracts**

### **1. RiskRegistry** 
**Core protocol and risk metrics registry**

```solidity
contract RiskRegistry is Ownable, Pausable {
    struct RiskMetrics {
        uint256 volatilityScore;     // 0-10000 basis points
        uint256 liquidityScore;      // 0-10000 basis points  
        uint256 smartContractScore;  // 0-10000 basis points
        uint256 governanceScore;     // 0-10000 basis points
        uint256 overallRisk;         // Calculated composite
        uint256 lastUpdated;
        bool isActive;
    }
}
```

**Key Functions:**
- `registerProtocol()` - Register new DeFi protocols
- `updateRiskMetrics()` - Update risk scores (assessors only)
- `addRiskAssessor()` - Add authorized risk assessors
- `getProtocol()` - Get protocol information and metrics

**Events:**
- `ProtocolRegistered` - New protocol added
- `RiskMetricsUpdated` - Risk scores updated

### **2. PortfolioRiskAnalyzer**
**Portfolio composition and risk analysis**

```solidity
contract PortfolioRiskAnalyzer is Ownable, ReentrancyGuard {
    struct Position {
        address protocol;
        address token;
        uint256 amount;
        uint256 value;           // USD value via Chainlink
    }

    struct PortfolioAnalysis {
        uint256 totalValue;
        uint256 overallRisk;
        uint256 diversificationScore;
        uint256 timestamp;
        bool isValid;
    }
}
```

**Key Functions:**
- `addPosition()` - Add position to portfolio
- `removePosition()` - Remove position from portfolio
- `calculatePortfolioRisk()` - Get weighted risk score
- `getUserPositions()` - Get all user positions
- `setPriceFeed()` - Configure Chainlink price feeds

**Risk Calculation:**
- Weighted average based on position values
- Diversification bonus for multi-protocol portfolios
- Real-time price integration via Chainlink

### **3. RiskInsurance**
**Decentralized insurance for DeFi positions**

```solidity
contract RiskInsurance is Ownable, ReentrancyGuard, Pausable {
    struct InsurancePolicy {
        address holder;
        uint256 coverageAmount;
        uint256 premium;
        uint256 riskThreshold;      // Trigger threshold
        uint256 startTime;
        uint256 duration;
        bool isActive;
        bool hasClaimed;
    }
}
```

**Key Functions:**
- `createPolicy()` - Create new insurance policy
- `claimInsurance()` - Claim payout if risk threshold exceeded
- `getUserPolicies()` - Get user's active policies
- `addToPool()` - Add funds to insurance pool

**Insurance Logic:**
- Premium = Base fee + Risk-adjusted fee
- Payout = Coverage × Risk excess ratio
- Automatic claim validation via portfolio analysis

---

## 🚀 **Quick Start**

### **Installation**

```bash
# Clone and setup
git clone <repo>
cd riskguardian-ai/contracts

# Run automated setup
./setup.sh

# Or manual setup
forge install
forge build
forge test
```

### **Local Deployment**

```bash
# 1. Start Anvil blockchain
docker-compose up -d anvil

# 2. Deploy contracts
forge script script/Deploy.s.sol:DeployRiskGuardian \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 3. Test deployment
make test-integration
```

### **Testnet Deployment**

```bash
# Deploy to Goerli
make deploy-goerli

# Deploy to Sepolia  
make deploy-sepolia

# Verify on Etherscan
make verify
```

---

## 🧪 **Testing**

### **Test Suite Overview**

```bash
# Run all tests
make test

# Run specific test categories
make test-unit          # Unit tests
make test-integration   # Integration tests  
make test-fuzz          # Fuzz testing

# Generate coverage report
make coverage

# Run security analysis
make slither
```

### **Test Scenarios**

**Unit Tests:**
- ✅ Protocol registration and management
- ✅ Risk metrics calculation and updates
- ✅ Portfolio position management
- ✅ Insurance policy creation and claims
- ✅ Access control and permissions
- ✅ Emergency pause functionality

**Integration Tests:**
- ✅ End-to-end risk assessment workflow
- ✅ Portfolio analysis with real price feeds
- ✅ Insurance claim validation
- ✅ Multi-protocol diversification scoring
- ✅ Risk-based premium calculation

**Fuzz Tests:**
- ✅ Risk score boundary testing
- ✅ Position amount edge cases
- ✅ Premium calculation validation
- ✅ Overflow/underflow protection

---

## 📊 **Risk Calculation Methodology**

### **Protocol Risk Scoring**

Each protocol receives scores in 4 categories (0-10000 basis points):

1. **Volatility Score** (30% weight)
   - Historical price volatility
   - Token price correlation
   - Market impact sensitivity

2. **Liquidity Score** (25% weight)  
   - Total Value Locked (TVL)
   - Trading volume depth
   - Exit liquidity availability

3. **Smart Contract Score** (25% weight)
   - Code audit results
   - Bug bounty programs
   - Historical exploit events

4. **Governance Score** (20% weight)
   - Decentralization level
   - Voting participation
   - Development activity

**Overall Risk = (Volatility×30 + Liquidity×25 + Contract×25 + Governance×20) / 100**

### **Portfolio Risk Calculation**

```solidity
// Weighted average of position risks
uint256 portfolioRisk = Σ(positionValue × protocolRisk) / totalValue

// Apply diversification bonus
uint256 diversificationBonus = calculateDiversificationBonus(positions)
finalRisk = portfolioRisk > bonus ? portfolioRisk - bonus : 0
```

**Diversification Scoring:**
- Protocol diversity: Different protocols reduce risk
- Category diversity: Different DeFi categories (DEX, lending, staking)
- Bonus cap: Maximum 10% risk reduction (1000 basis points)

---

## 🛡️ **Insurance System**

### **Policy Creation**

```solidity
function createPolicy(
    uint256 coverageAmount,     // Insurance coverage in ETH
    uint256 riskThreshold,      // Risk level that triggers payout (0-10000)
    uint256 duration           // Policy duration in seconds
) external payable
```

### **Premium Calculation**

```solidity
uint256 basePremium = coverageAmount / 100;  // 1% base rate
uint256 riskAdjustment = (basePremium × riskThreshold) / 10000;
uint256 totalPremium = basePremium + riskAdjustment;
```

### **Claim Process**

1. **Automatic Validation**: Portfolio risk checked against threshold
2. **Payout Calculation**: Based on risk excess over threshold
3. **Pool Management**: Payouts drawn from insurance pool
4. **Policy Closure**: Claimed policies marked inactive

---

## 🔗 **Integration Guide**

### **Backend Integration**

```typescript
// Example TypeScript integration
import { ethers } from 'ethers';
import RiskRegistryABI from './abi/RiskRegistry.json';

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const riskRegistry = new ethers.Contract(address, RiskRegistryABI, provider);

// Get protocol risk
const protocol = await riskRegistry.getProtocol(protocolAddress);
console.log('Risk Score:', protocol.riskMetrics.overallRisk);
```

### **Frontend Integration**

```javascript
// Web3 integration example
import Web3 from 'web3';

const web3 = new Web3(window.ethereum);
const contract = new web3.eth.Contract(ABI, contractAddress);

// Add portfolio position
await contract.methods.addPosition(protocol, token, amount)
  .send({ from: userAddress });

// Get portfolio analysis
const analysis = await contract.methods.getPortfolioAnalysis(userAddress)
  .call();
```

### **API Endpoints**

The backend should expose these contract interactions:

```typescript
// Risk Assessment API
GET  /api/protocols/:address/risk
POST /api/protocols/register
PUT  /api/protocols/:address/risk

// Portfolio Management API  
GET  /api/portfolio/:address
POST /api/portfolio/:address/positions
DELETE /api/portfolio/:address/positions/:index

// Insurance API
GET  /api/insurance/:address/policies
POST /api/insurance/policies
POST /api/insurance/policies/:id/claim
```

---

## 🔐 **Security Features**

### **Access Controls**

- **Owner**: Contract owner with administrative privileges
- **Risk Assessors**: Authorized addresses that can update risk metrics
- **Users**: Can manage their own portfolios and insurance

### **Emergency Functions**

```solidity
// Emergency pause (owner only)
function pause() external onlyOwner;
function unpause() external onlyOwner;

// Risk assessor management
function addRiskAssessor(address assessor) external onlyOwner;
function removeRiskAssessor(address assessor) external onlyOwner;
```

### **Reentrancy Protection**

All state-changing functions use `ReentrancyGuard` to prevent reentrancy attacks.

### **Input Validation**

- Risk scores capped at 10000 (100%)
- Address validation for zero addresses
- Amount validation for positive values
- Duration limits for insurance policies

---

## 📈 **Gas Optimization**

### **Storage Patterns**

- Packed structs to minimize storage slots
- Efficient mapping usage
- Minimal external calls

### **Function Optimization**

- View functions for read operations
- Batch operations where possible
- Gas-efficient loops and calculations

### **Estimated Gas Costs**

| Function | Gas Estimate |
|----------|--------------|
| `registerProtocol` | ~150,000 |
| `updateRiskMetrics` | ~100,000 |
| `addPosition` | ~120,000 |
| `createPolicy` | ~180,000 |
| `claimInsurance` | ~200,000 |

---

## 🔄 **Upgrade Path**

### **Current Version: v1.0**

The contracts are designed with upgradeability in mind:

- **Proxy Pattern**: Consider implementing OpenZeppelin's proxy contracts
- **Data Migration**: Functions to migrate data between versions
- **Backward Compatibility**: Maintain ABI compatibility where possible

### **Future Enhancements**

- **Multi-chain Support**: Deploy on Polygon, Arbitrum, Optimism
- **Advanced Risk Models**: ML-based risk assessment
- **Governance Token**: Decentralized protocol governance
- **Yield Farming**: Rewards for insurance pool providers

---

## 📚 **Resources**

### **Documentation**

- [Foundry Book](https://book.getfoundry.sh/) - Comprehensive Foundry guide
- [OpenZeppelin Docs](https://docs.openzeppelin.com/) - Security best practices
- [Chainlink Docs](https://docs.chain.link/) - Price feed integration

### **Security**

- [Slither](https://github.com/crytic/slither) - Static analysis tool
- [MythX](https://mythx.io/) - Security analysis platform
- [ConsenSys Best Practices](https://consensys.github.io/smart-contract-best-practices/)

### **Testing**

- [Forge Testing](https://book.getfoundry.sh/forge/tests) - Foundry testing guide
- [Fuzz Testing](https://book.getfoundry.sh/forge/fuzz-testing) - Property-based testing
- [Invariant Testing](https://book.getfoundry.sh/forge/invariant-testing) - Advanced testing

---

## 🤝 **Contributing**

### **Development Workflow**

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Install** dependencies: `make install`
4. **Build** contracts: `make build`
5. **Test** thoroughly: `make test`
6. **Format** code: `make fmt`
7. **Commit** changes: `git commit -m 'Add amazing feature'`
8. **Push** to branch: `git push origin feature/amazing-feature`
9. **Open** Pull Request

### **Code Standards**

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/v0.8.19/style-guide.html)
- Use NatSpec documentation for all functions
- Write comprehensive tests for new features
- Run security analysis before submitting

### **Testing Requirements**

- Unit tests for all new functions
- Integration tests for workflows
- Gas optimization analysis
- Security considerations documented

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support**

- 📧 **Email**: contracts@riskguardian.ai
- 🐛 **Issues**: [GitHub Issues](https://github.com/riskguardian-ai/contracts/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/riskguardian-ai/contracts/discussions)
- 📚 **Docs**: [Documentation Site](https://docs.riskguardian.ai)

---

**Built with ❤️ by the RiskGuardian AI team**

*Securing the future of DeFi, one smart contract at a time.* 🚀
