import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.{ts,tsx}'],
  clean: true,
  format: 'esm',
  outDir: 'dist',
  noExternal: [
    '@workspace/ai',
    '@workspace/auth',
    '@workspace/db',
    '@workspace/engine',
    '@workspace/env',
    '@workspace/utils',
  ],
})
