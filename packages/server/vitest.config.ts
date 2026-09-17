import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    alias: {
      'next/server': path.resolve(__dirname, './src/test-stubs/next-server.ts'),
      '@opentelemetry/exporter-metrics-otlp-http': path.resolve(__dirname, './src/test-stubs/otel-metric-exporter.ts'),
      '@whats-for-dinner/server/observability': path.resolve(__dirname, './src/observability/index.ts'),
      '@whats-for-dinner/server': path.resolve(__dirname, './src/index.ts'),
      '@whats-for-dinner/server/*': path.resolve(__dirname, './src/*'),
      '@whats-for-dinner/adapters-crm': path.resolve(__dirname, '../adapters/crm/index.ts'),
      '@whats-for-dinner/adapters-crm/*': path.resolve(__dirname, '../adapters/crm/*'),
      '@whats-for-dinner/utils/guardian': path.resolve(__dirname, '../utils/src/guardian/index.ts'),
      '@whats-for-dinner/utils': path.resolve(__dirname, '../utils/src/index.ts'),
      '@whats-for-dinner/utils/*': path.resolve(__dirname, '../utils/src/*'),
      'dotenv': path.resolve(__dirname, './src/test-stubs/dotenv.ts'),
      'react': path.resolve(__dirname, './src/test-stubs/react.ts'),
    },
    env: {
      NODE_ENV: 'test',
      SUPABASE_JWT_SECRET: 'test-secret-key-for-jwt-signing-which-is-at-least-32-chars-long!',
      REDIS_URL: 'redis://localhost:6379',
      OPENAI_API_KEY: 'sk-test-key-for-unit-tests',
    },
  },
});
