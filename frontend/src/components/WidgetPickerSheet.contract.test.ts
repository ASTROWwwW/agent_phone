import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./WidgetPickerSheet.vue', import.meta.url),
  'utf8',
)

describe('WidgetPickerSheet Agent UI contract', () => {
  it('uses only first-party Agent UI primitives for the picker surface', () => {
    expect(source).not.toContain("from 'konsta/vue'")
    expect(source).not.toMatch(/<\/?k-[a-z]/)
    expect(source).toContain('<AgentProvider')
    expect(source).toContain('<AgentSheet')
    expect(source).toContain('<AgentSearchbar')
    expect(source).toContain('<AgentList')
    expect(source).toContain('<AgentListItem')
    expect(source).toContain('<AgentEmptyState')
    expect(source).toContain('<AgentButton')
  })

  it('keeps the modal inside the phone-owned springboard geometry', () => {
    expect(source).not.toContain('<Teleport')
    expect(source).toMatch(
      /\.widget-picker-provider\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*pointer-events:\s*none;/s,
    )
    expect(source).toMatch(
      /\.widget-picker-sheet\s+:deep\(\.agent-sheet__panel\)\s*\{[^}]*height:\s*calc\(100%\s*-\s*var\(--agent-space-3\)\);[^}]*max-height:\s*calc\(100%\s*-\s*var\(--agent-space-3\)\);[^}]*overflow:\s*hidden;/s,
    )
  })

  it('uses the iOS gallery, preview, size, and add sequence', () => {
    expect(source).toContain("ref<'gallery' | 'preview'>('gallery')")
    expect(source).toContain("pickerView.value = 'preview'")
    expect(source).toContain("pickerView.value = 'gallery'")
    expect(source).toContain('selectedDefinition.supportedSizes')
    expect(source).toContain('startPreviewSwipe')
    expect(source).toContain('widget-picker-size-dots')
    expect(source).toContain("phone.t('Home.widgetSystem.addWidget')")
  })

  it('has one explicit vertical scroll owner', () => {
    expect(source.match(/<AgentScrollArea/g)).toHaveLength(1)
    expect(source).toMatch(
      /\.widget-picker-scroll\s*\{[^}]*overflow-y:\s*auto;/s,
    )
  })
})
