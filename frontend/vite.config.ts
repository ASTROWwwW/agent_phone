import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// Les fragments portaient un prefixe et une empreinte : agent-CameraApp-B3rfK1ic.js.
// Ils sont desormais nommes d'apres leur seul contenu, en minuscules, le systeme
// de fichiers de Windows et le CEF ignorant la casse.
//
// Sans empreinte, deux fragments homonymes s'ecraseraient en silence et le
// paquet serait casse sans que rien ne le signale. Le registre ci-dessous
// interrompt la construction au premier doublon, avant que le fichier ne parte
// dans la ressource.
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
          // Rollup nomme le bloc script d'un composant partage
          // Foo.vue_vue_type_script_setup_true_lang : on ne garde que Foo.
          const base = chunk.name.replace(/\.vue_vue_type_.*$/, '')
          return 'assets/' + uniqueName(base.toLowerCase() + '.js', chunk.name)
        },
        // L'entree ne peut pas s'appeler index : le fragment du kit porte deja
        // ce nom une fois l'empreinte retiree. Elle passe par le meme registre
        // que les fragments, sans quoi une collision entre l'entree et un
        // fragment echapperait au controle.
        entryFileNames() {
          return 'assets/' + uniqueName('app.js', '<entree>')
        },
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
