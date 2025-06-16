// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts/src/v0.8/ccip/libraries/Client.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrossChainHedge
 * @dev Contrato para execução cross-chain de estratégias de hedge
 */
contract CrossChainHedge is Ownable {
    // Chainlink CCIP Router
    IRouterClient private immutable i_router;

    // Mapeamento de chains suportadas
    mapping(uint64 => bool) public supportedChains;
    
    // Estrutura para mensagem cross-chain
    struct HedgeMessage {
        address token;
        uint256 amount;
        address recipient;
        uint256 targetPrice;
        uint256 slippage;
    }

    // Eventos
    event CrossChainHedgeInitiated(
        bytes32 messageId,
        uint64 destinationChainSelector,
        address token,
        uint256 amount
    );

    event CrossChainHedgeExecuted(
        bytes32 messageId,
        address token,
        uint256 amount,
        address recipient
    );

    constructor(address router) Ownable(msg.sender) {
        i_router = IRouterClient(router);
        
        // Adiciona chains suportadas (Avalanche e outras)
        supportedChains[43114] = true; // Avalanche C-Chain
        supportedChains[1] = true;     // Ethereum
        supportedChains[56] = true;    // BSC
    }

    /**
     * @dev Inicia uma operação de hedge cross-chain
     */
    function initiateHedge(
        uint64 destinationChainSelector,
        address token,
        uint256 amount,
        address recipient,
        uint256 targetPrice,
        uint256 slippage
    ) external payable {
        require(supportedChains[destinationChainSelector], "Chain nao suportada");
        require(amount > 0, "Quantidade invalida");
        
        // Transfere tokens do usuário para este contrato
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        // Prepara a mensagem cross-chain
        HedgeMessage memory hedgeMessage = HedgeMessage({
            token: token,
            amount: amount,
            recipient: recipient,
            targetPrice: targetPrice,
            slippage: slippage
        });

        // Codifica a mensagem
        bytes memory encodedMessage = abi.encode(hedgeMessage);

        // Prepara os dados para o CCIP
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)),
            data: encodedMessage,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: "",
            feeToken: address(0)
        });

        // Envia a mensagem cross-chain
        bytes32 messageId = i_router.ccipSend{value: msg.value}(
            destinationChainSelector,
            message
        );

        emit CrossChainHedgeInitiated(
            messageId,
            destinationChainSelector,
            token,
            amount
        );
    }

    /**
     * @dev Recebe e processa mensagem cross-chain
     */
    function ccipReceive(Client.Any2EVMMessage memory message) external {
        require(msg.sender == address(i_router), "Somente router");

        // Decodifica a mensagem
        HedgeMessage memory hedgeMessage = abi.decode(message.data, (HedgeMessage));

        // Executa o hedge na chain destino
        executeHedge(hedgeMessage);

        emit CrossChainHedgeExecuted(
            message.messageId,
            hedgeMessage.token,
            hedgeMessage.amount,
            hedgeMessage.recipient
        );
    }

    /**
     * @dev Executa a operação de hedge na chain destino
     */
    function executeHedge(HedgeMessage memory message) internal {
        // Verifica o preço atual
        uint256 currentPrice = getCurrentPrice(message.token);
        
        // Verifica slippage
        require(
            currentPrice >= message.targetPrice * (100 - message.slippage) / 100 &&
            currentPrice <= message.targetPrice * (100 + message.slippage) / 100,
            "Slippage muito alto"
        );

        // Executa a operação de hedge
        IERC20(message.token).transfer(message.recipient, message.amount);
    }

    /**
     * @dev Retorna o preço atual de um token
     */
    function getCurrentPrice(address token) internal view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(getPriceFeed(token));
        (, int256 price,,,) = priceFeed.latestRoundData();
        return uint256(price);
    }

    /**
     * @dev Retorna o endereço do price feed para um token
     */
    function getPriceFeed(address token) internal pure returns (address) {
        // Implementar mapeamento de tokens para price feeds
        return address(0);
    }

    /**
     * @dev Adiciona suporte a uma nova chain
     */
    function addSupportedChain(uint64 chainSelector) external onlyOwner {
        supportedChains[chainSelector] = true;
    }

    /**
     * @dev Remove suporte a uma chain
     */
    function removeSupportedChain(uint64 chainSelector) external onlyOwner {
        supportedChains[chainSelector] = false;
    }

    /**
     * @dev Permite que o contrato receba AVAX
     */
    receive() external payable {}
} 