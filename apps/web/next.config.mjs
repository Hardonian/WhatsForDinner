

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@whats-for-dinner/ui", "@whats-for-dinner/utils", "@whats-for-dinner/theme", "@whats-for-dinner/config"],
  
  experimental: {
    optimizePackageImports: ["@whats-for-dinner/ui", "lucide-react", "@radix-ui/react-slot", "@radix-ui/react-label", "@radix-ui/react-separator", "@radix-ui/react-switch", "@radix-ui/react-tabs"],
    optimizeCss: true,
    serverComponentsExternalPackages: ['@supabase/supabase-js', 'archiver', '@sendgrid/mail', '@whats-for-dinner/utils'],
  },
  
  images: {
    domains: ['images.unsplash.com', 'cdn.shopify.com'],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "**" },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
  
  trailingSlash: true,
  distDir: 'dist',
  
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  generateEtags: true,
  optimizeFonts: true,
  
  webpack: (config, { isServer, dev }) => {
    // Externalize optional deps that aren't installed
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push(({ request }, callback) => {
        const optional = ['mixpanel-browser', '@amplitude/analytics-browser', 'redis', '@sentry/nextjs', '@opentelemetry/winston-transport', 'dtrace-provider'];
        if (optional.includes(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      });
    }

    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    if (!isServer && !dev) {
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
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                return `lib-${packageName?.replace('@', '')}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              priority: 20,
              reuseExistingChunk: true,
            },
            ui: {
              test: /[\\/]packages[\\/]ui[\\/]/,
              name: 'ui',
              priority: 20,
              reuseExistingChunk: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
      config.optimization.minimize = true;
    }
    return config;
  },
  
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=1800' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;