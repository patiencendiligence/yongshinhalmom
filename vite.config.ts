import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.TIME_LOGIC': JSON.stringify(env.VITE_TIME_LOGIC || env.TIME_LOGIC || process.env.VITE_TIME_LOGIC || env.TIME_LOGIC || ''),
      'process.env.PAYMENT_URL': JSON.stringify(env.VITE_PAYMENT_URL || env.PAYMENT_URL || process.env.VITE_PAYMENT_URL || process.env.PAYMENT_URL || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});