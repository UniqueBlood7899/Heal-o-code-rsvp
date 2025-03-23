//vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,  // Allow access from network/IP
    allowedHosts: ['.ngrok-free.app'],  // Allow ngrok subdomains
  },
});
