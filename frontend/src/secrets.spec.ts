import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const resourceRoot = fileURLToPath(new URL('../../Phone/', import.meta.url))

function read(relativePath: string): string {
  return readFileSync(resourceRoot + relativePath, 'utf8').replace(/\r\n?/g, '\n')
}

const config = read('config/config.lua')
const configDefault = read('source/shared/config_default.lua')
const manifest = read('fxmanifest.lua')
const gitignore = read('.gitignore')
const configurator = read('source/server/phone_configurator.lua')

const PEPPER_KEYS = [
  'PasscodePepper',
  'FlipTokPasswordPepper',
  'PicstagramPasswordPepper',
]

describe('password pepper placement', () => {
  it('keeps every pepper empty in the client-downloaded configuration', () => {
    for (const key of PEPPER_KEYS) {
      const assignment = new RegExp(key + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')')

      for (const [name, source] of [
        ['config/config.lua', config],
        ['source/shared/config_default.lua', configDefault],
      ] as const) {
        const match = source.match(assignment)
        expect(match, `${name}: ${key} is missing`).not.toBeNull()
        expect(
          match![2] ?? match![3],
          `${name}: ${key} must stay empty. config.lua is declared in ` +
            'client_scripts, so it is downloaded into every player cache and ' +
            'readable as-is. IsDuplicityVersion() prevents the assignment on ' +
            'the client, not the distribution of the file. Real peppers belong ' +
            'in config/secrets.lua, which is server_scripts only and ignored.',
        ).toBe('')
      }
    }
  })

  it('loads secrets only from server_scripts', () => {
    const serverBlock = manifest.slice(
      manifest.indexOf('server_scripts'),
      manifest.indexOf('}', manifest.indexOf('server_scripts')),
    )
    const clientBlock = manifest.slice(
      manifest.indexOf('client_scripts'),
      manifest.indexOf('}', manifest.indexOf('client_scripts')),
    )
    const sharedBlock = manifest.slice(
      manifest.indexOf('shared_scripts'),
      manifest.indexOf('}', manifest.indexOf('shared_scripts')),
    )

    expect(serverBlock).toContain('config/secrets.lua')
    expect(clientBlock).not.toContain('secrets')
    expect(sharedBlock).not.toContain('secrets')
  })

  it('never ships the secrets file itself', () => {
    expect(gitignore).toMatch(/^config\/secrets\.lua$/m)
    expect(existsSync(resourceRoot + 'config/secrets.example.lua')).toBe(true)
  })
  it('never lets the SQL configurator overwrite the server secrets', () => {
    // config.lua declare Config.Server avec des coquilles vides, que
    // config/secrets.lua remplit ensuite. L instantane stocke en base est pris
    // sur config.lua : le reappliquer effacait les peppers, et le serveur
    // signalait des empreintes sans secret cote production.
    expect(configurator).toMatch(/key ~= "CommandPermissions" and key ~= "Server"/)
  })
})
