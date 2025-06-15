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

