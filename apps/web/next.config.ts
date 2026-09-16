import type { NextConfig } from 'next';
let withSentryConfig: any;
try {
  ({ withSentryConfig } = require('@sentry/nextjs'));
} catch {}

const nextConfig: NextConfig = {
  
  transpilePackages: ["@whats-for-dinner/ui", "@whats-for-dinner/utils", "@whats-for-dinner/theme", "@whats-for-dinner/config"],
  
  // Phase 2: Performance & UX Stability - Bundle Optimization
  experimental: {
    optimizePackageImports: ["@whats-for-dinner/ui", "lucide-react", "@radix-ui/react-slot", "@radix-ui/react-label", "@radix-ui/react-separator", "@radix-ui/react-switch", "@radix-ui/react-tabs"],
    optimizeCss: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js', 'archiver', '@sendgrid/mail'],
  },
  
  // Phase 2: Image Optimization with WebP/AVIF support
  images: {
    unoptimized: true, // Required for static export, but we optimize source images
    domains: ['images.unsplash.com', 'cdn.shopify.com'], // Vercel hardening: explicit image domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "**", // Fallback for other domains
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache
  },
  
  trailingSlash: true,
  distDir: 'dist',
  turbopack: {},
  
  // Phase 2: Performance Optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Security: Remove X-Powered-By header
  generateEtags: true,
  
  // Performance: Optimize production builds
  swcMinify: true,
  
  // Performance: Enable static page generation optimization
  optimizeFonts: true,
  
  // Phase 2: Bundle optimization with code splitting
  webpack: (config, { isServer, dev, webpack }) => {
    if (!isServer && !dev) {
      // Enhanced tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework code
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Shared libraries
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module: any) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                return `lib-${packageName?.replace('@', '')}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // Supabase bundle
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              priority: 20,
              reuseExistingChunk: true,
            },
            // UI components
            ui: {
              test: /[\\/]packages[\\/]ui[\\/]/,
              name: 'ui',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
      
      // Compression
      config.optimization.minimize = true;
    }
    
    return config;
  },
  
  // Phase 2: Headers for caching and performance
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
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
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

// Wrap with Sentry if DSN is configured
const configWithSentry = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;

export default configWithSentry;
