import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './src/index.js',
        web: './src/web/index.html',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'web' ? 'web/[name].js' : '[name].js';
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  base: '/',
});
