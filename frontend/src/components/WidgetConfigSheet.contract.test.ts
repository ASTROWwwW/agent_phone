import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const configSource = readFileSync(
  new URL('./WidgetConfigSheet.vue', import.meta.url),
  'utf8',
)
const pickerSource = readFileSync(
  new URL('./WidgetPickerSheet.vue', import.meta.url),
  'utf8',
)
const widgetSource = readFileSync(
  new URL('./SpringboardWidget.vue', import.meta.url),
  'utf8',
)

describe('WidgetConfigSheet Agent UI contract', () => {
  it('uses first-party Agent UI controls for the configuration surface', () => {
    expect(configSource).not.toContain("from 'konsta/vue'")
    expect(configSource).not.toMatch(/<\/?k-[a-z]/)
    expect(configSource).toContain('<AgentProvider')
    expect(configSource).toContain('<AgentSheet')
    expect(configSource).toContain('<AgentScrollArea')
    expect(configSource).toContain('<AgentSegmented')
    expect(configSource).toContain('<AgentSettingsGroup')
    expect(configSource).toContain('<AgentSettingsRow')
  })

  it('keeps the sheet inside the phone-owned springboard geometry', () => {
    expect(configSource).not.toContain('<Teleport')
    expect(configSource).toMatch(
      /\.widget-config-provider\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*pointer-events:\s*none;/s,
    )
    expect(configSource).toMatch(
      /\.widget-config-sheet\s+:deep\(\.agent-sheet__panel\)\s*\{[^}]*height:\s*calc\(100%\s*-\s*var\(--agent-space-3\)\);[^}]*max-height:\s*calc\(100%\s*-\s*var\(--agent-space-3\)\);[^}]*overflow:\s*hidden;/s,
    )
  })

  it('has one scroll owner and preserves all configurable values', () => {
    expect(configSource.match(/<AgentScrollArea/g)).toHaveLength(1)
    expect(configSource).toContain('balanceSource: balanceSource.value')
    expect(configSource).toContain('contactIds: contactIds.value')
    expect(configSource).toContain('showDate: showDate.value')
    expect(configSource).toContain('supportedSizes')
  })

  it('lets the widget component own preview geometry for every size', () => {
    expect(configSource).not.toContain(':deep(.home-widget-shell--preview)')
    expect(pickerSource).not.toContain(':deep(.home-widget-shell--preview)')
    expect(widgetSource).toMatch(
      /\.home-widget-shell--preview\.home-widget-shell--small\s*\{[^}]*max-width:\s*150px;[^}]*aspect-ratio:\s*1;/s,
    )
  })
})
