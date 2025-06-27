/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Webpack configuration for Web3 compatibility and performance
  webpack: (config, { isServer, dev }) => {
    // Ignore specific modules in client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
      };
    }

    // Handle problematic modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      'encoding': false,
    };

    // External modules for server-side rendering
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Optimize for production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            web3: {
              name: 'web3',
              test: /[\/\\]node_modules[\/\\](wagmi|@rainbow-me|@walletconnect|viem|ethers)[\/\\]/,
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }

    return config;
  },

  // Environment variables available to the browser
  env: {
    CUSTOM_KEY: 'my-value',
  },

  // Experimental features
  experimental: {
    // Removed appDir as it's default in Next.js 14+
  },

  // Image optimization configuration
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile images
      'avatars.githubusercontent.com', // GitHub profile images
    ],
  },

  // Headers for security and CORS
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
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss: ws:; frame-src 'none'; object-src 'none'; base-uri 'self';",
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;