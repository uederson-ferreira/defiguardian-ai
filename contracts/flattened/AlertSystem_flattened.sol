// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0 ^0.8.20;

// lib/chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol

// solhint-disable-next-line interface-starts-with-i
interface AggregatorV3Interface {
  function decimals() external view returns (uint8);

  function description() external view returns (string memory);

  function version() external view returns (uint256);

  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

// lib/openzeppelin-contracts/contracts/utils/Context.sol

// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol

// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

// lib/openzeppelin-contracts/contracts/access/Ownable.sol

// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// lib/openzeppelin-contracts/contracts/utils/Pausable.sol

// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

// src/oracles/RiskOracle.sol

/**
 * @title RiskOracle
 * @dev Oracle for aggregating risk data from multiple sources
 */
contract RiskOracle is Ownable(msg.sender), ReentrancyGuard {
    
    struct RiskData {
        uint256 volatilityRisk;      // Market volatility risk (0-10000)
        uint256 liquidityRisk;       // Liquidity risk (0-10000)
        uint256 smartContractRisk;   // Technical risk (0-10000)
        uint256 governanceRisk;      // Governance risk (0-10000)
        uint256 externalRisk;        // External factors (0-10000)
        uint256 timestamp;
        address reporter;
        bool isValid;
    }

    struct RiskProvider {
        string name;
        address providerAddress;
        uint256 weight;              // Weight in final calculation (0-10000)
        uint256 reputation;          // Provider reputation score (0-10000)
        bool isActive;
        uint256 totalReports;
        uint256 accurateReports;
    }

    // Protocol address => RiskData from multiple providers
    mapping(address => mapping(address => RiskData)) public protocolRiskData;
    
    // Protocol address => aggregated final risk
    mapping(address => RiskData) public aggregatedRisk;
    
    // Risk data providers
    mapping(address => RiskProvider) public riskProviders;
    address[] public allProviders;
    
    // Risk thresholds for automated alerts
    mapping(address => uint256) public riskThresholds;
    
    // Historical risk data (last 30 entries)
    mapping(address => RiskData[]) public riskHistory;
    uint256 public constant MAX_HISTORY = 30;
    
    // Events
    event RiskDataSubmitted(address indexed protocol, address indexed provider, uint256 overallRisk);
    event RiskAggregated(address indexed protocol, uint256 newRisk, uint256 oldRisk);
    event ProviderAdded(address indexed provider, string name, uint256 weight);
    event ProviderUpdated(address indexed provider, uint256 newWeight, uint256 newReputation);
    event RiskThresholdExceeded(address indexed protocol, uint256 riskLevel, uint256 threshold);

    constructor() {}

    /**
     * @dev Add a new risk data provider
     */
    function addRiskProvider(
        address _provider,
        string memory _name,
        uint256 _weight
    ) external onlyOwner {
        require(_provider != address(0), "Invalid provider address");
        require(_weight <= 10000, "Weight too high");
        require(!riskProviders[_provider].isActive, "Provider already exists");

        riskProviders[_provider] = RiskProvider({
            name: _name,
            providerAddress: _provider,
            weight: _weight,
            reputation: 5000, // Start with medium reputation
            isActive: true,
            totalReports: 0,
            accurateReports: 0
        });

        allProviders.push(_provider);
        emit ProviderAdded(_provider, _name, _weight);
    }

    /**
     * @dev Submit risk data for a protocol (only approved providers)
     */
    function submitRiskData(
        address _protocol,
        uint256 _volatilityRisk,
        uint256 _liquidityRisk,
        uint256 _smartContractRisk,
        uint256 _governanceRisk,
        uint256 _externalRisk
    ) external nonReentrant {
        require(riskProviders[msg.sender].isActive, "Not an approved provider");
        require(_protocol != address(0), "Invalid protocol");
        require(
            _volatilityRisk <= 10000 && _liquidityRisk <= 10000 && 
            _smartContractRisk <= 10000 && _governanceRisk <= 10000 &&
            _externalRisk <= 10000,
            "Risk values must be <= 10000"
        );

        // Store individual provider data
        protocolRiskData[_protocol][msg.sender] = RiskData({
            volatilityRisk: _volatilityRisk,
            liquidityRisk: _liquidityRisk,
            smartContractRisk: _smartContractRisk,
            governanceRisk: _governanceRisk,
            externalRisk: _externalRisk,
            timestamp: block.timestamp,
            reporter: msg.sender,
            isValid: true
        });

        // Update provider stats
        riskProviders[msg.sender].totalReports++;

        // Calculate overall risk for this submission
        uint256 overallRisk = (_volatilityRisk * 25 + _liquidityRisk * 20 + 
                              _smartContractRisk * 25 + _governanceRisk * 15 + 
                              _externalRisk * 15) / 100;

        emit RiskDataSubmitted(_protocol, msg.sender, overallRisk);

        // Trigger aggregation
        _aggregateRiskData(_protocol);
    }

    /**
     * @dev Aggregate risk data from multiple providers
     */
    function _aggregateRiskData(address _protocol) internal {
        uint256 totalWeight = 0;
        uint256 weightedVolatility = 0;
        uint256 weightedLiquidity = 0;
        uint256 weightedSmartContract = 0;
        uint256 weightedGovernance = 0;
        uint256 weightedExternal = 0;
        
        uint256 oldRisk = aggregatedRisk[_protocol].isValid ? 
            _calculateOverallRisk(aggregatedRisk[_protocol]) : 0;

        // Aggregate data from all active providers
        for (uint256 i = 0; i < allProviders.length; i++) {
            address provider = allProviders[i];
            RiskProvider memory providerInfo = riskProviders[provider];
            
            if (!providerInfo.isActive) continue;
            
            RiskData memory data = protocolRiskData[_protocol][provider];
            if (!data.isValid || block.timestamp - data.timestamp > 7 days) continue;
            
            // Weight by provider weight and reputation
            uint256 effectiveWeight = (providerInfo.weight * providerInfo.reputation) / 10000;
            
            totalWeight += effectiveWeight;
            weightedVolatility += data.volatilityRisk * effectiveWeight;
            weightedLiquidity += data.liquidityRisk * effectiveWeight;
            weightedSmartContract += data.smartContractRisk * effectiveWeight;
            weightedGovernance += data.governanceRisk * effectiveWeight;
            weightedExternal += data.externalRisk * effectiveWeight;
        }

        if (totalWeight == 0) return; // No valid data

        // Calculate aggregated risk
        RiskData memory newAggregatedRisk = RiskData({
            volatilityRisk: weightedVolatility / totalWeight,
            liquidityRisk: weightedLiquidity / totalWeight,
            smartContractRisk: weightedSmartContract / totalWeight,
            governanceRisk: weightedGovernance / totalWeight,
            externalRisk: weightedExternal / totalWeight,
            timestamp: block.timestamp,
            reporter: address(this),
            isValid: true
        });

        // Store aggregated result
        aggregatedRisk[_protocol] = newAggregatedRisk;
        
        // Add to history
        _addToHistory(_protocol, newAggregatedRisk);

        uint256 newRisk = _calculateOverallRisk(newAggregatedRisk);
        emit RiskAggregated(_protocol, newRisk, oldRisk);

        // Check threshold alerts
        _checkRiskThreshold(_protocol, newRisk);
    }

    /**
     * @dev Calculate overall risk score
     */
    function _calculateOverallRisk(RiskData memory _data) internal pure returns (uint256) {
        return (_data.volatilityRisk * 25 + _data.liquidityRisk * 20 + 
                _data.smartContractRisk * 25 + _data.governanceRisk * 15 + 
                _data.externalRisk * 15) / 100;
    }

    /**
     * @dev Add risk data to historical records
     */
    function _addToHistory(address _protocol, RiskData memory _data) internal {
        riskHistory[_protocol].push(_data);
        
        // Keep only last 30 entries
        if (riskHistory[_protocol].length > MAX_HISTORY) {
            // Shift array left
            for (uint256 i = 0; i < MAX_HISTORY - 1; i++) {
                riskHistory[_protocol][i] = riskHistory[_protocol][i + 1];
            }
            riskHistory[_protocol].pop();
        }
    }

    /**
     * @dev Check if risk exceeds threshold and emit alert
     */
    function _checkRiskThreshold(address _protocol, uint256 _riskLevel) internal {
        uint256 threshold = riskThresholds[_protocol];
        if (threshold > 0 && _riskLevel > threshold) {
            emit RiskThresholdExceeded(_protocol, _riskLevel, threshold);
        }
    }

    /**
     * @dev Get aggregated risk for a protocol
     */
    function getAggregatedRisk(address _protocol) external view returns (
        uint256 volatilityRisk,
        uint256 liquidityRisk,
        uint256 smartContractRisk,
        uint256 governanceRisk,
        uint256 externalRisk,
        uint256 overallRisk,
        uint256 timestamp
    ) {
        RiskData memory data = aggregatedRisk[_protocol];
        require(data.isValid, "No risk data available");
        
        return (
            data.volatilityRisk,
            data.liquidityRisk,
            data.smartContractRisk,
            data.governanceRisk,
            data.externalRisk,
            _calculateOverallRisk(data),
            data.timestamp
        );
    }

    /**
     * @dev Get risk history for a protocol
     */
    function getRiskHistory(address _protocol) external view returns (RiskData[] memory) {
        return riskHistory[_protocol];
    }

    /**
     * @dev Get risk trend (increase/decrease over time)
     */
    function getRiskTrend(address _protocol) external view returns (int256) {
        RiskData[] memory history = riskHistory[_protocol];
        if (history.length < 2) return 0;
        
        uint256 latestRisk = _calculateOverallRisk(history[history.length - 1]);
        uint256 previousRisk = _calculateOverallRisk(history[history.length - 2]);
        
        return int256(latestRisk) - int256(previousRisk);
    }

    /**
     * @dev Set risk threshold for automated alerts
     */
    function setRiskThreshold(address _protocol, uint256 _threshold) external onlyOwner {
        require(_threshold <= 10000, "Threshold too high");
        riskThresholds[_protocol] = _threshold;
    }

    /**
     * @dev Update provider weight and reputation
     */
    function updateProvider(
        address _provider,
        uint256 _newWeight,
        uint256 _newReputation
    ) external onlyOwner {
        require(riskProviders[_provider].isActive, "Provider not active");
        require(_newWeight <= 10000 && _newReputation <= 10000, "Values too high");
        
        riskProviders[_provider].weight = _newWeight;
        riskProviders[_provider].reputation = _newReputation;
        
        emit ProviderUpdated(_provider, _newWeight, _newReputation);
    }

    /**
     * @dev Deactivate a risk provider
     */
    function deactivateProvider(address _provider) external onlyOwner {
        riskProviders[_provider].isActive = false;
    }

    /**
     * @dev Get all risk providers
     */
    function getAllProviders() external view returns (address[] memory) {
        return allProviders;
    }

    /**
     * @dev Check if risk data is fresh (updated within last 24 hours)
     */
    function isRiskDataFresh(address _protocol) external view returns (bool) {
        RiskData memory data = aggregatedRisk[_protocol];
        return data.isValid && (block.timestamp - data.timestamp <= 24 hours);
    }
}

// src/core/RiskRegistry.sol

/**
 * @title RiskRegistry
 * @dev Core registry for risk metrics and protocols
 */
contract RiskRegistry is Ownable(msg.sender), Pausable {
    struct RiskMetrics {
        uint256 volatilityScore;     // 0-10000 (basis points)
        uint256 liquidityScore;      // 0-10000 
        uint256 smartContractScore;  // 0-10000
        uint256 governanceScore;     // 0-10000
        uint256 overallRisk;         // Calculated composite score
        uint256 lastUpdated;
        bool isActive;
    }

    struct Protocol {
        string name;
        address protocolAddress;
        string category;             // "lending", "dex", "staking", etc
        uint256 tvl;                // Total Value Locked
        RiskMetrics riskMetrics;
        bool isWhitelisted;
    }

    // Protocol registry
    mapping(address => Protocol) public protocols;
    mapping(bytes32 => address) public protocolsByName;
    address[] public allProtocols;

    // Risk assessors (authorized addresses that can update risk metrics)
    mapping(address => bool) public riskAssessors;

    // Events
    event ProtocolRegistered(address indexed protocolAddress, string name);
    event RiskMetricsUpdated(address indexed protocolAddress, uint256 overallRisk);
    event RiskAssessorAdded(address indexed assessor);
    event RiskAssessorRemoved(address indexed assessor);

    modifier onlyRiskAssessor() {
        require(riskAssessors[msg.sender] || msg.sender == owner(), "Not authorized assessor");
        _;
    }

    constructor() {
        riskAssessors[msg.sender] = true;
    }

    /**
     * @dev Register a new protocol for risk assessment
     */
    function registerProtocol(
        address _protocolAddress,
        string memory _name,
        string memory _category
    ) external onlyOwner {
        require(_protocolAddress != address(0), "Invalid address");
        require(bytes(_name).length > 0, "Name required");
        
        bytes32 nameHash = keccak256(abi.encodePacked(_name));
        require(protocolsByName[nameHash] == address(0), "Protocol name exists");

        protocols[_protocolAddress] = Protocol({
            name: _name,
            protocolAddress: _protocolAddress,
            category: _category,
            tvl: 0,
            riskMetrics: RiskMetrics({
                volatilityScore: 5000,      // Default medium risk
                liquidityScore: 5000,
                smartContractScore: 5000,
                governanceScore: 5000,
                overallRisk: 5000,
                lastUpdated: block.timestamp,
                isActive: true
            }),
            isWhitelisted: false
        });

        protocolsByName[nameHash] = _protocolAddress;
        allProtocols.push(_protocolAddress);

        emit ProtocolRegistered(_protocolAddress, _name);
    }

    /**
     * @dev Update risk metrics for a protocol
     */
    function updateRiskMetrics(
        address _protocolAddress,
        uint256 _volatilityScore,
        uint256 _liquidityScore,
        uint256 _smartContractScore,
        uint256 _governanceScore
    ) external onlyRiskAssessor whenNotPaused {
        require(protocols[_protocolAddress].protocolAddress != address(0), "Protocol not registered");
        require(_volatilityScore <= 10000 && _liquidityScore <= 10000 && 
                _smartContractScore <= 10000 && _governanceScore <= 10000, "Scores must be <= 10000");

        Protocol storage protocol = protocols[_protocolAddress];
        
        protocol.riskMetrics.volatilityScore = _volatilityScore;
        protocol.riskMetrics.liquidityScore = _liquidityScore;
        protocol.riskMetrics.smartContractScore = _smartContractScore;
        protocol.riskMetrics.governanceScore = _governanceScore;
        
        // Calculate composite risk score (weighted average)
        uint256 overallRisk = (_volatilityScore * 30 + _liquidityScore * 25 + 
                              _smartContractScore * 25 + _governanceScore * 20) / 100;
        
        protocol.riskMetrics.overallRisk = overallRisk;
        protocol.riskMetrics.lastUpdated = block.timestamp;

        emit RiskMetricsUpdated(_protocolAddress, overallRisk);
    }

    /**
     * @dev Add a new risk assessor
     */
    function addRiskAssessor(address _assessor) external onlyOwner {
        riskAssessors[_assessor] = true;
        emit RiskAssessorAdded(_assessor);
    }

    /**
     * @dev Remove a risk assessor
     */
    function removeRiskAssessor(address _assessor) external onlyOwner {
        riskAssessors[_assessor] = false;
        emit RiskAssessorRemoved(_assessor);
    }

    /**
     * @dev Get protocol details
     */
    function getProtocol(address _protocolAddress) external view returns (Protocol memory) {
        return protocols[_protocolAddress];
    }

    /**
     * @dev Get all registered protocols
     */
    function getAllProtocols() external view returns (address[] memory) {
        return allProtocols;
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}

// src/core/PortfolioRiskAnalyzer.sol

/**
 * @title PortfolioRiskAnalyzer
 * @dev Analyzes risk for DeFi portfolios
 */
contract PortfolioRiskAnalyzer is Ownable(msg.sender), ReentrancyGuard {
    RiskRegistry public immutable riskRegistry;
    
    struct Position {
        address protocol;
        address token;
        uint256 amount;
        uint256 value;           // USD value
    }

    struct PortfolioAnalysis {
        uint256 totalValue;
        uint256 overallRisk;
        uint256 diversificationScore;
        uint256 timestamp;
        bool isValid;
    }

    // User portfolios
    mapping(address => Position[]) public userPositions;
    mapping(address => PortfolioAnalysis) public portfolioAnalyses;

    // Chainlink price feeds
    mapping(address => AggregatorV3Interface) public priceFeeds;

    event PortfolioUpdated(address indexed user, uint256 totalValue, uint256 riskScore);
    event PositionAdded(address indexed user, address protocol, address token, uint256 amount);
    event PositionRemoved(address indexed user, uint256 positionIndex);

    constructor(address _riskRegistry) {
        riskRegistry = RiskRegistry(_riskRegistry);
    }

    /**
     * @dev Add a position to user's portfolio
     */
    function addPosition(
        address _protocol,
        address _token,
        uint256 _amount
    ) external nonReentrant {
        require(_amount > 0, "Amount must be positive");
        
        // Verify protocol is registered
        (,address protocolAddr,,,,) = riskRegistry.protocols(_protocol);
        require(protocolAddr != address(0), "Protocol not registered");

        uint256 value = _getTokenValue(_token, _amount);
        
        userPositions[msg.sender].push(Position({
            protocol: _protocol,
            token: _token,
            amount: _amount,
            value: value
        }));

        emit PositionAdded(msg.sender, _protocol, _token, _amount);
        
        // Trigger portfolio analysis update
        _updatePortfolioAnalysis(msg.sender);
    }

    /**
     * @dev Remove a position from user's portfolio
     */
    function removePosition(uint256 _positionIndex) external {
        require(_positionIndex < userPositions[msg.sender].length, "Invalid position index");
        
        // Move last element to deleted spot and pop
        userPositions[msg.sender][_positionIndex] = userPositions[msg.sender][userPositions[msg.sender].length - 1];
        userPositions[msg.sender].pop();

        emit PositionRemoved(msg.sender, _positionIndex);
        
        // Update analysis
        _updatePortfolioAnalysis(msg.sender);
    }

    /**
     * @dev Get user's portfolio positions
     */
    function getUserPositions(address _user) external view returns (Position[] memory) {
        return userPositions[_user];
    }

    /**
     * @dev Get portfolio analysis for user
     */
    function getPortfolioAnalysis(address _user) external view returns (PortfolioAnalysis memory) {
        return portfolioAnalyses[_user];
    }

    /**
     * @dev Calculate portfolio risk score
     */
    function calculatePortfolioRisk(address _user) external view returns (uint256) {
        Position[] memory positions = userPositions[_user];
        if (positions.length == 0) return 0;

        uint256 totalValue = 0;
        uint256 weightedRisk = 0;

        for (uint256 i = 0; i < positions.length; i++) {
            Position memory pos = positions[i];
            
            // Get protocol risk from registry
            (,,,,RiskRegistry.RiskMetrics memory metrics,) = riskRegistry.protocols(pos.protocol);
            
            totalValue += pos.value;
            weightedRisk += (pos.value * metrics.overallRisk);
        }

        if (totalValue == 0) return 0;
        
        uint256 portfolioRisk = weightedRisk / totalValue;
        
        // Apply diversification bonus (reduce risk for diversified portfolios)
        uint256 diversificationBonus = _calculateDiversificationBonus(positions);
        portfolioRisk = portfolioRisk > diversificationBonus ? portfolioRisk - diversificationBonus : 0;
        
        return portfolioRisk;
    }

    /**
     * @dev Internal function to update portfolio analysis
     */
    function _updatePortfolioAnalysis(address _user) internal {
        Position[] memory positions = userPositions[_user];
        
        uint256 totalValue = 0;
        for (uint256 i = 0; i < positions.length; i++) {
            totalValue += positions[i].value;
        }

        uint256 riskScore = this.calculatePortfolioRisk(_user);
        uint256 diversificationScore = _calculateDiversificationScore(positions);

        portfolioAnalyses[_user] = PortfolioAnalysis({
            totalValue: totalValue,
            overallRisk: riskScore,
            diversificationScore: diversificationScore,
            timestamp: block.timestamp,
            isValid: true
        });

        emit PortfolioUpdated(_user, totalValue, riskScore);
    }

    /**
     * @dev Calculate diversification score (0-10000)
     */
    function _calculateDiversificationScore(Position[] memory _positions) internal view returns (uint256) {
        if (_positions.length <= 1) return 0;
        if (_positions.length >= 10) return 10000; // Max diversification
        
        // Count unique protocols and categories
        uint256 uniqueProtocols = _countUniqueProtocols(_positions);
        uint256 uniqueCategories = _countUniqueCategories(_positions);
        
        // Score based on number of unique protocols and categories
        uint256 protocolScore = (uniqueProtocols * 1000) > 10000 ? 10000 : uniqueProtocols * 1000;
        uint256 categoryScore = (uniqueCategories * 1500) > 10000 ? 10000 : uniqueCategories * 1500;
        
        return (protocolScore + categoryScore) / 2;
    }

    /**
     * @dev Calculate diversification bonus for risk reduction
     */
    function _calculateDiversificationBonus(Position[] memory _positions) internal view returns (uint256) {
        uint256 diversificationScore = _calculateDiversificationScore(_positions);
        // Bonus up to 1000 basis points (10% risk reduction)
        return (diversificationScore * 1000) / 10000;
    }

    /**
     * @dev Count unique protocols in positions
     */
    function _countUniqueProtocols(Position[] memory _positions) internal pure returns (uint256) {
        if (_positions.length == 0) return 0;
        
        address[] memory uniqueProtocols = new address[](_positions.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < _positions.length; i++) {
            bool isUnique = true;
            for (uint256 j = 0; j < count; j++) {
                if (uniqueProtocols[j] == _positions[i].protocol) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) {
                uniqueProtocols[count] = _positions[i].protocol;
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Count unique categories in positions
     */
    function _countUniqueCategories(Position[] memory _positions) internal view returns (uint256) {
        if (_positions.length == 0) return 0;
        
        string[] memory uniqueCategories = new string[](_positions.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < _positions.length; i++) {
            (,, string memory category,,,) = riskRegistry.protocols(_positions[i].protocol);
            
            bool isUnique = true;
            for (uint256 j = 0; j < count; j++) {
                if (keccak256(abi.encodePacked(uniqueCategories[j])) == keccak256(abi.encodePacked(category))) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) {
                uniqueCategories[count] = category;
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Get token value using Chainlink price feeds
     */
    function _getTokenValue(address _token, uint256 _amount) internal view returns (uint256) {
        AggregatorV3Interface priceFeed = priceFeeds[_token];
        if (address(priceFeed) == address(0)) return 0;
        
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        
        // Assuming 18 decimals for simplicity, adjust as needed
        return (_amount * uint256(price)) / 1e18;
    }

    /**
     * @dev Set price feed for a token (only owner)
     */
    function setPriceFeed(address _token, address _priceFeed) external onlyOwner {
        priceFeeds[_token] = AggregatorV3Interface(_priceFeed);
    }
}

// src/automation/AlertSystem.sol

/**
 * @title AlertSystem
 * @dev Automated alert system for risk management
 */
contract AlertSystem is Ownable(msg.sender), ReentrancyGuard {
    
    enum AlertType {
        RISK_THRESHOLD,
        LIQUIDATION_WARNING,
        PORTFOLIO_HEALTH,
        PRICE_VOLATILITY,
        PROTOCOL_UPGRADE,
        GOVERNANCE_CHANGE
    }

    enum AlertPriority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    struct Alert {
        uint256 id;
        address user;
        AlertType alertType;
        AlertPriority priority;
        address protocol;
        string message;
        uint256 riskLevel;
        uint256 threshold;
        uint256 timestamp;
        bool isActive;
        bool isResolved;
    }

    struct AlertSubscription {
        address user;
        AlertType alertType;
        address protocol;
        uint256 threshold;
        bool isActive;
        uint256 lastTriggered;
        uint256 cooldownPeriod; // Minimum time between alerts
    }

    struct UserPreferences {
        bool enableEmailAlerts;
        bool enablePushNotifications;
        bool enableSMSAlerts;
        uint256 minimumPriority; // Minimum priority to trigger alerts
        uint256 globalCooldown;  // Global cooldown between any alerts
    }

    // Contracts integration
    RiskOracle public immutable riskOracle;
    PortfolioRiskAnalyzer public immutable portfolioAnalyzer;
    RiskRegistry public immutable riskRegistry;

    // Alert storage
    mapping(uint256 => Alert) public alerts;
    mapping(address => uint256[]) public userAlerts;
    mapping(address => AlertSubscription[]) public userSubscriptions;
    mapping(address => UserPreferences) public userPreferences;
    
    uint256 public nextAlertId = 1;
    uint256 public constant DEFAULT_COOLDOWN = 1 hours;
    uint256 public constant MAX_ALERTS_PER_USER = 100;

    // Alert counters
    mapping(address => uint256) public activeAlertsCount;
    mapping(AlertType => uint256) public alertTypeCount;
    mapping(AlertPriority => uint256) public alertPriorityCount;

    // Events
    event AlertTriggered(
        uint256 indexed alertId,
        address indexed user,
        AlertType alertType,
        AlertPriority priority,
        string message
    );
    event AlertResolved(uint256 indexed alertId, address indexed user);
    event SubscriptionCreated(address indexed user, AlertType alertType, address protocol);
    event SubscriptionUpdated(address indexed user, uint256 subscriptionIndex);
    event SubscriptionRemoved(address indexed user, uint256 subscriptionIndex);
    event UserPreferencesUpdated(address indexed user);

    // Modifiers
    modifier validAlertId(uint256 _alertId) {
        require(_alertId > 0 && _alertId < nextAlertId, "Invalid alert ID");
        _;
    }

    modifier onlyAlertOwner(uint256 _alertId) {
        require(alerts[_alertId].user == msg.sender, "Not alert owner");
        _;
    }

    constructor(
        address _riskOracle,
        address _portfolioAnalyzer,
        address _riskRegistry
    ) {
        riskOracle = RiskOracle(_riskOracle);
        portfolioAnalyzer = PortfolioRiskAnalyzer(_portfolioAnalyzer);
        riskRegistry = RiskRegistry(_riskRegistry);
    }

    /**
     * @dev Create a new alert subscription
     */
    function createSubscription(
        AlertType _alertType,
        address _protocol,
        uint256 _threshold
    ) external {
        require(_threshold <= 10000, "Threshold too high");
        require(userSubscriptions[msg.sender].length < 50, "Too many subscriptions");

        userSubscriptions[msg.sender].push(AlertSubscription({
            user: msg.sender,
            alertType: _alertType,
            protocol: _protocol,
            threshold: _threshold,
            isActive: true,
            lastTriggered: 0,
            cooldownPeriod: DEFAULT_COOLDOWN
        }));

        emit SubscriptionCreated(msg.sender, _alertType, _protocol);
    }

    /**
     * @dev Update an existing subscription
     */
    function updateSubscription(
        uint256 _subscriptionIndex,
        uint256 _newThreshold,
        bool _isActive,
        uint256 _cooldownPeriod
    ) external {
        require(_subscriptionIndex < userSubscriptions[msg.sender].length, "Invalid subscription");
        require(_newThreshold <= 10000, "Threshold too high");
        require(_cooldownPeriod >= 10 minutes, "Cooldown too short");

        AlertSubscription storage subscription = userSubscriptions[msg.sender][_subscriptionIndex];
        subscription.threshold = _newThreshold;
        subscription.isActive = _isActive;
        subscription.cooldownPeriod = _cooldownPeriod;

        emit SubscriptionUpdated(msg.sender, _subscriptionIndex);
    }

    /**
     * @dev Remove a subscription
     */
    function removeSubscription(uint256 _subscriptionIndex) external {
        require(_subscriptionIndex < userSubscriptions[msg.sender].length, "Invalid subscription");

        // Move last element to deleted spot and pop
        uint256 lastIndex = userSubscriptions[msg.sender].length - 1;
        userSubscriptions[msg.sender][_subscriptionIndex] = userSubscriptions[msg.sender][lastIndex];
        userSubscriptions[msg.sender].pop();

        emit SubscriptionRemoved(msg.sender, _subscriptionIndex);
    }

    /**
     * @dev Set user alert preferences
     */
    function setUserPreferences(
        bool _enableEmailAlerts,
        bool _enablePushNotifications,
        bool _enableSMSAlerts,
        uint256 _minimumPriority,
        uint256 _globalCooldown
    ) external {
        require(_minimumPriority <= 3, "Invalid priority level");
        require(_globalCooldown >= 5 minutes, "Cooldown too short");

        userPreferences[msg.sender] = UserPreferences({
            enableEmailAlerts: _enableEmailAlerts,
            enablePushNotifications: _enablePushNotifications,
            enableSMSAlerts: _enableSMSAlerts,
            minimumPriority: _minimumPriority,
            globalCooldown: _globalCooldown
        });

        emit UserPreferencesUpdated(msg.sender);
    }

    /**
     * @dev Check all user subscriptions and trigger alerts if needed
     */
    function checkUserAlerts(address _user) external {
        AlertSubscription[] memory subscriptions = userSubscriptions[_user];

        for (uint256 i = 0; i < subscriptions.length; i++) {
            AlertSubscription memory subscription = subscriptions[i];
            
            if (!subscription.isActive) continue;
            if (block.timestamp - subscription.lastTriggered < subscription.cooldownPeriod) continue;

            // Check specific alert type
            if (subscription.alertType == AlertType.RISK_THRESHOLD) {
                _checkRiskThresholdAlert(_user, subscription, i);
            } else if (subscription.alertType == AlertType.LIQUIDATION_WARNING) {
                _checkLiquidationAlert(_user, subscription, i);
            } else if (subscription.alertType == AlertType.PORTFOLIO_HEALTH) {
                _checkPortfolioHealthAlert(_user, subscription, i);
            } else if (subscription.alertType == AlertType.PRICE_VOLATILITY) {
                _checkPriceVolatilityAlert(_user, subscription, i);
            }
        }
    }

    /**
     * @dev Check risk threshold alerts
     */
    function _checkRiskThresholdAlert(
        address _user,
        AlertSubscription memory _subscription,
        uint256 _subscriptionIndex
    ) internal {
        try riskOracle.getAggregatedRisk(_subscription.protocol) returns (
            uint256, uint256, uint256, uint256, uint256, uint256 overallRisk, uint256
        ) {
            if (overallRisk > _subscription.threshold) {
                AlertPriority priority = _calculatePriority(overallRisk, _subscription.threshold);
                
                string memory message = string(abi.encodePacked(
                    "Risk threshold exceeded for protocol. Current risk: ",
                    _uint2str(overallRisk / 100),
                    "%, Threshold: ",
                    _uint2str(_subscription.threshold / 100),
                    "%"
                ));

                _createAlert(
                    _user,
                    AlertType.RISK_THRESHOLD,
                    priority,
                    _subscription.protocol,
                    message,
                    overallRisk,
                    _subscription.threshold
                );

                // Update last triggered time
                userSubscriptions[_user][_subscriptionIndex].lastTriggered = block.timestamp;
            }
        } catch {
            // Risk data not available
            return;
        }
    }

    /**
     * @dev Check liquidation warning alerts
     */
    function _checkLiquidationAlert(
        address _user,
        AlertSubscription memory _subscription,
        uint256 _subscriptionIndex
    ) internal {
        // Get user's portfolio risk
        uint256 portfolioRisk = portfolioAnalyzer.calculatePortfolioRisk(_user);
        
        // Check if portfolio risk indicates potential liquidation
        if (portfolioRisk > 8500) { // 85% risk threshold for liquidation warning
            AlertPriority priority = AlertPriority.CRITICAL;
            
            string memory message = string(abi.encodePacked(
                "LIQUIDATION WARNING: Your portfolio risk is critically high at ",
                _uint2str(portfolioRisk / 100),
                "%. Consider reducing exposure immediately."
            ));

            _createAlert(
                _user,
                AlertType.LIQUIDATION_WARNING,
                priority,
                _subscription.protocol,
                message,
                portfolioRisk,
                8500
            );

            userSubscriptions[_user][_subscriptionIndex].lastTriggered = block.timestamp;
        }
    }

    /**
     * @dev Check portfolio health alerts
     */
    function _checkPortfolioHealthAlert(
        address _user,
        AlertSubscription memory _subscription,
        uint256 _subscriptionIndex
    ) internal {
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = 
            portfolioAnalyzer.getPortfolioAnalysis(_user);

        if (!analysis.isValid) return;

        // Check if portfolio health is degrading
        if (analysis.overallRisk > _subscription.threshold) {
            AlertPriority priority = _calculatePriority(analysis.overallRisk, _subscription.threshold);
            
            string memory message = string(abi.encodePacked(
                "Portfolio health alert: Risk level at ",
                _uint2str(analysis.overallRisk / 100),
                "%, Diversification: ",
                _uint2str(analysis.diversificationScore / 100),
                "%"
            ));

            _createAlert(
                _user,
                AlertType.PORTFOLIO_HEALTH,
                priority,
                address(0),
                message,
                analysis.overallRisk,
                _subscription.threshold
            );

            userSubscriptions[_user][_subscriptionIndex].lastTriggered = block.timestamp;
        }
    }

    /**
     * @dev Check price volatility alerts
     */
    function _checkPriceVolatilityAlert(
        address _user,
        AlertSubscription memory _subscription,
        uint256 _subscriptionIndex
    ) internal {
        try riskOracle.getAggregatedRisk(_subscription.protocol) returns (
            uint256 volatilityRisk, uint256, uint256, uint256, uint256, uint256, uint256
        ) {
            if (volatilityRisk > _subscription.threshold) {
                AlertPriority priority = _calculatePriority(volatilityRisk, _subscription.threshold);
                
                string memory message = string(abi.encodePacked(
                    "High price volatility detected for protocol. Volatility risk: ",
                    _uint2str(volatilityRisk / 100),
                    "%"
                ));

                _createAlert(
                    _user,
                    AlertType.PRICE_VOLATILITY,
                    priority,
                    _subscription.protocol,
                    message,
                    volatilityRisk,
                    _subscription.threshold
                );

                userSubscriptions[_user][_subscriptionIndex].lastTriggered = block.timestamp;
            }
        } catch {
            return;
        }
    }

    /**
     * @dev Create a new alert
     */
    function _createAlert(
        address _user,
        AlertType _alertType,
        AlertPriority _priority,
        address _protocol,
        string memory _message,
        uint256 _riskLevel,
        uint256 _threshold
    ) internal {
        // Check if user has reached maximum alerts
        if (activeAlertsCount[_user] >= MAX_ALERTS_PER_USER) {
            // Remove oldest alert to make room
            _removeOldestAlert(_user);
        }

        // Check user preferences if they exist
        UserPreferences memory prefs = userPreferences[_user];
        if (prefs.globalCooldown > 0 && uint256(_priority) < prefs.minimumPriority) return;

        Alert memory newAlert = Alert({
            id: nextAlertId,
            user: _user,
            alertType: _alertType,
            priority: _priority,
            protocol: _protocol,
            message: _message,
            riskLevel: _riskLevel,
            threshold: _threshold,
            timestamp: block.timestamp,
            isActive: true,
            isResolved: false
        });

        alerts[nextAlertId] = newAlert;
        userAlerts[_user].push(nextAlertId);
        
        // Update counters
        activeAlertsCount[_user]++;
        alertTypeCount[_alertType]++;
        alertPriorityCount[_priority]++;

        emit AlertTriggered(nextAlertId, _user, _alertType, _priority, _message);
        nextAlertId++;
    }

    /**
     * @dev Calculate alert priority based on risk level vs threshold
     */
    function _calculatePriority(uint256 _riskLevel, uint256 _threshold) internal pure returns (AlertPriority) {
        if (_riskLevel <= _threshold) return AlertPriority.LOW;
        
        uint256 excess = _riskLevel - _threshold;
        uint256 ratio = (excess * 100) / _threshold;

        if (ratio >= 50) return AlertPriority.CRITICAL;  // 50%+ above threshold
        if (ratio >= 25) return AlertPriority.HIGH;      // 25%+ above threshold
        if (ratio >= 10) return AlertPriority.MEDIUM;    // 10%+ above threshold
        return AlertPriority.LOW;
    }

    /**
     * @dev Remove oldest alert for user
     */
    function _removeOldestAlert(address _user) internal {
        uint256[] storage userAlertIds = userAlerts[_user];
        if (userAlertIds.length == 0) return;

        uint256 oldestAlertId = userAlertIds[0];
        alerts[oldestAlertId].isActive = false;
        
        // Remove from user's alert list
        for (uint256 i = 0; i < userAlertIds.length - 1; i++) {
            userAlertIds[i] = userAlertIds[i + 1];
        }
        userAlertIds.pop();
        
        activeAlertsCount[_user]--;
    }

    /**
     * @dev Resolve an alert
     */
    function resolveAlert(uint256 _alertId) external validAlertId(_alertId) onlyAlertOwner(_alertId) {
        Alert storage alert = alerts[_alertId];
        require(alert.isActive, "Alert already resolved");

        alert.isActive = false;
        alert.isResolved = true;
        
        activeAlertsCount[alert.user]--;
        
        emit AlertResolved(_alertId, msg.sender);
    }

    /**
     * @dev Get user's active alerts
     */
    function getUserActiveAlerts(address _user) external view returns (Alert[] memory) {
        uint256[] memory alertIds = userAlerts[_user];
        uint256 activeCount = 0;
        
        // Count active alerts
        for (uint256 i = 0; i < alertIds.length; i++) {
            if (alerts[alertIds[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active alerts
        Alert[] memory activeAlerts = new Alert[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < alertIds.length; i++) {
            if (alerts[alertIds[i]].isActive) {
                activeAlerts[index] = alerts[alertIds[i]];
                index++;
            }
        }
        
        return activeAlerts;
    }

    /**
     * @dev Get user's subscriptions
     */
    function getUserSubscriptions(address _user) external view returns (AlertSubscription[] memory) {
        return userSubscriptions[_user];
    }

    /**
     * @dev Get alert statistics
     */
    function getAlertStats() external view returns (
        uint256 totalAlerts,
        uint256 activeAlerts,
        uint256 criticalAlerts,
        uint256 highAlerts,
        uint256 mediumAlerts,
        uint256 lowAlerts
    ) {
        uint256 totalActiveAlerts = 0;
        for (uint256 i = 1; i < nextAlertId; i++) {
            if (alerts[i].isActive) {
                totalActiveAlerts++;
            }
        }

        return (
            nextAlertId - 1,
            totalActiveAlerts,
            alertPriorityCount[AlertPriority.CRITICAL],
            alertPriorityCount[AlertPriority.HIGH],
            alertPriorityCount[AlertPriority.MEDIUM],
            alertPriorityCount[AlertPriority.LOW]
        );
    }

    /**
     * @dev Utility function to convert uint to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        
        return string(bstr);
    }

    /**
     * @dev Emergency function to disable all alerts for a user
     */
    function emergencyDisableAlerts(address _user) external {
        require(msg.sender == _user || msg.sender == owner(), "Not authorized");
        
        // Disable all subscriptions
        for (uint256 i = 0; i < userSubscriptions[_user].length; i++) {
            userSubscriptions[_user][i].isActive = false;
        }
        
        // Resolve all active alerts
        uint256[] memory alertIds = userAlerts[_user];
        for (uint256 i = 0; i < alertIds.length; i++) {
            if (alerts[alertIds[i]].isActive) {
                alerts[alertIds[i]].isActive = false;
                alerts[alertIds[i]].isResolved = true;
            }
        }
        
        activeAlertsCount[_user] = 0;
    }
}

