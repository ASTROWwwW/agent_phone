import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./ChipsDemo.vue', import.meta.url), 'utf8')

describe('ChipsDemo', () => {
  it('uses Konsta half-space chip rhythm instead of the generic demo gap', () => {
    expect(source).toContain('class="chips-demo__group"')
    expect(source).not.toContain('class="agent-ui-demo-row"')
    expect(source).toMatch(
      /\.chips-demo__group :deep\(\.agent-chip\)\s*\{[^}]*margin:\s*2px/s,
    )
  })

  it('keeps contact, delete, fill, and outline examples', () => {
    expect(source).toContain('<AgentBlockTitle>Contact Chips</AgentBlockTitle>')
    expect(source).toContain(
      '<AgentBlockTitle>Deletable Chips / Tags</AgentBlockTitle>',
    )
    expect(source).toContain('<AgentBlockTitle>Color Chips</AgentBlockTitle>')
    expect(source).toContain('delete-button')
    expect(source).toContain('outline')
    expect(source).toContain('selected')
  })

  it('uses the exact Tailwind 500 colors from the Konsta kitchen sink', () => {
    expect(source).toContain('--agent-app-accent: #fb2c36;')
    expect(source).toContain('--agent-app-accent: #00c951;')
    expect(source).toContain('--agent-app-accent: #2b7fff;')
    expect(source).toContain('--agent-app-accent: #f0b100;')
    expect(source).toContain('--agent-app-accent: #f6339a;')
  })
})
