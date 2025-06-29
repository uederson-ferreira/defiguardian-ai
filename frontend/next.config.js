// ==================================================================================
// Módulo: Next.js Configuration
// Localização: /frontend/next.config.js
// ==================================================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para Vercel
  output: 'standalone',
  
  // Otimizações
  swcMinify: true,
  compress: true,
  
  // Configurações experimentais
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  
  // Configuração de imagens
  images: {
    domains: ['npqgcrjcoqgyykdfmklu.supabase.co'],
    dangerouslyAllowSVG: true,
  },
  
  // Variables de ambiente
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

module.exports = nextConfig;
