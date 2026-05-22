import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    // ✅ PERFORMANCE OPTIMIZATIONS
    build: {
      // Reduce chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Enable minification
      minify: 'terser',
      // Terser options for better compression
      terserOptions: {
        compress: {
          drop_console: true,     // Remove console.log in production
          drop_debugger: true,    // Remove debugger statements
        },
      },
      // Rollup options for code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor libraries into separate chunks
            vendor: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            icons: ['lucide-react'],
            animations: ['motion'],
          },
        },
      },
      // Target modern browsers
      target: 'es2020',
      // Enable source maps for debugging (optional, disable for production)
      sourcemap: false,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'motion'],
    },
    // ESBuild options for faster builds
    esbuild: {
      legalComments: 'none',      // Remove comments
      treeShaking: true,          // Enable tree shaking
    },
  };
});