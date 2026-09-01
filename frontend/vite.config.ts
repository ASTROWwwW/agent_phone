import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const emittedNames = new Map<string, string>()

function uniqueName(name: string, source: string): string {
  const previous = emittedNames.get(name)

  if (previous !== undefined && previous !== source) {
    throw new Error(
      `Deux sorties reclament assets/${name} : ${previous} et ${source}. ` +
        'Sans empreinte dans le nom, la seconde ecraserait la premiere. ' +
        'Renommez le module ou donnez-lui un fragment nomme dans manualChunks.',
    )
  }

  emittedNames.set(name, source)
  return name
}

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
        assetFileNames(asset) {
          const source = asset.names?.[0] ?? asset.name ?? 'asset'
          const extension = source.includes('.') ? source.slice(source.lastIndexOf('.') + 1) : 'bin'
          const base = source.slice(0, source.length - extension.length - 1) || 'asset'
          return 'assets/' + uniqueName(base.toLowerCase() + '.' + extension.toLowerCase(), source)
        },
        chunkFileNames(chunk) {
          const base = chunk.name.replace(/\.vue_vue_type_.*$/, '')
          return 'assets/' + uniqueName(base.toLowerCase() + '.js', chunk.name)
        },
        entryFileNames() {
          return 'assets/' + uniqueName('app.js', '<entree>')
        },
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
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
