import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Le dossier de la ressource porte un nom variable selon les installations :
// 'agent_phone' une fois deployee, mais pas forcement dans un depot de travail.
// Les tests de contrat lisent les sources Lua sur disque ; un nom code en dur
// les faisait tous echouer d'un coup sur une arborescence renommee.
const RESOURCE_CANDIDATES = ['agent_phone', 'Phone', 'sky_phone']

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export const RESOURCE_ROOT = ((): string => {
  for (const name of RESOURCE_CANDIDATES) {
    const candidate = resolve(frontendRoot, '..', name)
    if (existsSync(join(candidate, 'fxmanifest.lua'))) return candidate
  }
  throw new Error(
    'Dossier de ressource introuvable a cote de frontend/. Cherche : ' +
      RESOURCE_CANDIDATES.join(', '),
  )
})()

/**
 * Chemin absolu d'un fichier de la ressource, sous forme d'URL file://
 * directement utilisable par readFileSync et readdirSync.
 */
export function resourceUrl(relativePath: string): URL {
  return pathToFileURL(join(RESOURCE_ROOT, relativePath))
}
