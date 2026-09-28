import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: {
    chunkSizeWarningLimit: 4000,
    // один JS-файл: так приложение собирается в самодостаточную страницу (npm run build:artifact)
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
