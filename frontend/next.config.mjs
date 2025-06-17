/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Suas configurações existentes (manter!)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // ✅ Adicionar para Docker:
  output: 'standalone',
  
  // ✅ Para hot reload no Docker
  experimental: {
    serverComponentsExternalPackages: []
  },

  // ✅ Para funcionar com diferentes hosts/proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'}/api/:path*`
      }
    ]
  }
}

export default nextConfig