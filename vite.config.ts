import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The demo is a fully client-side single page: no proxy, no external data
// source, no server-side rendering, no backend. The build output is a static
// `dist/` folder that can be served by any static host.
//
// The Vitest configuration lives inside this file because the milestone scope
// does not allow a separate `vitest.config.ts`.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    reporters: ['default'],
  },
});
