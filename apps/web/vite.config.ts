import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'buffer-polyfill',
      config(config, { command }) {
        if (command === 'serve') {
          config.define = config.define || {};
          config.define.global = 'globalThis';
        }
      },
      transformIndexHtml(html) {
        return html.replace(
          '<head>',
          '<head>\n  <script>if (typeof global === "undefined") { var global = globalThis; }</script>\n  <script>import { Buffer } from "buffer"; globalThis.Buffer = Buffer;</script>'
        );
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      // Explicit alias for shared package
      '@reward-system/shared': path.resolve(
        __dirname,
        '../../packages/shared/dist'
      ),
      // Node.js polyfills for browser
      buffer: 'buffer',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util',
      assert: 'assert',
    },
  },
  define: {
    // Fix process.env for browser
    'process.env': {},
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      external: [
        '@trezor/connect-common',
        '@trezor/connect-web',
        '@trezor/env-utils',
      ],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          solana: ['@solana/web3.js', '@solana/wallet-adapter-react'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-wallets',
      'buffer',
      'crypto-browserify',
      'stream-browserify',
      'util',
      'assert',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
