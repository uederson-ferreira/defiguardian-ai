// app/api/sync/blockchain/route.ts
// API PARA SINCRONIZAR DADOS DOS SMART CONTRACTS

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getAuthSession } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { ethers } from 'ethers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuração da blockchain
const AVALANCHE_RPC = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc'
const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC)

// Smart Contract Addresses
const CONTRACTS = {
  PORTFOLIO_ANALYZER: process.env.NEXT_PUBLIC_PORTFOLIO_ANALYZER,
  RISK_ORACLE: process.env.NEXT_PUBLIC_RISK_ORACLE,
  RISK_REGISTRY: process.env.NEXT_PUBLIC_RISK_REGISTRY
}

// ABI simplificada para testes (substitua pela ABI real dos seus contratos)
const PORTFOLIO_ANALYZER_ABI = [
  "function getPortfolioData(address wallet) view returns (uint256 totalValue, uint256 riskScore, string[] protocols)",
  "function getPositions(address wallet) view returns (tuple(string protocol, address contractAddr, uint256 amount, uint256 valueUSD)[])"
]

const RISK_ORACLE_ABI = [
  "function getProtocolRisk(address protocol) view returns (uint256 riskScore, string riskLevel)",
  "function getLatestPrice(address asset) view returns (uint256 price, uint256 timestamp)"
]

// POST - Sincronizar dados da blockchain
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { walletAddress, portfolioId } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Endereço da wallet é obrigatório' },
        { status: 400 }
      )
    }

    // Validar endereço Ethereum
    if (!ethers.isAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Endereço da wallet inválido' },
        { status: 400 }
      )
    }

    console.log('🔄 Sincronizando dados blockchain para:', walletAddress)

    // Buscar usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const syncResults = {
      portfolio: null as any,
      positions: [] as any[],
      risks: [] as any[],
      errors: [] as string[]
    }

    try {
      // 1. Sincronizar dados do portfolio
      if (CONTRACTS.PORTFOLIO_ANALYZER) {
        const portfolioContract = new ethers.Contract(
          CONTRACTS.PORTFOLIO_ANALYZER,
          PORTFOLIO_ANALYZER_ABI,
          provider
        )

        try {
          // Buscar dados do portfolio do smart contract
          const portfolioData = await portfolioContract.getPortfolioData(walletAddress)
          
          const totalValue = ethers.formatEther(portfolioData.totalValue)
          const riskScore = Number(portfolioData.riskScore)

          // Atualizar portfolio no banco
          if (portfolioId) {
            const { data: updatedPortfolio, error: portfolioError } = await supabase
              .from('portfolios')
              .update({
                total_value: totalValue,
                risk_score: riskScore,
                updated_at: new Date().toISOString()
              })
              .eq('id', portfolioId)
              .eq('user_id', userData.id)
              .select('*')
              .single()

            if (portfolioError) {
              syncResults.errors.push(`Erro ao atualizar portfolio: ${portfolioError.message}`)
            } else {
              syncResults.portfolio = updatedPortfolio
            }
          }

          console.log('✅ Portfolio sincronizado:', { totalValue, riskScore })

        } catch (contractError) {
          console.error('❌ Erro ao consultar contrato Portfolio Analyzer:', contractError)
          syncResults.errors.push(`Portfolio Analyzer: ${contractError}`)
        }
      }

      // 2. Sincronizar posições (simulado - adapte conforme seus contratos)
      try {
        // Exemplo de posições simuladas baseadas no wallet
        const mockPositions = [
          {
            protocol_name: 'Compound V3',
            protocol_address: '0xBf863e9edd0684c7C45793A2C15F35DeF78cb28c',
            asset_symbol: 'USDC',
            amount: '5000.00',
            value_usd: '5000.00',
            apy: 4.2,
            risk_level: 'low'
          },
          {
            protocol_name: 'Lido stETH',
            protocol_address: '0xE1AbA07004A31FefB36c927FAa98Dd6D04d1CC21',
            asset_symbol: 'stETH',
            amount: '2.5',
            value_usd: '8750.00',
            apy: 5.8,
            risk_level: 'medium'
          }
        ]

        if (portfolioId) {
          // Limpar posições antigas
          await supabase
            .from('positions')
            .delete()
            .eq('portfolio_id', portfolioId)

          // Inserir novas posições
          const { data: newPositions, error: positionsError } = await supabase
            .from('positions')
            .insert(
              mockPositions.map(pos => ({
                portfolio_id: portfolioId,
                ...pos
              }))
            )
            .select('*')

          if (positionsError) {
            syncResults.errors.push(`Erro ao sincronizar posições: ${positionsError.message}`)
          } else {
            syncResults.positions = newPositions
          }
        }

        console.log('✅ Posições sincronizadas:', mockPositions.length)

      } catch (positionsError) {
        console.error('❌ Erro ao sincronizar posições:', positionsError)
        syncResults.errors.push(`Posições: ${positionsError}`)
      }

      // 3. Verificar riscos e criar alertas se necessário
      try {
        if (syncResults.portfolio && Number(syncResults.portfolio.risk_score) > 80) {
          // Criar alerta de risco alto
          const { error: alertError } = await supabase
            .from('risk_alerts')
            .insert([
              {
                user_id: userData.id,
                portfolio_id: portfolioId,
                alert_type: 'risk_threshold',
                severity: 'high',
                title: 'High Risk Detected',
                message: `Portfolio risk score is ${syncResults.portfolio.risk_score}%, which exceeds the recommended threshold.`,
                is_read: false,
                is_dismissed: false
              }
            ])

          if (alertError) {
            syncResults.errors.push(`Erro ao criar alerta: ${alertError.message}`)
          } else {
            console.log('⚠️ Alerta de risco criado')
          }
        }

      } catch (alertError) {
        console.error('❌ Erro ao verificar riscos:', alertError)
        syncResults.errors.push(`Alertas: ${alertError}`)
      }

    } catch (blockchainError) {
      console.error('❌ Erro geral na sincronização blockchain:', blockchainError)
      syncResults.errors.push(`Blockchain: ${blockchainError}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronização blockchain concluída',
      data: syncResults,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro na API de sincronização blockchain:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// GET - Status da sincronização
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Verificar status dos contratos
    const contractStatus = {
      blockchain: {
        network: 'Avalanche Fuji',
        rpc_url: AVALANCHE_RPC,
        connected: false
      },
      contracts: {
        portfolio_analyzer: {
          address: CONTRACTS.PORTFOLIO_ANALYZER,
          status: 'unknown'
        },
        risk_oracle: {
          address: CONTRACTS.RISK_ORACLE,
          status: 'unknown'
        },
        risk_registry: {
          address: CONTRACTS.RISK_REGISTRY,
          status: 'unknown'
        }
      }
    }

    try {
      // Testar conexão com a blockchain
      const blockNumber = await provider.getBlockNumber()
      contractStatus.blockchain.connected = true

      // Testar contratos (se existirem)
      for (const [name, address] of Object.entries(CONTRACTS)) {
        if (address && ethers.isAddress(address)) {
          try {
            const code = await provider.getCode(address)
            contractStatus.contracts[name.toLowerCase() as keyof typeof contractStatus.contracts].status = 
              code !== '0x' ? 'deployed' : 'not_deployed'
          } catch {
            contractStatus.contracts[name.toLowerCase() as keyof typeof contractStatus.contracts].status = 'error'
          }
        }
      }

      console.log('✅ Status blockchain verificado, bloco atual:', blockNumber)

    } catch (error) {
      console.error('❌ Erro ao verificar status blockchain:', error)
    }

    return NextResponse.json({
      success: true,
      status: contractStatus,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro na API de status blockchain:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}