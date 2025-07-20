import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { consoleForwardPlugin } from 'vite-console-forward-plugin';

export default defineConfig({
  plugins: [
    react(),
    consoleForwardPlugin({
      enabled: true,
      endpoint: '/api/debug/client-logs',
      levels: ['log', 'warn', 'error', 'info', 'debug']
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '../shared',
      // Node.js polyfills for WordPress packages
      'path': 'path-browserify',
      'url': 'url'
    }
  },
  define: {
    global: 'globalThis',
    process: {
      env: {}
    }
  },
  optimizeDeps: {
    exclude: ['fs'],
    include: ['@wordpress/block-editor', '@wordpress/blocks', '@wordpress/components', '@wordpress/data']
  }
});
