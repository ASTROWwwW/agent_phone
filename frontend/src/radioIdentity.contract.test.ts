import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { resourceUrl } from './testing/resource'

const qbSource = readFileSync(
  resourceUrl('source/bridge/server/frameworks/qb.lua'),
  'utf8',
)
const qboxSource = readFileSync(
  resourceUrl('source/bridge/server/frameworks/qbox.lua'),
  'utf8',
)
const esxSource = readFileSync(
  resourceUrl('source/bridge/server/frameworks/esx.lua'),
  'utf8',
)
const radioSource = readFileSync(
  resourceUrl('source/server/radio.lua'),
  'utf8',
)

describe('radio member identity contract', () => {
  it('exposes a framework character-name pair for every adapter', () => {
    for (const source of [esxSource, qbSource, qboxSource]) {
      expect(source).toContain(
        'function Bridge.Framework.GetCharacterName(source)',
      )
    }
  })

  it('matches the installed lb-phone ESX database fallback', () => {
    expect(esxSource).toContain(
      'function Bridge.Framework.GetCharacterName(source)',
    )
    expect(esxSource).toContain(
      'SELECT `firstname`, `lastname` FROM `users` WHERE `identifier` = ? LIMIT 1',
    )
    expect(esxSource).toContain('{ identifier }')
  })

  it('prefers the radio override, then the framework identity', () => {
    const memberNameStart = radioSource.indexOf(
      'local function get_radio_member_name(source)',
    )
    const memberNameEnd = radioSource.indexOf(
      '\nend',
      radioSource.indexOf('GetPlayerName(source)', memberNameStart),
    )
    const memberNameSource = radioSource.slice(memberNameStart, memberNameEnd)

    expect(memberNameSource).toContain('get_effective_display_name(source)')
    expect(memberNameSource).toContain(
      'Bridge.Framework.GetCharacterName(source)',
    )
    expect(memberNameSource.indexOf('GetCharacterName(source)')).toBeLessThan(
      memberNameSource.indexOf('GetPlayerName(source)'),
    )
  })
})
