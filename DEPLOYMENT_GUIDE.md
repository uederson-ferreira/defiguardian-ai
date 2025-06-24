# 🛡️ RiskGuardian - Guia de Implantação Atualizado

## 📋 Resumo das Atualizações

O backend e o agente ElizaOS foram **sincronizados com os novos contratos** implantados na **Avalanche Fuji Testnet**. Todas as configurações foram atualizadas para usar os endereços de contrato mais recentes.

## 🔄 Mudanças Realizadas

### 1. **Backend Sincronizado**

- ✅ Arquivo `backend/src/contracts/addresses/fuji-contracts.ts` criado
- ✅ Configuração `backend/src/config/environment.ts` atualizada
- ✅ Arquivo `.env.example` atualizado com novos endereços
- ✅ Arquivo `.env` criado automaticamente

### 2. **ElizaOS Agent Sincronizado**

- ✅ Configuração `elizaos-riskguardian/src/index.ts` atualizada
- ✅ Arquivo `.env.fuji` criado com configuração completa
- ✅ Arquivo `.env` criado automaticamente
- ✅ Erros de TypeScript corrigidos

### 3. **Automação Criada**

- ✅ Script `scripts/update-contracts.sh` para futuras atualizações
- ✅ Processo automatizado de sincronização

## 🏗️ Novos Endereços de Contrato (Fuji)

### Contratos Principais

```bash
CONTRACT_REGISTRY=0xA65647C7335835F477831E4E907aBaA1560646a8
RISK_REGISTRY=0xF404b05B55850cBaC8891c9Db1524Fc1D437124C
RISK_ORACLE=0x14Ca6F2BEd3FC051E1E8f409D04369A75894a4A8
PORTFOLIO_ANALYZER=0x1e60Cf3CA97866ddC6cb640D169061da9Fe04192
```

### Contratos de Automação

```bash
ALERT_SYSTEM=0xe46F4AcC01B4664c50E421dBb50343096be05Ecc
RISK_GUARDIAN_MASTER=0x00F4Ce590406031E88666BF1Fd1310A809a8A3a0
```

### Contratos de Seguro

```bash
RISK_INSURANCE=0x6021d94b73D1b4b0515902BEa7bf17cE3dDa2e8F
```

### Contratos de Hedge

```bash
STOP_LOSS_HEDGE=0x1e7D390EB42112f33930A9Dab1cdeB848361f163
REBALANCE_HEDGE=0xe261a9e260C7F4aCB9E2a1c3daeb141791bbb600
VOLATILITY_HEDGE=0x5C6c0B72FeDB3027eDee33C62bb7C5D3700a488F
CROSS_CHAIN_HEDGE=0xaC521848dC05C7fE4eb43236D1719AEA725143cF
```

## 🚀 Como Iniciar o Sistema

### 1. **Configurar Variáveis de Ambiente**

#### Backend

```bash
cd backend
# O arquivo .env já foi criado automaticamente
# Ajuste as configurações de banco de dados se necessário
vim .env
```

#### ElizaOS

```bash
cd elizaos-riskguardian
# O arquivo .env já foi criado automaticamente
# Adicione sua chave da OpenRouter API
vim .env
# Substitua: OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 2. **Instalar Dependências**

### Backend Dependencies

```bash
cd backend
npm install
```

### ElizaOS Agent Dependencies

```bash
cd elizaos-riskguardian
bun install
```

### 3. **Iniciar os Serviços**

#### Starting the Backend Service

```bash
cd backend
npm run dev
```

#### ElizaOS Agent

```bash
cd elizaos-riskguardian
bun run dev
```

## 🔧 Script de Atualização Automática

Para futuras atualizações de contrato, use:

```bash
# Atualizar para Fuji (padrão)
./scripts/update-contracts.sh fuji

# Atualizar para outras redes (quando disponível)
./scripts/update-contracts.sh sepolia
./scripts/update-contracts.sh mainnet
```

## 🧪 Verificação do Sistema

### 1. **Verificar Backend**

```bash
cd backend
npm run build
# Deve compilar sem erros
```

### 2. **Verificar ElizaOS**

```bash
cd elizaos-riskguardian
bun run build
# Deve compilar sem erros
```

### 3. **Testar Conectividade**

```bash
# Verificar se os contratos estão acessíveis
curl -X GET "https://api.avax-test.network/ext/bc/C/rpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 📊 Configuração da Rede

- **Rede**: Avalanche Fuji Testnet
- **Chain ID**: 43113
- **RPC URL**: <https://api.avax-test.network/ext/bc/C/rpc>
- **Explorer**: <https://testnet.snowtrace.io/>

## 🔍 Solução de Problemas

### Problema: "Contract not found"

**Solução**: Verifique se os endereços estão corretos no arquivo `.env`

### Problema: "Network connection failed"

**Solução**: Verifique a conectividade com a RPC da Fuji

### Problema: "TypeScript compilation errors"

**Solução**: Execute `./scripts/update-contracts.sh fuji` novamente

## 📝 Próximos Passos

1. ✅ **Contratos sincronizados** - Concluído
2. 🔄 **Testar funcionalidades** - Próximo
3. 🚀 **Deploy em produção** - Futuro
4. 📈 **Monitoramento** - Futuro

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do backend e ElizaOS
2. Confirme se as variáveis de ambiente estão corretas
3. Execute o script de atualização novamente
4. Verifique a conectividade com a rede Fuji

---

**Status**: ✅ Sistema sincronizado e pronto para uso
**Última atualização**: $(date)
**Rede**: Avalanche Fuji Testnet (43113)
