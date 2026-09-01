import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RESOURCE_CANDIDATES = ['agent_phone', 'Phone', 'agent_phone']

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

export function resourceUrl(relativePath: string): URL {
  return pathToFileURL(join(RESOURCE_ROOT, relativePath))
}