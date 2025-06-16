# Sistema de Automação de Hedge

Este projeto implementa um sistema automatizado de hedge usando Chainlink Automation e Avalanche para execução descentralizada de estratégias de proteção de portfólio.

## Funcionalidades

- Automação de estratégias via Chainlink Automation
- Execução descentralizada na rede Avalanche
- Thresholds configuráveis pelo usuário
- Rebalanceamento automático cross-chain
- Integração com Chainlink Price Feeds
- Suporte a múltiplas redes via CCIP

## Contratos

### HedgeAutomation.sol
- Gerencia estratégias de hedge
- Monitora preços via Chainlink
- Executa operações automaticamente
- Suporta stop loss e take profit

### CrossChainHedge.sol
- Executa operações cross-chain
- Usa Chainlink CCIP para mensagens
- Gerencia rebalanceamento entre redes
- Implementa verificações de slippage

## Configuração

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas configurações
```

4. Compile os contratos:
```bash
npx hardhat compile
```

5. Execute os testes:
```bash
npx hardhat test
```

## Deploy

Para fazer deploy na rede Fuji (testnet):
```bash
npx hardhat deploy --network fuji
```

Para fazer deploy na Avalanche mainnet:
```bash
npx hardhat deploy --network avalanche
```

## Uso

1. Crie uma estratégia de hedge:
```solidity
hedgeAutomation.createStrategy(
    tokenAddress,
    amount,
    targetPrice,
    threshold,
    HedgeType.STOP_LOSS
);
```

2. Configure rebalanceamento cross-chain:
```solidity
crossChainHedge.initiateHedge(
    destinationChainSelector,
    tokenAddress,
    amount,
    recipient,
    targetPrice,
    slippage
);
```

## Endereços dos Contratos

### Mainnet
- HedgeAutomation: `[endereço_após_deploy]`
- CrossChainHedge: `[endereço_após_deploy]`

### Testnet (Fuji)
- HedgeAutomation: `[endereço_após_deploy]`
- CrossChainHedge: `[endereço_após_deploy]`

## Segurança

- Todos os contratos passam por verificações de slippage
- Implementação de padrões de segurança OpenZeppelin
- Proteções contra reentrância
- Verificações de permissões e limites

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

MIT 