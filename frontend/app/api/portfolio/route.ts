// app/api/portfolio/route.ts
// API PARA GERENCIAR PORTFOLIOS - CORRIGIDA COM TIPAGEM

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Interfaces para tipagem
interface PositionRecord {
  id: string
  portfolio_id: string
  protocol: string
  token_symbol: string
  value_usd: number
  apy: number | null
  risk_level: string
  created_at: string
  updated_at: string
}

interface PortfolioRecord {
  id: string
  user_id: string
  name: string
  description: string | null
  wallet_address: string
  total_value: number
  risk_score: number
  created_at: string
  updated_at: string
  positions?: PositionRecord[]
}

interface PortfolioWithStats extends PortfolioRecord {
  calculated_total_value: number
  average_apy: number
  position_count: number
}

// GET - Buscar portfolios do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

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

    // Buscar portfolios com posições
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('portfolios')
      .select(`
        *,
        positions(*)
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })

    if (portfoliosError) {
      console.error('❌ Erro ao buscar portfolios:', portfoliosError)
      return NextResponse.json(
        { error: 'Erro ao buscar portfolios' },
        { status: 500 }
      )
    }

    // Calcular estatísticas - COM TIPAGEM CORRETA
    const portfoliosWithStats: PortfolioWithStats[] = (portfolios as PortfolioRecord[])?.map((portfolio: PortfolioRecord) => {
      const positions = portfolio.positions || []
      const totalValue = positions.reduce((sum: number, pos: PositionRecord) => sum + Number(pos.value_usd), 0)
      const avgApy = positions.length > 0 
        ? positions.reduce((sum: number, pos: PositionRecord) => sum + (Number(pos.apy) || 0), 0) / positions.length
        : 0

      return {
        ...portfolio,
        calculated_total_value: totalValue,
        average_apy: avgApy,
        position_count: positions.length
      }
    }) || []

    return NextResponse.json({
      success: true,
      portfolios: portfoliosWithStats
    })

  } catch (error) {
    console.error('❌ Erro na API de portfolios GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo portfolio
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { name, description, walletAddress } = await request.json()

    if (!name || !walletAddress) {
      return NextResponse.json(
        { error: 'Nome e endereço da wallet são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar endereço Ethereum
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/
    if (!ethereumAddressRegex.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Endereço da wallet inválido' },
        { status: 400 }
      )
    }

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

    // Criar portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert([
        {
          user_id: userData.id,
          name,
          description: description || null,
          wallet_address: walletAddress,
          total_value: 0,
          risk_score: 0
        }
      ])
      .select('*')
      .single()

    if (portfolioError) {
      console.error('❌ Erro ao criar portfolio:', portfolioError)
      return NextResponse.json(
        { error: 'Erro ao criar portfolio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio criado com sucesso',
      portfolio: portfolio as PortfolioRecord
    })

  } catch (error) {
    console.error('❌ Erro na API de portfolios POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}