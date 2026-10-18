import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { guidesPlugin } from './vite-plugins/guides.js';

export default defineConfig({
  // guides1: each src/content/guides/*.md becomes a page's data (vite-plugins/guides.js).
  plugins: [react(), guidesPlugin()],
  // When the build was made: the Black Friday banner counts days from it
  // in the pre-rendered pages and in the browser's first render.
  define: {
    __REMVO_BUILT_AT__: JSON.stringify(Date.now()),
  },
  // dist/.vite/manifest.json tells prerender/run.mjs which stylesheets and
  // chunks each page needs; it removes the file afterwards.
  build: {
    manifest: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@app': resolve(__dirname, './src/app'),
      '@components': resolve(__dirname, './src/components'),
      '@context': resolve(__dirname, './src/context'),
      '@pages': resolve(__dirname, './src/pages'),
      '@styles': resolve(__dirname, './src/styles'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@lib': resolve(__dirname, './src/lib'),

    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: { port: 5173 }
});