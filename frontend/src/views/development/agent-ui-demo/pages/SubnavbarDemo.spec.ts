import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./SubnavbarDemo.vue', import.meta.url),
  'utf8',
)

describe('SubnavbarDemo', () => {
  it('scrolls content beneath the Konsta navbar gradient', () => {
    expect(source).toContain(
      '<AgentUiDemoPage class="subnavbar-demo" title="Subnavbar">',
    )
    expect(source).toMatch(
      /\.subnavbar-demo :deep\(\.agent-navbar\)\s*\{[^}]*position:\s*absolute;[^}]*top:\s*0;[^}]*right:\s*0;[^}]*left:\s*0;/s,
    )
    expect(source).toMatch(
      /\.subnavbar-demo :deep\(\.agent-navbar__inner\)\s*\{[^}]*margin-bottom:\s*0;/s,
    )
    expect(source).toMatch(
      /\.subnavbar-demo :deep\(\.agent-ui-demo-page__scroll::before\)\s*\{[^}]*height:\s*calc\([\s\S]*max\(16px, var\(--agent-safe-area-top\)\)[\s\S]*var\(--agent-navbar-height\)[\s\S]*56px[\s\S]*\);/,
    )
  })
})
