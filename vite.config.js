import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development the front-end proxies /api to the Express server on :4000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
