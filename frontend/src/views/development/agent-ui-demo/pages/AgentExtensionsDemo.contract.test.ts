import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./AgentExtensionsDemo.vue', import.meta.url),
  'utf8',
)
const demoPageSource = readFileSync(
  new URL('../AgentUiDemoPage.vue', import.meta.url),
  'utf8',
)

describe('AgentExtensionsDemo', () => {
  it('opts into the shared padded scroll contract without changing Konsta demos', () => {
    expect(demoPageSource).toContain('padded?: boolean')
    expect(demoPageSource).toContain('padded: false')
    expect(demoPageSource).toContain(':padded="padded"')
    expect(source).toContain('<AgentUiDemoPage padded title="Agent Extensions">')
  })

  it('keeps extension cards and states inside one coherent inset layout', () => {
    expect(source).toContain('class="agent-ui-demo-extension-empty"')
    expect(source).toMatch(/<AgentEmptyState[\s\S]*?\scompact[\s\S]*?>/)
    expect(source).toMatch(
      /\.agent-ui-demo-extension-status,\s*\.agent-ui-demo-extension-card,\s*\.agent-ui-demo-extension-empty\s*\{\s*margin:\s*0;/,
    )
    expect(source.match(/\sinline\s/g)).toHaveLength(3)
    expect(source.match(/:aria-pressed="loaderState ===/g)).toHaveLength(3)
    expect(source).toContain(':has-more="loaderState !== \'ready\'"')
    expect(source).toMatch(
      /\.agent-ui-demo-extension-state-actions\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-wrap:\s*wrap;/,
    )
  })

  it('presents nested themes, widgets, and interactive Glass as bounded specimens', () => {
    expect(source).toMatch(
      /\.agent-ui-demo-extension-app\s*\{[\s\S]*?border:\s*1px solid var\(--agent-hairline\);[\s\S]*?border-radius:\s*var\(--agent-radius-card\);/,
    )
    expect(source).toMatch(
      /\.agent-ui-demo-extension-widgets\s*\{[\s\S]*?--agent-widget-label-color:\s*var\(--agent-text\);[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/,
    )
    expect(source).toMatch(
      /\.agent-ui-demo-extension-widgets > :nth-child\(3\)\s*\{[\s\S]*?grid-column:\s*1 \/ -1;/,
    )
    expect(source).toMatch(
      /\.agent-ui-demo-extension-widget\s*\{[\s\S]*?height:\s*100%;[\s\S]*?min-height:\s*0;/,
    )
    expect(source).toMatch(
      /\.agent-ui-demo-extension-glass\s*\{[\s\S]*?width:\s*100%;[\s\S]*?border-radius:\s*var\(--agent-radius-pill\);/,
    )
    expect(source).toMatch(
      /\.agent-ui-demo-extension-glass:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--agent-app-accent\);/,
    )
  })

  it('uses icon-and-label full navigation and compact text-only variants', () => {
    expect(source).toContain("{ icon: LayoutGrid, label: 'Apps' }")
    expect(source).toContain("{ icon: Gamepad2, label: 'Games' }")
    expect(source).toContain("{ icon: Search, label: 'Search' }")
    expect(source).toContain('class="agent-ui-demo-extension-navigation-item"')
    expect(source.match(/\scompact\s/g)).toHaveLength(4)
    expect(source).toContain(':strong="splitTab < 2"')
    expect(source).toContain(':strong="splitTab === 2"')
  })
})
