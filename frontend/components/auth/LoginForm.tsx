'use client'

import { useAuth } from '@/lib/auth/supabase-auth'

export function LoginForm() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {user ? (
        <div>
          <p>Logged in as: {user.email}</p>
          <button 
            onClick={signOut}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <p>Please sign in to continue</p>
        </div>
      )}
    </div>
  )
}
