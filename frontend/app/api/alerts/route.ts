// app/api/alerts/route.ts
// API PARA GERENCIAR ALERTAS DE RISCO - CORRIGIDA COM TIPAGEM

import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import type { Session } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Interfaces para tipagem
interface AlertRecord {
  id: string
  user_id: string
  portfolio_id?: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  updated_at: string
  portfolios?: {
    name: string
    wallet_address: string
  }
}

interface StatsRecord {
  severity: 'low' | 'medium' | 'high' | 'critical'
  is_read: boolean
}

// GET - Buscar alertas do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession() as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

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

    // Construir query
    let query = supabase
      .from('risk_alerts')
      .select(`
        *,
        portfolios(name, wallet_address)
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: alerts, error: alertsError } = await query

    if (alertsError) {
      console.error('❌ Erro ao buscar alertas:', alertsError)
      return NextResponse.json(
        { error: 'Erro ao buscar alertas' },
        { status: 500 }
      )
    }

    // Estatísticas dos alertas
    const { data: stats } = await supabase
      .from('risk_alerts')
      .select('severity, is_read')
      .eq('user_id', userData.id)

    const statsData = stats as StatsRecord[] | null

    const alertStats = {
      total: statsData?.length || 0,
      unread: statsData?.filter((alert: StatsRecord) => !alert.is_read).length || 0,
      critical: statsData?.filter((alert: StatsRecord) => alert.severity === 'critical').length || 0,
      high: statsData?.filter((alert: StatsRecord) => alert.severity === 'high').length || 0,
      medium: statsData?.filter((alert: StatsRecord) => alert.severity === 'medium').length || 0,
      low: statsData?.filter((alert: StatsRecord) => alert.severity === 'low').length || 0
    }

    return NextResponse.json({
      success: true,
      alerts: alerts as AlertRecord[],
      stats: alertStats
    })

  } catch (error) {
    console.error('❌ Erro na API de alertas GET:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo alerta
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession() as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { 
      portfolioId, 
      alertType, 
      severity, 
      title, 
      message 
    } = await request.json()

    if (!alertType || !severity || !title || !message) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar severity
    const validSeverities = ['low', 'medium', 'high', 'critical'] as const
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: 'Severity inválido' },
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

    // Criar alerta
    const { data: alert, error: alertError } = await supabase
      .from('risk_alerts')
      .insert([
        {
          user_id: userData.id,
          portfolio_id: portfolioId || null,
          alert_type: alertType,
          severity,
          title,
          message,
          is_read: false,
          is_dismissed: false
        }
      ])
      .select('*')
      .single()

    if (alertError) {
      console.error('❌ Erro ao criar alerta:', alertError)
      return NextResponse.json(
        { error: 'Erro ao criar alerta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Alerta criado com sucesso',
      alert: alert as AlertRecord
    })

  } catch (error) {
    console.error('❌ Erro na API de alertas POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Marcar alerta como lido/dispensado
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession() as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { alertId, isRead, isDismissed } = await request.json()

    if (!alertId) {
      return NextResponse.json(
        { error: 'ID do alerta é obrigatório' },
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

    // Atualizar alerta
    const updateData: Partial<AlertRecord> = {}
    if (typeof isRead === 'boolean') updateData.is_read = isRead
    if (typeof isDismissed === 'boolean') updateData.is_dismissed = isDismissed

    const { data: alert, error: alertError } = await supabase
      .from('risk_alerts')
      .update(updateData)
      .eq('id', alertId)
      .eq('user_id', userData.id) // Segurança: só atualizar alertas do próprio usuário
      .select('*')
      .single()

    if (alertError) {
      console.error('❌ Erro ao atualizar alerta:', alertError)
      return NextResponse.json(
        { error: 'Erro ao atualizar alerta' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Alerta atualizado com sucesso',
      alert: alert as AlertRecord
    })

  } catch (error) {
    console.error('❌ Erro na API de alertas PATCH:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}