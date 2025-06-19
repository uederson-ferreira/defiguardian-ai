// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/mocks/SepoliaMocks.sol

/**
 * @title MockProtocol
 * @dev ✅ CORREÇÃO CRÍTICA: Mock de protocolo DeFi para Sepolia
 * @notice Simula comportamento básico de protocolos como Compound, Lido, etc.
 */
contract MockProtocol {
    string public name;
    string public category;
    uint256 public totalValueLocked;
    uint256 public totalUsers;
    bool public isActive;
    
    mapping(address => uint256) public userDeposits;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    
    constructor(string memory _name, string memory _category) {
        name = _name;
        category = _category;
        totalValueLocked = 1000000e18; // 1M ETH mock TVL
        totalUsers = 10000; // 10k mock users
        isActive = true;
    }
    
    /**
     * @dev Simula depósito no protocolo
     */
    function deposit() external payable {
        require(msg.value > 0, "Must deposit something");
        require(isActive, "Protocol not active");
        
        userDeposits[msg.sender] += msg.value;
        totalValueLocked += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @dev Simula retirada do protocolo
     */
    function withdraw(uint256 amount) external {
        require(userDeposits[msg.sender] >= amount, "Insufficient balance");
        require(isActive, "Protocol not active");
        
        userDeposits[msg.sender] -= amount;
        totalValueLocked -= amount;
        
        payable(msg.sender).transfer(amount);
        emit Withdraw(msg.sender, amount);
    }
    
    /**
     * @dev Para testes de emergência
     */
    function emergencyPause() external {
        isActive = false;
    }
    
    function getUserBalance(address user) external view returns (uint256) {
        return userDeposits[user];
    }
}

/**
 * @title MockPriceFeed  
 * @dev ✅ CORREÇÃO CRÍTICA: Mock Chainlink price feed para Sepolia
 * @notice Simula price feeds para tokens não disponíveis na testnet
 */
contract MockPriceFeed {
    string public description;
    uint8 public decimals;
    int256 public price;
    uint256 public updatedAt;
    uint80 public roundId;
    
    constructor(
        string memory _description,
        uint8 _decimals,
        int256 _initialPrice
    ) {
        description = _description;
        decimals = _decimals;
        price = _initialPrice;
        updatedAt = block.timestamp;
        roundId = 1;
    }
    
    function latestRoundData() external view returns (
        uint80 _roundId,
        int256 _price,
        uint256 startedAt,
        uint256 _updatedAt,
        uint80 answeredInRound
    ) {
        return (roundId, price, block.timestamp, updatedAt, roundId);
    }
    
    /**
     * @dev Para simular mudanças de preço durante testes
     */
    function updatePrice(int256 _newPrice) external {
        price = _newPrice;
        updatedAt = block.timestamp;
        roundId++;
    }
    
    /**
     * @dev Simula volatilidade de preço
     */
    function simulateVolatility(int256 basePrice, uint256 volatilityPercent) external {
        // Gera variação entre -volatilityPercent% e +volatilityPercent%
        uint256 variation = (uint256(basePrice) * volatilityPercent) / 10000;
        int256 randomVariation = int256(variation) * (int256(block.timestamp) % 2 == 0 ? int256(1) : int256(-1));
        
        price = basePrice + randomVariation;
        updatedAt = block.timestamp;
        roundId++;
    }
}

/**
 * @title SepoliaSetup
 * @dev ✅ CORREÇÃO CRÍTICA: Setup completo para demo na Sepolia
 * @notice Deploy e configuração automática de todos os mocks necessários
 */
contract SepoliaSetup {
    // Endereços dos mocks deployados
    mapping(string => address) public mockProtocols;
    mapping(string => address) public mockPriceFeeds;
    
    address public deployer;
    bool public isSetup;
    
    event MockDeployed(string indexed name, address indexed contractAddr, string category);
    event SetupCompleted(uint256 protocolCount, uint256 priceFeedCount);
    
    constructor() {
        deployer = msg.sender;
    }
    
    /**
     * @dev ✅ FUNÇÃO CRÍTICA: Setup completo para Sepolia
     * @notice Chame esta função uma vez para configurar todos os mocks
     */
    function setupSepoliaMocks() external {
        require(msg.sender == deployer, "Only deployer");
        require(!isSetup, "Already setup");
        
        // 1. Deploy mock protocols
        _deployMockProtocols();
        
        // 2. Deploy mock price feeds
        _deployMockPriceFeeds();
        
        isSetup = true;
        emit SetupCompleted(5, 8); // 5 protocolos, 8 price feeds
    }
    
    /**
     * @dev Deploy protocolos DeFi mock
     */
    function _deployMockProtocols() internal {
        // Compound V3 Mock
        MockProtocol compoundMock = new MockProtocol("Compound V3 (Sepolia)", "lending");
        mockProtocols["compound"] = address(compoundMock);
        emit MockDeployed("Compound V3", address(compoundMock), "lending");
        
        // Lido stETH Mock
        MockProtocol lidoMock = new MockProtocol("Lido stETH (Sepolia)", "staking");
        mockProtocols["lido"] = address(lidoMock);
        emit MockDeployed("Lido stETH", address(lidoMock), "staking");
        
        // Curve Finance Mock
        MockProtocol curveMock = new MockProtocol("Curve Finance (Sepolia)", "dex");
        mockProtocols["curve"] = address(curveMock);
        emit MockDeployed("Curve Finance", address(curveMock), "dex");
        
        // Balancer V2 Mock
        MockProtocol balancerMock = new MockProtocol("Balancer V2 (Sepolia)", "dex");
        mockProtocols["balancer"] = address(balancerMock);
        emit MockDeployed("Balancer V2", address(balancerMock), "dex");
        
        // Yearn Finance Mock
        MockProtocol yearnMock = new MockProtocol("Yearn Finance (Sepolia)", "yield");
        mockProtocols["yearn"] = address(yearnMock);
        emit MockDeployed("Yearn Finance", address(yearnMock), "yield");
    }
    
    /**
     * @dev Deploy price feeds mock
     */
    function _deployMockPriceFeeds() internal {
        // Tokens principais que podem não ter price feeds na Sepolia
        
        // WBTC/USD
        MockPriceFeed wbtcFeed = new MockPriceFeed("WBTC/USD", 8, 43000e8); // $43,000
        mockPriceFeeds["WBTC"] = address(wbtcFeed);
        
        // USDT/USD
        MockPriceFeed usdtFeed = new MockPriceFeed("USDT/USD", 8, 1e8); // $1.00
        mockPriceFeeds["USDT"] = address(usdtFeed);
        
        // AAVE/USD
        MockPriceFeed aaveFeed = new MockPriceFeed("AAVE/USD", 8, 85e8); // $85
        mockPriceFeeds["AAVE"] = address(aaveFeed);
        
        // COMP/USD
        MockPriceFeed compFeed = new MockPriceFeed("COMP/USD", 8, 45e8); // $45
        mockPriceFeeds["COMP"] = address(compFeed);
        
        // CRV/USD
        MockPriceFeed crvFeed = new MockPriceFeed("CRV/USD", 8, 1e8); // $1.00
        mockPriceFeeds["CRV"] = address(crvFeed);
        
        // LDO/USD
        MockPriceFeed ldoFeed = new MockPriceFeed("LDO/USD", 8, 2e8); // $2.00
        mockPriceFeeds["LDO"] = address(ldoFeed);
        
        // BAL/USD
        MockPriceFeed balFeed = new MockPriceFeed("BAL/USD", 8, 3e8); // $3.00
        mockPriceFeeds["BAL"] = address(balFeed);
        
        // YFI/USD
        MockPriceFeed yfiFeed = new MockPriceFeed("YFI/USD", 8, 6500e8); // $6,500
        mockPriceFeeds["YFI"] = address(yfiFeed);
    }
    
    /**
     * @dev ✅ FUNÇÃO UTILITÁRIA: Registrar todos os mocks no RiskRegistry
     */
    function registerMocksInRiskRegistry(address riskRegistryAddr) external {
        require(msg.sender == deployer, "Only deployer");
        require(isSetup, "Setup first");
        require(riskRegistryAddr != address(0), "Invalid registry");
        
        // Usar interface para registrar protocolos
        ISepoliaRiskRegistry registry = ISepoliaRiskRegistry(riskRegistryAddr);
        
        // Registrar Compound Mock
        registry.registerProtocol(
            mockProtocols["compound"],
            "Compound V3 (Sepolia)",
            "lending"
        );
        
        // Registrar Lido Mock
        registry.registerProtocol(
            mockProtocols["lido"],
            "Lido stETH (Sepolia)",
            "staking"
        );
        
        // Registrar Curve Mock
        registry.registerProtocol(
            mockProtocols["curve"],
            "Curve Finance (Sepolia)",
            "dex"
        );
        
        // Registrar Balancer Mock
        registry.registerProtocol(
            mockProtocols["balancer"],
            "Balancer V2 (Sepolia)",
            "dex"
        );
        
        // Registrar Yearn Mock
        registry.registerProtocol(
            mockProtocols["yearn"],
            "Yearn Finance (Sepolia)",
            "yield"
        );
    }
    
    /**
     * @dev ✅ FUNÇÃO UTILITÁRIA: Configurar price feeds no PortfolioAnalyzer
     */
    function configurePriceFeedsInAnalyzer(address analyzerAddr) external view{
        require(msg.sender == deployer, "Only deployer");
        require(isSetup, "Setup first");
        require(analyzerAddr != address(0), "Invalid analyzer");
        
        // Esta função deveria ser chamada pelo owner do PortfolioAnalyzer
        // Para simplicidade, apenas logar os endereços dos price feeds
    }
    
    /**
     * @dev Getter functions
     */
    function getMockProtocol(string memory name) external view returns (address) {
        return mockProtocols[name];
    }
    
    function getMockPriceFeed(string memory name) external view returns (address) {
        return mockPriceFeeds[name];
    }
    
    /**
     * @dev ✅ FUNÇÃO CRÍTICA: Setup de risco realista para demos
     */
    function setupRealisticRiskData(address riskRegistryAddr) external {
        require(msg.sender == deployer, "Only deployer");
        require(isSetup, "Setup first");
        
        ISepoliaRiskRegistry registry = ISepoliaRiskRegistry(riskRegistryAddr);
        
        // Configurar riscos realistas para cada protocolo
        
        // Compound: Baixo-médio risco (lending estabelecido)
        registry.updateRiskMetrics(
            mockProtocols["compound"],
            3500, // volatility
            8000, // liquidity (boa)
            2000, // smart contract (baixo, protocol maduro)
            4000  // governance (moderado)
        );
        
        // Lido: Médio risco (staking)
        registry.updateRiskMetrics(
            mockProtocols["lido"],
            5000, // volatility (ETH staking)
            7000, // liquidity (boa)
            3000, // smart contract (baixo-médio)
            4500  // governance (moderado)
        );
        
        // Curve: Médio-alto risco (DEX complexo)
        registry.updateRiskMetrics(
            mockProtocols["curve"],
            6000, // volatility (DEX)
            6000, // liquidity (boa mas variável)
            4000, // smart contract (complexidade alta)
            5000  // governance (ativo)
        );
        
        // Balancer: Médio-alto risco (AMM complexo)
        registry.updateRiskMetrics(
            mockProtocols["balancer"],
            6500, // volatility (AMM)
            5500, // liquidity (menor que Curve)
            4500, // smart contract (muito complexo)
            5000  // governance
        );
        
        // Yearn: Alto risco (yield farming)
        registry.updateRiskMetrics(
            mockProtocols["yearn"],
            7500, // volatility (yield farming)
            4000, // liquidity (variável)
            5000, // smart contract (estratégias complexas)
            6000  // governance (complexo)
        );
    }
}

// Interface necessária para mocks
interface ISepoliaRiskRegistry {
    function registerProtocol(address _protocolAddress, string memory _name, string memory _category) external;
    function updateRiskMetrics(address _protocolAddress, uint256 _volatility, uint256 _liquidity, uint256 _smartContract, uint256 _governance) external;
}