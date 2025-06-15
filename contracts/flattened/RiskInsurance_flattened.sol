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

// src/core/RiskInsurance.sol

/**
 * @title RiskInsurance
 * @dev Simple insurance contract for high-risk positions
 */
contract RiskInsurance is Ownable(msg.sender), ReentrancyGuard, Pausable {
    PortfolioRiskAnalyzer public immutable portfolioAnalyzer;
    
    struct InsurancePolicy {
        address holder;
        uint256 coverageAmount;
        uint256 premium;
        uint256 riskThreshold;      // Risk level that triggers payout
        uint256 startTime;
        uint256 duration;           // Policy duration in seconds
        bool isActive;
        bool hasClaimed;
    }

    mapping(uint256 => InsurancePolicy) public policies;
    mapping(address => uint256[]) public userPolicies;
    uint256 public nextPolicyId = 1;
    
    uint256 public totalPremiums;
    uint256 public totalClaims;
    uint256 public insurancePool;

    event PolicyCreated(uint256 indexed policyId, address indexed holder, uint256 coverageAmount);
    event ClaimPaid(uint256 indexed policyId, address indexed holder, uint256 amount);
    event PremiumCollected(uint256 indexed policyId, uint256 amount);

    constructor(address _portfolioAnalyzer) {
        portfolioAnalyzer = PortfolioRiskAnalyzer(_portfolioAnalyzer);
    }

    /**
     * @dev Create an insurance policy
     */
    function createPolicy(
        uint256 _coverageAmount,
        uint256 _riskThreshold,
        uint256 _duration
    ) external payable nonReentrant whenNotPaused {
        require(_coverageAmount > 0, "Coverage amount must be positive");
        require(_riskThreshold <= 10000, "Risk threshold too high");
        require(_duration >= 1 days && _duration <= 365 days, "Invalid duration");
        
        // Calculate premium (simplified: 1% of coverage + risk-based adjustment)
        uint256 basePremium = _coverageAmount / 100;
        uint256 riskAdjustment = (basePremium * _riskThreshold) / 10000;
        uint256 premium = basePremium + riskAdjustment;
        
        require(msg.value >= premium, "Insufficient premium payment");

        policies[nextPolicyId] = InsurancePolicy({
            holder: msg.sender,
            coverageAmount: _coverageAmount,
            premium: premium,
            riskThreshold: _riskThreshold,
            startTime: block.timestamp,
            duration: _duration,
            isActive: true,
            hasClaimed: false
        });

        userPolicies[msg.sender].push(nextPolicyId);
        
        totalPremiums += premium;
        insurancePool += premium;

        emit PolicyCreated(nextPolicyId, msg.sender, _coverageAmount);
        emit PremiumCollected(nextPolicyId, premium);

        // Refund excess payment
        if (msg.value > premium) {
            payable(msg.sender).transfer(msg.value - premium);
        }

        nextPolicyId++;
    }

    /**
     * @dev Claim insurance payout if risk threshold exceeded
     */
    function claimInsurance(uint256 _policyId) external nonReentrant whenNotPaused {
        InsurancePolicy storage policy = policies[_policyId];
        
        require(policy.holder == msg.sender, "Not policy holder");
        require(policy.isActive, "Policy not active");
        require(!policy.hasClaimed, "Already claimed");
        require(block.timestamp <= policy.startTime + policy.duration, "Policy expired");

        // Check current portfolio risk
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = portfolioAnalyzer.getPortfolioAnalysis(msg.sender);
        require(analysis.isValid, "No valid portfolio analysis");
        require(analysis.overallRisk >= policy.riskThreshold, "Risk threshold not exceeded");

        // Calculate payout based on risk level vs threshold
        uint256 riskExcess = analysis.overallRisk - policy.riskThreshold;
        uint256 payoutRatio = (riskExcess * 10000) / (10000 - policy.riskThreshold);
        if (payoutRatio > 10000) payoutRatio = 10000; // Cap at 100%
        
        uint256 payout = (policy.coverageAmount * payoutRatio) / 10000;
        require(payout <= insurancePool, "Insufficient insurance pool");

        policy.hasClaimed = true;
        policy.isActive = false;
        
        totalClaims += payout;
        insurancePool -= payout;

        payable(msg.sender).transfer(payout);

        emit ClaimPaid(_policyId, msg.sender, payout);
    }

    /**
     * @dev Get user's policies
     */
    function getUserPolicies(address _user) external view returns (uint256[] memory) {
        return userPolicies[_user];
    }

    /**
     * @dev Owner can withdraw excess premiums (simple treasury function)
     */
    function withdrawExcess(uint256 _amount) external onlyOwner whenNotPaused {
        require(_amount <= insurancePool, "Cannot withdraw more than pool");
        require(insurancePool - _amount >= totalClaims, "Must maintain claims reserve");
        
        insurancePool -= _amount;
        payable(owner()).transfer(_amount);
    }

    /**
     * @dev Add funds to insurance pool
     */
    function addToPool() external payable whenNotPaused {
        insurancePool += msg.value;
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

