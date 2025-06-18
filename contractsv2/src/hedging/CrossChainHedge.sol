// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts/src/v0.8/ccip/libraries/Client.sol";
import "@chainlink/contracts/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CrossChainHedge
 * @dev Contrato para hedge cross-chain usando Chainlink CCIP
 */
contract CrossChainHedge is CCIPReceiver, Ownable, ReentrancyGuard {
    IRouterClient private router;
    IERC20 public linkToken;
    
    // Mapping para rastrear mensagens enviadas
    mapping(bytes32 => bool) public sentMessages;
    
    // Mapping para rastrear mensagens recebidas
    mapping(bytes32 => bool) public receivedMessages;
    
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address indexed receiver,
        bytes data,
        uint256 fees
    );
    
    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        bytes data
    );
    
    event CrossChainHedgeExecuted(
        bytes32 indexed messageId,
        address indexed user,
        uint256 amount,
        string hedgeType
    );
    
    // ✅ CONSTRUTOR CORRIGIDO
    constructor(address _router, address _link) 
        CCIPReceiver(_router) 
        Ownable(msg.sender) 
    {
        router = IRouterClient(_router);
        linkToken = IERC20(_link);
    }
    
    /**
     * @dev Envia mensagem cross-chain
     */
    function sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        bytes calldata message
    ) external nonReentrant returns (bytes32) {
        // ✅ CORRIGIDO: Usar apenas gasLimit para EVMExtraArgsV1
        bytes memory extraArgs = Client._argsToBytes(
            Client.EVMExtraArgsV1({gasLimit: 200_000})
        );

        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: message,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: extraArgs,
            feeToken: address(linkToken)
        });
        
        uint256 fees = router.getFee(destinationChainSelector, evm2AnyMessage);
        require(fees > 0, "Invalid fee calculation");
        require(
            linkToken.transferFrom(msg.sender, address(this), fees), 
            "Fee transfer failed"
        );
        require(
            linkToken.approve(address(router), fees), 
            "Fee approval failed"
        );
        
        bytes32 messageId = router.ccipSend(destinationChainSelector, evm2AnyMessage);
        
        // Registrar mensagem enviada
        sentMessages[messageId] = true;
        
        emit MessageSent(messageId, destinationChainSelector, receiver, message, fees);
        return messageId;
    }
    
    /**
     * @dev Função interna para receber mensagens CCIP
     */
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        bytes32 messageId = any2EvmMessage.messageId;
        
        // Verificar se já processamos esta mensagem
        require(!receivedMessages[messageId], "Message already processed");
        receivedMessages[messageId] = true;
        
        address sender = abi.decode(any2EvmMessage.sender, (address));
        
        emit MessageReceived(
            messageId,
            any2EvmMessage.sourceChainSelector,
            sender,
            any2EvmMessage.data
        );
        
        // Processar a mensagem de hedge
        _processHedgeMessage(messageId, any2EvmMessage.data);
    }
    
    /**
     * @dev Processa mensagem de hedge recebida
     */
    function _processHedgeMessage(bytes32 messageId, bytes memory data) internal {
        try this.decodeHedgeMessage(data) returns (
            address user,
            uint256 amount,
            string memory hedgeType
        ) {
            // Executar hedge específico baseado no tipo
            _executeHedgeAction(user, amount, hedgeType);
            
            emit CrossChainHedgeExecuted(messageId, user, amount, hedgeType);
        } catch {
            // Log erro mas não reverter para evitar travamento
            // Em produção, implementar sistema de retry ou alertas
        }
    }
    
    /**
     * @dev Decodifica mensagem de hedge
     */
    function decodeHedgeMessage(bytes calldata data) external pure returns (
        address user,
        uint256 amount,
        string memory hedgeType
    ) {
        return abi.decode(data, (address, uint256, string));
    }
    
    /**
     * @dev Executa ação de hedge específica
     */
    function _executeHedgeAction(
        address user,
        uint256 amount,
        string memory hedgeType
    ) internal {
        bytes32 hedgeTypeHash = keccak256(abi.encodePacked(hedgeType));
        
        if (hedgeTypeHash == keccak256(abi.encodePacked("EMERGENCY_EXIT"))) {
            // Implementar lógica de saída de emergência
            _emergencyExit(user, amount);
        } else if (hedgeTypeHash == keccak256(abi.encodePacked("REBALANCE"))) {
            // Implementar lógica de rebalanceamento
            _crossChainRebalance(user, amount);
        } else if (hedgeTypeHash == keccak256(abi.encodePacked("LIQUIDITY_MOVE"))) {
            // Implementar movimentação de liquidez
            _moveLiquidity(user, amount);
        }
        // Adicionar mais tipos conforme necessário
    }
    
    /**
     * @dev Saída de emergência cross-chain
     */
    function _emergencyExit(address user, uint256 amount) internal {
        // Implementar lógica de saída de emergência
        // Por exemplo: liquidar posições e enviar fundos para chain segura
        
        // Placeholder - implementar conforme necessário
        emit CrossChainHedgeExecuted(bytes32(0), user, amount, "EMERGENCY_EXIT");
    }
    
    /**
     * @dev Rebalanceamento cross-chain
     */
    function _crossChainRebalance(address user, uint256 amount) internal {
        // Implementar lógica de rebalanceamento cross-chain
        
        // Placeholder - implementar conforme necessário
        emit CrossChainHedgeExecuted(bytes32(0), user, amount, "REBALANCE");
    }
    
    /**
     * @dev Movimentação de liquidez cross-chain
     */
    function _moveLiquidity(address user, uint256 amount) internal {
        // Implementar lógica de movimentação de liquidez
        
        // Placeholder - implementar conforme necessário
        emit CrossChainHedgeExecuted(bytes32(0), user, amount, "LIQUIDITY_MOVE");
    }
    
    /**
     * @dev Estima taxa para envio de mensagem
     */
    function estimateFee(
        uint64 destinationChainSelector,
        address receiver,
        bytes calldata message
    ) external view returns (uint256) {
        bytes memory extraArgs = Client._argsToBytes(
            Client.EVMExtraArgsV1({gasLimit: 200_000})
        );

        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: message,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: extraArgs,
            feeToken: address(linkToken)
        });
        
        return router.getFee(destinationChainSelector, evm2AnyMessage);
    }
    
    /**
     * @dev Verifica se uma mensagem foi enviada
     */
    function isMessageSent(bytes32 messageId) external view returns (bool) {
        return sentMessages[messageId];
    }
    
    /**
     * @dev Verifica se uma mensagem foi recebida
     */
    function isMessageReceived(bytes32 messageId) external view returns (bool) {
        return receivedMessages[messageId];
    }
    
    /**
     * @dev Saca tokens do contrato (apenas owner)
     */
    function withdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        require(IERC20(token).transfer(owner(), balance), "Transfer failed");
    }
    
    /**
     * @dev Saca ETH do contrato (apenas owner)
     */
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Função para receber ETH
     */
    receive() external payable {}
    
    /**
     * @dev Atualiza endereço do router CCIP (apenas owner)
     */
    function updateRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Invalid router address");
        router = IRouterClient(newRouter);
    }
    
    /**
     * @dev Atualiza endereço do token LINK (apenas owner)
     */
    function updateLinkToken(address newLinkToken) external onlyOwner {
        require(newLinkToken != address(0), "Invalid LINK token address");
        linkToken = IERC20(newLinkToken);
    }
}