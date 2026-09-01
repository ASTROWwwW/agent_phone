import { readFileSync } from 'node:fs'

import { resourceUrl } from './testing/resource'

import { describe, expect, it } from 'vitest'

function source(path: string | URL): string {
  return readFileSync(
    typeof path === 'string' ? new URL(path, import.meta.url) : path,
    'utf8',
  )
}

const config = source(resourceUrl('config/config.lua'))
const configDefault = source(resourceUrl('source/shared/config_default.lua'))
const framework = source(resourceUrl('source/bridge/server/framework.lua'))
const esx = source(resourceUrl('source/bridge/server/framework.lua'))
const configurator = source(
  resourceUrl('source/server/phone_configurator.lua'),
)
const configuratorFixture = source('../testserver/configurator-fixture.cjs')

describe('fixed server permissions', () => {
  it('defines every protected phone capability only in config.lua', () => {
    expect(config).toContain('Config.CommandPermissions = {')
    for (const permission of [
      'phonepanel',
      'phonetestdata',
      'fliptokverify',
      'picstagramverify',
      'picstagramadmin',
    ]) {
      expect(config).toMatch(new RegExp(`\\s${permission} = \\{`))
    }
    expect(config).not.toContain('AdminGroups =')
    expect(configDefault).not.toContain('Config.PhoneConfigurator')
    expect(configDefault).not.toContain('Config.CommandPermissions')
    expect(configDefault).not.toContain('AdminGroups =')
  })

  it('keeps fixed permissions outside SQL and removes legacy group fields', () => {
    expect(configurator).toContain('key ~= "CommandPermissions"')
    expect(configurator).toContain('if key ~= "CommandPermissions" and key ~= "Server" then')
    expect(configuratorFixture).toContain('delete config.CommandPermissions')
    for (const path of [
      'AdminPanel.AdminGroups',
      'TestData.AdminGroups',
      'FlipTok.AdminGroups',
      'Picstagram.AdminGroups',
    ]) {
      expect(configurator).toContain(`["${path}"] = true`)
    }
    expect(configurator).toContain(
      'AGENT PHONE CONFIGURATION FILES ARE DISABLED',
    )
    expect(configurator).toContain(
      '^1 Runtime settings from config.lua and media.lua are DISABLED.^0',
    )
    expect(configurator).toContain(
      '^1 Configure all phone and media settings IN GAME through /phonepanel.^0',
    )
    expect(configurator).toContain(
      '^1 Only Config.PhoneConfigurator.Enabled and Config.CommandPermissions remain file-based.^0',
    )
  })

  it('resolves permissions through the configured ESX groups only', () => {
    expect(framework).toContain(
      'local groups = Config.CommandPermissions[permission]',
    )
    expect(framework).toContain(
      'return Bridge.Framework.HasAdminGroup(source, groups)',
    )
    expect(esx).toContain('local player_group = player.getGroup()')
    expect(esx).toContain('if player_group == group then')
  })

  it('uses stable permission identifiers for every protected operation', () => {
    const expectations = [
      [resourceUrl('source/server/admin.lua'), 'phonepanel'],
      [resourceUrl('source/server/testdata.lua'), 'phonetestdata'],
      [resourceUrl('source/server/fliptok.lua'), 'fliptokverify'],
      [resourceUrl('source/server/picstagram.lua'), 'picstagramverify'],
      [resourceUrl('source/server/picstagram.lua'), 'picstagramadmin'],
    ] as const

    for (const [path, permission] of expectations) {
      expect(source(path)).toContain(
        `Bridge.Framework.HasPermission(source, "${permission}")`,
      )
    }
  })
})
