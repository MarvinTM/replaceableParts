import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.js'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**',
      'tests/e2e/**'
    ]
  }
});
