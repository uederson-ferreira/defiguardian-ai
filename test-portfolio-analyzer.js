// Script para testar o Portfolio Analyzer na Avalanche Fuji
const { ethers } = require('ethers');

// Configuração da rede Avalanche Fuji
const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc';
const PORTFOLIO_ANALYZER_ADDRESS = '0x1e60Cf3CA97866ddC6cb640D169061da9Fe04192';

// ABI simplificado do Portfolio Analyzer
const PORTFOLIO_ANALYZER_ABI = [
  'function calculatePortfolioRisk(address user) view returns (uint256)',
  'function getPortfolioAnalysis(address user) view returns (tuple(uint256 totalValue, uint256 overallRisk, uint256 diversificationScore, uint256 timestamp, bool isValid))',
  'function getUserPositions(address user) view returns (tuple(address protocol, address token, uint256 amount, uint256 value)[])',
  'function owner() view returns (address)',
  'function contractRegistry() view returns (address)'
];

async function testPortfolioAnalyzer() {
  try {
    console.log('🔍 Testando Portfolio Analyzer na Avalanche Fuji...');
    
    // Conectar ao provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Conectado ao RPC da Avalanche Fuji');
    
    // Criar instância do contrato
    const portfolioAnalyzer = new ethers.Contract(
      PORTFOLIO_ANALYZER_ADDRESS,
      PORTFOLIO_ANALYZER_ABI,
      provider
    );
    
    console.log('📋 Endereço do contrato:', PORTFOLIO_ANALYZER_ADDRESS);
    
    // Verificar se o contrato existe
    const code = await provider.getCode(PORTFOLIO_ANALYZER_ADDRESS);
    if (code === '0x') {
      throw new Error('❌ Contrato não encontrado no endereço especificado');
    }
    console.log('✅ Contrato encontrado na blockchain');
    
    // Testar funções básicas
    try {
      const owner = await portfolioAnalyzer.owner();
      console.log('👤 Owner do contrato:', owner);
    } catch (err) {
      console.log('⚠️  Erro ao obter owner:', err.message);
    }
    
    try {
      const contractRegistry = await portfolioAnalyzer.contractRegistry();
      console.log('📝 Contract Registry:', contractRegistry);
    } catch (err) {
      console.log('⚠️  Erro ao obter contract registry:', err.message);
    }
    
    // Usar o endereço do owner para teste
    const owner = await portfolioAnalyzer.owner();
    const testAddress = owner; // Usar o owner como endereço de teste
    console.log('\n🧪 Testando análise de portfolio para:', testAddress);
    
    try {
      const positions = await portfolioAnalyzer.getUserPositions(testAddress);
      console.log('📊 Posições encontradas:', positions.length);
      
      if (positions.length > 0) {
        console.log('📋 Primeira posição:', {
          protocol: positions[0].protocol,
          token: positions[0].token,
          amount: positions[0].amount.toString(),
          value: positions[0].value.toString()
        });
      }
    } catch (err) {
      console.log('⚠️  Erro ao obter posições:', err.message);
    }
    
    try {
      const analysis = await portfolioAnalyzer.getPortfolioAnalysis(testAddress);
      console.log('📈 Análise do portfolio:', {
        totalValue: analysis.totalValue.toString(),
        overallRisk: analysis.overallRisk.toString(),
        diversificationScore: analysis.diversificationScore.toString(),
        timestamp: analysis.timestamp.toString(),
        isValid: analysis.isValid
      });
    } catch (err) {
      console.log('⚠️  Erro ao obter análise:', err.message);
    }
    
    try {
      const riskScore = await portfolioAnalyzer.calculatePortfolioRisk(testAddress);
      console.log('⚡ Risk Score:', riskScore.toString());
    } catch (err) {
      console.log('⚠️  Erro ao calcular risco:', err.message);
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testPortfolioAnalyzer();