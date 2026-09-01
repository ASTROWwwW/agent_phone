import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./MessageContactBubble.vue', import.meta.url),
  'utf8',
)

describe('MessageContactBubble Agent UI contract', () => {
  it('uses Agent buttons without direct Konsta markup', () => {
    expect(source).not.toContain("from 'konsta/vue'")
    expect(source).not.toMatch(/<\/?k-[a-z]/)
    expect(source).toContain('<AgentButton')
  })

  it('inherits light and dark colors from Agent theme tokens', () => {
    expect(source).toContain('var(--agent-text)')
    expect(source).toContain('var(--agent-surface)')
    expect(source).toContain('var(--agent-surface-muted)')
    expect(source).toContain('var(--agent-muted)')
    expect(source).toContain('var(--agent-hairline)')
    expect(source).not.toContain(':global(.phone-app.dark)')
  })
})
