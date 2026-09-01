import { existsSync, readFileSync } from 'node:fs'
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
const sim = read('source/server/sim.lua')
const oxInventory = read('source/bridge/server/inventory.lua')
const esx = read('source/bridge/server/framework.lua')
const phoneServer = read('source/server/phone.lua')

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

  it('keeps no adapter layer at all', () => {
    for (const directory of [
      'source/bridge/server/frameworks',
      'source/bridge/server/inventory',
    ]) {
      expect(
        existsSync(resourceRoot + directory),
        directory + ' must not exist: one base needs no adapter dispatch',
      ).toBe(false)
    }
  })

  it('carries both bridges inline, with no dispatch guard', () => {
    expect(inventory).toContain('exports.ox_inventory')
    expect(inventory).not.toMatch(/Bridge\.Inventory\.Name ~= /)
    expect(inventory).not.toMatch(/\bqbox\b/)
    expect(esx).not.toMatch(/Bridge\.Framework\.Name ~= /)
  })

  it('reads vehicles from the Agent schema only', () => {
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
    const markers = garage.match(/local IMPOUND_GARAGES = \{([^}]*)\}/)
    expect(markers, 'IMPOUND_GARAGES is missing').not.toBeNull()
    expect(markers![1]).toContain('"fourriere"')
  })

  it('pays from an account the base declares', () => {
    const accounts = new Set(['bank', 'black_money', 'money'])
    const used = [...config.matchAll(/(?:PaymentAccount|Account)\s*=\s*"([a-z_]+)"/g)]
      .map(([, name]) => name)

    expect(used.length).toBeGreaterThan(0)
    expect(used.filter((name) => !accounts.has(name))).toEqual([])
  })
  it('warns when a required inventory item is missing', () => {
    expect(oxInventory).toContain('function Bridge.Inventory.ItemExists(item_name)')
    expect(sim).toContain('Config.Sim.RegisteredItem')
    expect(sim).toContain('Config.Sim.AnonymousItem')
    expect(sim).toContain(String.fromCharCode(77) + 'issing %s item')
  })

  it('exposes the second job the base carries', () => {
    expect(esx).toContain('function Bridge.Framework.GetJob2(source)')
    expect(garage).toContain('Bridge.Framework.GetJob2')
  })

  it('lists service vehicles, not only personal ones', () => {
    expect(garage).toContain('local function ownership_clause(source, identifier)')
    expect(garage).toMatch(/"job:" .. job.name/)
    expect(garage).toContain('ownership = ownership_scope')
  })
  it('ships only companies whose job exists on the server', () => {
    const jobs = [...config.matchAll(/Job = "([a-z_0-9]+)"/g)].map(([, name]) => name)

    expect(jobs.sort()).toEqual(['ambulance', 'mechanic', 'police', 'taxi'])
  })
  it('sends the character identity and job to the interface', () => {
    expect(phoneServer).toContain('local function player_identity(source)')
    expect(phoneServer).toContain('player = player_identity(source)')
    expect(phoneServer).toContain('Bridge.Framework.GetJob(source)')
  })
  it('delegates admin rights to the base instead of naming foreign groups', () => {
    // La base declare fondateur, responsable, resp_illegal, resp_legal, admin,
    // moderateur et helper. Le telephone attendait god, superadmin et admin :
    // seul admin existait des deux cotes, tout le reste de l encadrement se
    // voyait refuser le panneau. L etoile delegue au statut que la base calcule.
    expect(config).not.toMatch(/"(god|superadmin)"/)
    expect(esx).toContain('if group == "*" then')
    expect(esx).toContain('player.admin == true')
    expect(esx).toContain('function Bridge.Framework.IsAdmin(source)')
  })
})
