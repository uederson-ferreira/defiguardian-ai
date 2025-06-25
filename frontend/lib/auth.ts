// lib/auth.ts
// ✅ HELPER PARA AUTENTICAÇÃO - RESOLVE TODOS OS IMPORTS

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Função helper para obter sessão do servidor
export const getAuthSession = () => getServerSession(authOptions)

// Re-exportar authOptions para outros arquivos
export { authOptions }

// Tipos úteis
export type AuthSession = Awaited<ReturnType<typeof getAuthSession>>

// Helper para verificar se usuário está autenticado
export const isAuthenticated = (session: AuthSession): session is NonNullable<AuthSession> => {
  return !!session?.user?.email
}

// Helper para obter ID do usuário
export const getUserId = (session: AuthSession): string | null => {
  return session?.user?.id || null
}

// Helper para obter email do usuário
export const getUserEmail = (session: AuthSession): string | null => {
  return session?.user?.email || null
}