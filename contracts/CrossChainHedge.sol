// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CrossChainHedge is CCIPReceiver {
    address public owner;
    IRouterClient private router;
    IERC20 public linkToken;
    
    event MessageSent(bytes32 indexed messageId);
    event MessageReceived(bytes32 indexed messageId, address sender, bytes data);
    
    constructor(address _router, address _link) CCIPReceiver(_router) {
        owner = msg.sender;
        router = IRouterClient(_router);
        linkToken = IERC20(_link);
    }
    
    function sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        bytes calldata message
    ) external returns (bytes32) {
        bytes memory extraArgs = Client._argsToBytes(
            Client.EVMExtraArgsV1({
                gasLimit: 200_000,
                strict: false
            })
        );

        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: message,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: extraArgs,
            feeToken: address(linkToken)
        });
        
        uint256 fees = router.getFee(destinationChainSelector, evm2AnyMessage);
        require(linkToken.transferFrom(msg.sender, address(this), fees), "Fee transfer failed");
        require(linkToken.approve(address(router), fees), "Fee approval failed");
        
        bytes32 messageId = router.ccipSend(destinationChainSelector, evm2AnyMessage);
        emit MessageSent(messageId);
        return messageId;
    }
    
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        emit MessageReceived(message.messageId, abi.decode(message.sender, (address)), message.data);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    function withdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(IERC20(token).transfer(owner, balance), "Transfer failed");
    }
} 