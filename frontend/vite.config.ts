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
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          // Les 220 icones distinctes finissaient dans le fragment d'entree,
          // que le CEF doit analyser avant le premier rendu. Isolees, elles
          // sont analysees en parallele des applications chargees a la demande.
          if (id.includes('lucide-vue-next')) return 'icons'
          if (id.includes('dompurify')) return 'purify'
          if (
            id.includes('/vue/') ||
            id.includes('/vue-router/') ||
            id.includes('/pinia/') ||
            id.includes('@vue/')
          ) {
            return 'vue'
          }
          // Le reste revient a Rollup : un fourre-tout vendor rassemblerait les
          // dependances propres a une application dans un fragment charge des
          // le demarrage, ce qui annulerait le chargement a la demande.
          return undefined
        },
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
