import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    assetsDir: 'assets',
    cssMinify: 'lightningcss',
    cssTarget: 'chrome103',
    emptyOutDir: true,
    outDir: 'dist',
    target: 'chrome103',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/agent-[name]-[hash].[ext]',
        chunkFileNames: 'assets/agent-[name]-[hash].js',
        entryFileNames: 'assets/agent-[name]-[hash].js',
      },
    },
  },
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    fs: {
      allow: [fileURLToPath(new URL('.', import.meta.url))],
      strict: false,
    },
    host: '127.0.0.1',
  },
})
