import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://dummy.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'dummy-service-key',
      ANTHROPIC_API_KEY: 'dummy-anthropic-key',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
