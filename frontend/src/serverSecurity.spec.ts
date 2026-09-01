import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const serverRoot = fileURLToPath(new URL('../../Phone/source/server/', import.meta.url))
const configRoot = fileURLToPath(new URL('../../Phone/config/', import.meta.url))

function read(directory: string, name: string): string {
  return readFileSync(directory + name, 'utf8').replace(/\r\n?/g, '\n')
}

const serverFiles = readdirSync(serverRoot)
  .filter((name) => name.endsWith('.lua'))
  .map((name) => ({ name, source: read(serverRoot, name) }))

const config = read(configRoot, 'config.lua')
const security = read(serverRoot, 'phone_security.lua')
const banking = read(serverRoot, 'banking.lua')

describe('server security invariants', () => {
  it('never interpolates a client value into a query', () => {
    // Assembler une clause a partir de fragments litteraux est sans danger et
    // le depot le fait sciemment : agentride compose un WHERE choisi parmi
    // quatre blocs constants, companies ajoute une condition selon un booleen.
    // Ce qui doit rester impossible, c'est qu'une valeur issue du payload
    // client entre dans le texte de la requete au lieu d'un parametre lie.
    const offenders: string[] = []
    const clientValue = /\.\.[^\n]*\b(?:data\b|payload\b|request\b)[.[]/

    for (const { name, source } of serverFiles) {
      const lines = source.split('\n')
      let depth = 0

      lines.forEach((line, index) => {
        if (/Bridge\.Database\.(?:Query|Execute|Insert)\(/.test(line)) depth = 12
        if (depth > 0) {
          if (clientValue.test(line) || /\bstring\.format\([^)]*(?:SELECT|INSERT|UPDATE|DELETE)/i.test(line)) {
            offenders.push(`${name}:${index + 1}: ${line.trim().slice(0, 60)}`)
          }
          depth -= 1
        }
      })
    }

    expect(offenders).toEqual([])
  })

  it('rate-limits passcode unlock and counts failures for every path', () => {
    expect(security).toMatch(
      /agent_phone:security:unlock[\s\S]{0,200}?AgentPhone\.AllowOperation\(\s*source,\s*"security_unlock"/,
    )

    // change et disable verifient le meme secret : ils doivent passer par
    // verify_passcode, qui persiste failed_attempts et locked_until par IMEI.
    // Sans cela ils deviendraient un oracle de force brute contournant la
    // limite posee sur unlock.
    for (const callback of ['change-passcode', 'disable-passcode']) {
      const block = security.slice(security.indexOf(`agent_phone:security:${callback}`))
      const body = block.slice(0, block.indexOf('\nend)'))
      expect(body, `${callback} must verify through verify_passcode`).toContain(
        'verify_passcode(',
      )
    }

    expect(security).toMatch(/failed_attempts`?\s*=\s*\?|`failed_attempts`/)
    expect(security).toContain('locked_until')
  })

  it('hashes passcodes with a per-device salt and a server pepper', () => {
    expect(security).toMatch(/SHA2\(CONCAT\(\?,\s*\?,\s*\?\),\s*256\)/)
    expect(security).toContain('passcode_pepper')
    expect(security).toContain('passcode_salt')
    expect(security).not.toMatch(/SHA2\(\s*\?\s*,\s*256\)/)
  })

  it('accepts only whole, bounded transfer amounts', () => {
    expect(banking).toMatch(/amount\s*~=\s*math\.floor\(amount\)/)
    expect(banking).toMatch(/amount\s*<\s*Config\.Banking\.MinimumAmount/)
    expect(banking).toMatch(/amount\s*>\s*Config\.Banking\.MaximumAmount/)

    const minimum = config.match(/MinimumAmount\s*=\s*(-?\d+)/)
    expect(minimum, 'Config.Banking.MinimumAmount is missing').not.toBeNull()
    expect(
      Number(minimum![1]),
      'a minimum below 1 would let a negative or zero transfer through',
    ).toBeGreaterThanOrEqual(1)
  })

  it('refunds the sender when crediting the target fails', () => {
    const transfer = banking.slice(banking.indexOf('agent_phone:banking:transfer'))
    const body = transfer.slice(0, transfer.indexOf('\nend)'))
    const credit = body.indexOf('AddMoney(target')
    const refund = body.indexOf('AddMoney(source')

    expect(credit, 'the transfer must credit the target').toBeGreaterThan(-1)
    expect(refund, 'the transfer must refund the sender on failure').toBeGreaterThan(credit)
  })

  it('derives the acting identity from source, never from the payload', () => {
    const offenders: string[] = []

    for (const { name, source } of serverFiles) {
      // Un identifiant de joueur fourni par le client ne doit jamais servir a
      // designer l'auteur de l'action.
      const assignments = source.matchAll(
        /local\s+identifier\s*=\s*(?:trim\()?\s*data\s*(?:and\s*data)?\.(identifier|citizenid|owner)/g,
      )

      for (const [match] of assignments) {
        const line = source.slice(0, source.indexOf(match)).split('\n').length
        offenders.push(`${name}:${line}`)
      }
    }

    // darkchat lit un Dark-ID de destination, pas l'identite de l'appelant :
    // le profil de l'auteur y vient de require_profile(source).
    expect(offenders.filter((entry) => !entry.startsWith('darkchat.lua'))).toEqual([])
  })
})
