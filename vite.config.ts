import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Pakia environment variables kulingana na "mode" (production/development)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      // Tunatumia env variable tuliyopakia hapo juu badala ya process.env ya kawaida
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
    resolve: {
      alias: {
        // Inahakikisha '@' inatambua root directory yako vizuri
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR (Hot Module Replacement)
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      // Inasaidia kuepuka matatizo ya "Chunk size" kwenye Cloudflare
      chunkSizeWarningLimit: 1000,
    }
  };
});
