/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Cloudflare Pages deployment
  output: 'export',
  
  // Enable trailing slashes for consistent routing
  trailingSlash: true,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true
  },
  
  // Optional: Configure asset prefix for CDN
  // assetPrefix: process.env.NODE_ENV === 'production' ? 'https://your-cdn-domain.com' : '',
  
  // Optional: Configure base path if deploying to subdirectory
  // basePath: '/your-app',
  
  // Optional: Configure experimental features
  experimental: {
    // Enable if using app directory
    // appDir: true,
  },
  
  // Optional: Configure webpack for additional optimizations
  webpack: (config, { isServer }) => {
    // Add any custom webpack configuration here
    return config;
  },
  
  // Optional: Configure redirects for static export
  async redirects() {
    return [
      // Example redirects
      // {
      //   source: '/old-page',
      //   destination: '/new-page',
      //   permanent: true,
      // },
    ];
  },
  
  // Optional: Configure headers for security
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
        ],
      },
    ];
  },
}

module.exports = nextConfig;
