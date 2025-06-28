// app/api/auth/[...nextauth]/route.ts
// ✅ NEXTAUTH COM LOGIN COMPLETO VIA EMAIL/SENHA

import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-config'

console.log('🚀 Configurando NextAuth com login completo...')

// Criar handler
const handler = NextAuth(authOptions)

console.log('✅ NextAuth configurado com login completo!')

export { handler as GET, handler as POST }