import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path('./src'),
      // `server-only` throws outside a React Server environment; it's a no-op in tests.
      'server-only': path('./tests/stubs/server-only.ts'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/setup-env.ts'],
    // Integration tests share one database, so run files one at a time.
    fileParallelism: false,
  },
})
