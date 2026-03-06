import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/webview',
  build: {
    emptyOutDir: true,
    outDir: '../../media/webview',
  },
});
