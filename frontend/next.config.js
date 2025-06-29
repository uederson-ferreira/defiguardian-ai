// ==================================================================================
// Módulo: Next.js Configuration
// Localização: /frontend/next.config.js
// ==================================================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para Vercel
  output: 'standalone',
  
  // Otimizações (desabilitando minificação temporariamente para resolver problema do worker)
  swcMinify: false,
  compress: false,
  
  // Configurações expericlearmentais
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },

  // Transpile packages que podem causar problemas
  transpilePackages: ['@walletconnect/heartbeat'],

  // Configuração do Webpack para resolver problemas com workers
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Configuração para ignorar workers problemáticos no Terser
    if (config.optimization && config.optimization.minimizer) {
      config.optimization.minimizer.forEach((minimizer) => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          minimizer.options.exclude = /HeartbeatWorker/;
        }
      });
    }

    return config;
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
