// app/api/auth/[...nextauth]/route.ts
// ✅ NEXTAUTH COM LOGIN COMPLETO VIA EMAIL/SENHA

import NextAuth, { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

console.log('🚀 Configurando NextAuth com login completo...')

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 🔥 CONFIGURAÇÃO NEXTAUTH EXPORTADA
export const authOptions: NextAuthOptions = {
  providers: [
    // 1. Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // 2. GitHub OAuth  
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    
    // 3. ✅ Credentials COMPLETO (Cadastro + Login)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        action: { label: 'Action', type: 'text' },
        name: { label: 'Nome', type: 'text' }
      },
      async authorize(credentials) {
        console.log('🔑 Processando credenciais:', { 
          email: credentials?.email, 
          action: credentials?.action 
        })

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        const { email, password, action, name } = credentials

        try {
          if (action === 'signup') {
            // ===== CADASTRO =====
            console.log('📝 Criando novo usuário...')
            
            if (!name?.trim()) {
              throw new Error('Nome é obrigatório para cadastro')
            }

            // Verificar se usuário já existe
            const { data: existingUser } = await supabase
              .from('users')
              .select('id, email')
              .eq('email', email)
              .single()

            if (existingUser) {
              throw new Error('Email já cadastrado')
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 12)

            // Criar usuário
            const { data: newUser, error: userError } = await supabase
              .from('users')
              .insert({
                email,
                name,
                provider: 'credentials',
                provider_id: email,
              })
              .select()
              .single()

            if (userError) {
              console.error('❌ Erro ao criar usuário:', userError)
              throw new Error('Erro ao criar usuário: ' + userError.message)
            }

            // Salvar senha na tabela separada
            const { error: passwordError } = await supabase
              .from('user_passwords')
              .insert({
                user_id: newUser.id,
                password_hash: hashedPassword,
              })

            if (passwordError) {
              console.error('❌ Erro ao salvar senha:', passwordError)
              // Remover usuário se der erro na senha
              await supabase
                .from('users')
                .delete()
                .eq('id', newUser.id)
              
              throw new Error('Erro ao salvar senha')
            }

            console.log('✅ Usuário criado com sucesso:', newUser.email)

            return {
              id: newUser.id.toString(),
              email: newUser.email,
              name: newUser.name,
              image: newUser.image,
            }

          } else {
            // ===== LOGIN =====
            console.log('🔓 Fazendo login via email...')
            
            // Buscar usuário
            const { data: user, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('email', email)
              .eq('provider', 'credentials')
              .single()

            if (userError || !user) {
              console.error('❌ Usuário não encontrado:', userError)
              throw new Error('Email não encontrado. Verifique o email ou crie uma conta.')
            }

            // Buscar senha
            const { data: passwordData, error: passwordError } = await supabase
              .from('user_passwords')
              .select('password_hash')
              .eq('user_id', user.id)
              .single()

            if (passwordError || !passwordData) {
              console.error('❌ Senha não encontrada:', passwordError)
              throw new Error('Dados de login inválidos')
            }

            // Verificar senha
            const isValidPassword = await bcrypt.compare(password, passwordData.password_hash)
            if (!isValidPassword) {
              console.error('❌ Senha incorreta')
              throw new Error('Senha incorreta')
            }

            console.log('✅ Login realizado com sucesso:', user.email)

            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
              image: user.image,
            }
          }
        } catch (error) {
          console.error('❌ Erro na autenticação:', error)
          throw error
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback:', { 
        provider: account?.provider, 
        email: user.email 
      })

      // Para OAuth providers (Google/GitHub)
      if (account?.provider && (account.provider === 'google' || account.provider === 'github')) {
        try {
          // Verificar se usuário existe
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email!)
            .single()

          if (!existingUser) {
            console.log('👤 Criando usuário OAuth...')
            
            // Criar novo usuário OAuth
            const { error } = await supabase
              .from('users')
              .insert({
                email: user.email,
                name: user.name,
                image: user.image,
                provider: account.provider,
                provider_id: account.providerAccountId,
              })

            if (error) {
              console.error('❌ Erro ao criar usuário OAuth:', error)
            } else {
              console.log('✅ Usuário OAuth criado com sucesso')
            }
          } else {
            console.log('👤 Atualizando usuário OAuth existente...')
            
            // Atualizar dados
            await supabase
              .from('users')
              .update({
                name: user.name,
                image: user.image,
                updated_at: new Date().toISOString()
              })
              .eq('email', user.email!)
          }
        } catch (error) {
          console.error('❌ Erro no signIn OAuth:', error)
        }
      }

      return true
    },

    async jwt({ token, user, account }) {
      // Adicionar dados customizados ao token
      if (user) {
        token.id = user.id
        token.provider = account?.provider || 'credentials'
      }

      // Buscar dados atualizados do Supabase
      if (token.email) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', token.email)
            .single()

          if (userData) {
            token.id = userData.id.toString()
            token.provider = userData.provider
            token.walletAddress = userData.wallet_address
          }
        } catch (error) {
          console.error('❌ Erro ao buscar dados do usuário:', error)
        }
      }

      return token
    },

    async session({ session, token }) {
      // Adicionar dados do token à sessão
      if (token) {
        session.user.id = token.id as string
        session.user.provider = token.provider as string
        session.user.walletAddress = token.walletAddress as string
      }
      return session
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  debug: process.env.NODE_ENV === 'development',

  events: {
    async signIn(message) {
      console.log('🎉 Usuário logado:', message.user.email)
    },
    async signOut(message) {
      console.log('👋 Usuário deslogado')
    }
  }
}

// Criar handler
const handler = NextAuth(authOptions)

console.log('✅ NextAuth configurado com login completo!')

export { handler as GET, handler as POST }