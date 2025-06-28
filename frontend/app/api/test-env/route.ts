// app/api/test-env/route.ts
// API PARA TESTAR SE AS VARIÁVEIS DE AMBIENTE ESTÃO CARREGANDO

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Testando carregamento de variáveis ENV...')
    
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Definido ✅' : 'NÃO DEFINIDO ❌',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Definido ✅' : 'NÃO DEFINIDO ❌',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Definido ✅' : 'NÃO DEFINIDO ❌',
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'Definido ✅' : 'NÃO DEFINIDO ❌',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'Definido ✅' : 'NÃO DEFINIDO ❌',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Definido ✅' : 'NÃO DEFINIDO ❌',
      timestamp: new Date().toISOString()
    }

    console.log('📊 Resultado do teste ENV:', envCheck)

    return NextResponse.json({
      success: true,
      message: 'API Test funcionando!',
      environment_check: envCheck
    })

  } catch (error) {
    console.error('❌ Error in Test API:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}