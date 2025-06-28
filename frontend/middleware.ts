// middleware.ts (na raiz do projeto)
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Middleware executado apenas para rotas protegidas
    console.log('🔒 Middleware: Usuario autenticado acessando:', req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token, req: _req }) => {
        // Verificar se o usuário tem token válido
        const { pathname } = _req.nextUrl
        
        // Rotas que requerem autenticação
        const protectedPaths = ['/dashboard']
        
        if (protectedPaths.some(path => pathname.startsWith(path))) {
          return !!token
        }
        
        // Outras rotas são públicas
        return true
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*'
  ]
}