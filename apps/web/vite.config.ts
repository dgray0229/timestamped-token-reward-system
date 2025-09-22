import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Use proper Node.js polyfills plugin
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Polyfills to include
      include: ['buffer', 'process', 'util', 'stream', 'crypto', 'assert'],
      // Polyfills to exclude (use false to disable all polyfills)
      exclude: [],
      // Whether to make `global` available in the browser
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    {
      name: 'enhanced-globals',
      config(config) {
        config.define = config.define || {};
        // Ensure these are available immediately
        config.define.global = 'globalThis';
        config.define['process.env'] = 'process.env';
      },
      transformIndexHtml(html) {
        return html.replace(
          '<head>',
          `<head>
  <script>
    // Synchronous global setup for immediate availability
    if (typeof global === "undefined") {
      globalThis.global = globalThis;
    }

    // Enhanced process polyfill with better error handling
    if (typeof process === "undefined") {
      globalThis.process = {
        env: {},
        version: '',
        platform: 'browser',
        nextTick: (fn, ...args) => setTimeout(() => fn(...args), 0),
        exit: () => {},
        cwd: () => '/',
        chdir: () => {},
        stderr: { write: () => {} },
        stdout: { write: () => {} },
        stdin: { read: () => null }
      };
    } else if (process && !process.env) {
      process.env = {};
    }

    // Request/Response polyfills for better Solana compatibility
    if (typeof Request === "undefined") {
      globalThis.Request = class Request {};
    }
    if (typeof Response === "undefined") {
      globalThis.Response = class Response {};
    }
    if (typeof Headers === "undefined") {
      globalThis.Headers = class Headers {};
    }
  </script>`
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
    global: 'globalThis',
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
