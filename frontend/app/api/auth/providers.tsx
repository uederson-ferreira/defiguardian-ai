// app/api/auth/providers.tsx
// ✅ PROVIDERS CORRIGIDOS - NEXTAUTH + SUPABASE

'use client'

import { SessionProvider } from 'next-auth/react'
import { createContext, useContext } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Criar cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Context para Supabase
const SupabaseContext = createContext<SupabaseClient | null>(null)

// Hook para usar Supabase
export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase deve ser usado dentro de um SupabaseProvider')
  }
  return context
}

// Provider combinado
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SupabaseContext.Provider value={supabase}>
        {children}
      </SupabaseContext.Provider>
    </SessionProvider>
  )
}