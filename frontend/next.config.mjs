/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  serverExternalPackages: ['web3', 'ethers'],
  async rewrites() {
    return [
      {
        source: '/api/((?!auth).*)',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'}/api/$1`,
      },
    ]
  },
}
export default nextConfig
