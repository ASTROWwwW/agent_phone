import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const resourceRoot = fileURLToPath(new URL('../../Phone/', import.meta.url))

function luaFiles(directory: string): string[] {
  const found: string[] = []

  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry)
    if (statSync(full).isDirectory()) {
      found.push(...luaFiles(full))
      continue
    }
    if (entry.endsWith('.lua')) found.push(full)
  }

  return found
}

const sources = luaFiles(resourceRoot)

function hasLuac(): boolean {
  try {
    execFileSync('luac', ['-v'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

describe('Lua sources', () => {
  it('ships a non-trivial amount of Lua', () => {
    expect(sources.length).toBeGreaterThan(50)
  })

  it('never calls a local before it is declared', () => {
    // Lua resout alors le nom en variable globale nil : la syntaxe passe, et
    // l'appel echoue au premier declenchement. Aucun compilateur ne le signale,
    // et l'erreur ne se voit qu'en jeu.
    const offenders: string[] = []

    for (const file of sources) {
      const lines = readFileSync(file, 'utf8').replace(/\r\n?/g, '\n').split('\n')
      const declaredAt = new Map<string, number>()

      lines.forEach((line, index) => {
        const declaration =
          line.match(/^\s*local function ([A-Za-z_]\w*)/) ?? line.match(/^\s*local ([A-Za-z_]\w*)\s*=/)
        if (declaration && !declaredAt.has(declaration[1])) declaredAt.set(declaration[1], index)
      })

      for (const [name, declaration] of declaredAt) {
        const call = new RegExp('(?<![\\w.:])' + name + '\\s*\\(')

        for (let index = 0; index < declaration; index += 1) {
          if (/^\s*--/.test(lines[index])) continue
          if (call.test(lines[index])) {
            offenders.push(
              file.slice(resourceRoot.length) + ':' + (index + 1) + ' uses ' + name + ' declared line ' + (declaration + 1),
            )
            break
          }
        }
      }
    }

    expect(offenders).toEqual([])
  })

  it('compiles every file when luac is available', () => {
    // luac rejette la syntaxe propre a CfxLua, comme les hash entre accents
    // graves ; la ressource n'en utilise aucun, le compilateur reste donc un
    // juge valable ici. Absent de la machine, le test se contente de le dire.
    if (!hasLuac()) {
      expect(sources.length).toBeGreaterThan(0)
      return
    }

    const broken: string[] = []

    for (const file of sources) {
      try {
        execFileSync('luac', ['-p', file], { stdio: 'pipe' })
      } catch (error) {
        const detail = error instanceof Error && 'stderr' in error ? String((error as { stderr?: Buffer }).stderr) : ''
        broken.push(file.slice(resourceRoot.length) + ' : ' + detail.trim().split('\n')[0])
      }
    }

    expect(broken).toEqual([])
  })

  it('boots its configuration and locales when lua is available', () => {
    // luac ne verifie que la syntaxe. Charger reellement la configuration et
    // les locales, avec des bouchons pour le moteur, revele ce qui echouerait
    // au demarrage de la ressource : une valeur manquante, une locale absente,
    // une erreur d execution dans un fichier pourtant bien forme.
    try {
      execFileSync('lua', ['-v'], { stdio: 'ignore' })
    } catch {
      expect(sources.length).toBeGreaterThan(0)
      return
    }

    const harness = fileURLToPath(new URL('../testserver/resourceBoot.lua', import.meta.url))
    const posixRoot = resourceRoot.split(String.fromCharCode(92)).join('/')
    const output = execFileSync('lua', [harness, posixRoot], { encoding: 'utf8' })

    expect(output).toContain('locale configuree presente')
    expect(output).not.toContain('ECHEC')
    expect(output).not.toContain('MANQUE')
  })
})
