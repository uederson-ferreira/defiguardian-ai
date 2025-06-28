// types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      walletAddress?: string
      provider?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    walletAddress?: string
    provider?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    walletAddress?: string
    provider?: string
  }
}