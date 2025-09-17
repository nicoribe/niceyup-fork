import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.{ts,tsx}'],
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: [
    '@workspace/ai',
    '@workspace/auth',
    '@workspace/db',
    '@workspace/engine',
    '@workspace/env',
    '@workspace/storage',
    '@workspace/utils',
  ],
})
