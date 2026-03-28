import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third argument '' allows loading all variables regardless of VITE_ prefix.
  // Fix: Property 'cwd' does not exist on type 'Process'. Casting to any for Node.js environment compatibility.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    base: './',
    plugins: [react()],
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '')
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext'
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: true,
      historyApiFallback: true,
    }
  };
});