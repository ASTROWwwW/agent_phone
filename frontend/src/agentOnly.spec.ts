import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const resourceRoot = fileURLToPath(new URL('../../Phone/', import.meta.url))

function read(relativePath: string): string {
  return readFileSync(resourceRoot + relativePath, 'utf8').replace(/\r\n?/g, '\n')
}

const serverFramework = read('source/bridge/server/framework.lua')
const clientFramework = read('source/bridge/client/framework.lua')
const inventory = read('source/bridge/server/inventory.lua')
const garage = read('source/server/garage.lua')
const config = read('config/config.lua')

describe('Agent is the only supported base', () => {
  it('targets the Agent resource on both sides', () => {
    for (const [side, source] of [
      ['server', serverFramework],
      ['client', clientFramework],
    ] as const) {
      expect(source, `${side}: the Agent resource name must be explicit`).toContain(
        'local FRAMEWORK_RESOURCE = "Agent"',
      )
      expect(source, `${side}: es_extended is another base`).not.toContain('es_extended')
    }
  })

  it('ships a single framework adapter', () => {
    const adapters = readdirSync(resourceRoot + 'source/bridge/server/frameworks/')
      .filter((name) => name.endsWith('.lua'))

    expect(adapters).toHaveLength(1)
  })

  it('ships a single inventory adapter with no foreign alias', () => {
    const adapters = readdirSync(resourceRoot + 'source/bridge/server/inventory/')
      .filter((name) => name.endsWith('.lua'))

    expect(adapters).toEqual(['ox.lua'])
    // qbox designait un framework que la base ne connait plus.
    expect(inventory).not.toMatch(/\bqbox\b/)
  })

  it('reads vehicles from the Agent schema only', () => {
    // Vingt et un systemes de propriete etaient reconnus pour deux schemas
    // reels. Agent stocke comme ESX : owned_vehicles, colonne owner.
    const systems = garage.match(/local supported_systems = \{([\s\S]*?)\}/)
    expect(systems, 'supported_systems is missing').not.toBeNull()

    const declared = [...systems![1].matchAll(/([\w-]+)\s*=\s*true/g)].map(([, name]) => name)
    expect(declared.sort()).toEqual(['agent', 'auto', 'custom'])

    expect(garage).toContain('return "owned_vehicles", "owner"')
    expect(garage, 'player_vehicles is the QB schema').not.toContain('player_vehicles')
    expect(garage, 'no third-party garage resource must be probed').not.toContain(
      'jg-advancedgarages',
    )
  })

  it('keeps no framework selector in the configuration', () => {
    expect(config).not.toMatch(/^\s*Framework\s*=/m)
  })

  it('reads only columns that owned_vehicles actually has', () => {
    // Releve dans Base/sql.sql de la base : la table ne porte que ces dix
    // colonnes. Le telephone en interrogeait vingt-cinq, heritees des systemes
    // de propriete tiers ; les absentes valaient nil en silence.
    const columns = new Set([
      'garage',
      'glovebox',
      'job',
      'job2',
      'owner',
      'plate',
      'stored',
      'trunk',
      'type',
      'vehicle',
    ])

    const read = new Set([...garage.matchAll(/\brow\.([a-z_]+)/g)].map(([, name]) => name))
    const missing = [...read].filter((name) => !columns.has(name)).sort()

    expect(missing).toEqual([])
  })

  it('recognises the impound yard the base actually writes', () => {
    // La fourriere n'a pas de colonne : le module de garage ecrit stored = 0 et
    // garage = 'fourriere_auto'. Chercher seulement "impound" ou "pound" ne
    // pouvait jamais aboutir, et le vehicule s'affichait comme etant dehors.
    const markers = garage.match(/local IMPOUND_GARAGES = \{([^}]*)\}/)
    expect(markers, 'IMPOUND_GARAGES is missing').not.toBeNull()
    expect(markers![1]).toContain('"fourriere"')
  })

  it('pays from an account the base declares', () => {
    // Config.Accounts de la base : bank, black_money, money. Aucun compte cash.
    const accounts = new Set(['bank', 'black_money', 'money'])
    const used = [...config.matchAll(/(?:PaymentAccount|Account)\s*=\s*"([a-z_]+)"/g)]
      .map(([, name]) => name)

    expect(used.length).toBeGreaterThan(0)
    expect(used.filter((name) => !accounts.has(name))).toEqual([])
  })
})
