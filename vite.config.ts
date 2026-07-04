import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 31420,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 34173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    css: true,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**', '.codex-cache/**'],
  },
});

