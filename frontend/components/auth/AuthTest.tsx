'use client'

import { useAuth } from '@/lib/auth/supabase-auth'

export function AuthTest() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <div className="text-center">Carregando...</div>
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Teste de Auth</h2>
      
      {!user ? (
        <div className="space-y-4">
          <p>Usuário não logado</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>ID:</strong> {user.id}</p>
          
          <button
            onClick={signOut}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
