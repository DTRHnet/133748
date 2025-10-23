import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        web: './src/web/index.html',
      },
      output: {
        entryFileNames: 'web/[name].js',
      },
      external: [
        'child_process',
        'fs',
        'path',
        'os',
        'url',
        'node:process',
        'node:buffer',
        'node:path',
        'node:url',
        'node:util',
        'node:child_process',
        'node:fs/promises',
        'node:stream',
        'node:events',
        'node:fs',
        'node:os',
        'assert',
        'module',
      ],
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  base: '/',
  define: {
    global: 'globalThis',
  },
});
