import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./SidePanelsDemo.vue', import.meta.url),
  'utf8',
)

describe('SidePanelsDemo Konsta parity', () => {
  it('keeps all four reference panel variants', () => {
    expect(source).toContain("id: 'left', side: 'left'")
    expect(source).toContain("id: 'right', side: 'right'")
    expect(source).toContain("id: 'leftFloating', side: 'left'")
    expect(source).toContain("id: 'rightFloating', side: 'right'")
  })

  it('carries the selected theme and accent into every nested panel page', () => {
    expect(source).toContain('<AgentAppPage')
    expect(source).toContain('component="div"')
    expect(source).toContain(':dark="demo.dark.value"')
    expect(source).toContain(':accent="demo.accent.value"')
    expect(source).toContain(':accent-soft="demo.accentSoft.value"')
    expect(source).toContain(':label="panel.title"')
  })

  it('uses the exact iOS close icon, floating transparency, and 16px rhythm', () => {
    expect(source).toContain(
      "import Xmark from 'framework7-icons/vue/vue/Xmark.vue'",
    )
    expect(source).toContain('<AgentIcon :size="20"><Xmark /></AgentIcon>')
    expect(source).toContain('--agent-safe-area-top: 0px;')
    expect(source).toContain('--agent-safe-area-bottom: 0px;')
    expect(source).toMatch(
      /\.agent-ui-demo-panel-page--floating :deep\(\.agent-app-page__backdrop\)[\s\S]*?background:\s*transparent;/,
    )
    expect(source.match(/gap:\s*var\(--agent-space-4\);/g)).toHaveLength(2)
  })
})
