// app/api/test/route.ts
// API TEST BÁSICA PARA VERIFICAR SE AS APIS FUNCIONAM

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 API Test route executada')
    
    return NextResponse.json({
      success: true,
      message: 'API Test funcionando perfeitamente!',
      timestamp: new Date().toISOString(),
      server_info: {
        node_env: process.env.NODE_ENV,
        nextjs_version: 'Next.js 15.2.4',
        status: 'operational'
      }
    })
  } catch (error) {
    console.error('❌ Erro na API Test:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('🧪 API Test POST executada com body:', body)
    
    return NextResponse.json({
      success: true,
      message: 'POST request recebido!',
      received_data: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erro na API Test POST:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar POST request',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}