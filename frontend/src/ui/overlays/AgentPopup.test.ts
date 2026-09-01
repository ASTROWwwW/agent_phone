import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentPopup from './AgentPopup.vue'

async function renderPopup(
  props: InstanceType<typeof AgentPopup>['$props'],
): Promise<string> {
  return renderToString(
    createSSRApp({
      render: () => h(AgentPopup, props, () => 'Popup content'),
    }),
  )
}

describe('AgentPopup', () => {
  it('renders the complete modal contract', async () => {
    const html = await renderPopup({ ariaLabel: 'Popup', opened: true })

    expect(html).toContain('class="agent-popup agent-popup--modal"')
    expect(html).toContain('class="agent-overlay-backdrop agent-popup__backdrop"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('<section')
    expect(html).toContain('class="agent-popup__panel"')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-label="Popup"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('tabindex="-1"')
    expect(html).toContain('Popup content')
  })

  it('omits closed popups and optional backdrops', async () => {
    expect(await renderPopup({ opened: false })).not.toContain('agent-popup')

    const html = await renderPopup({ backdrop: false, opened: true })
    expect(html).not.toContain('agent-popup__backdrop')
    expect(html).toContain('Popup content')
  })

  it('matches the Konsta iOS surface, geometry, backdrop, and motion', () => {
    const overlays = readFileSync(
      new URL('../overlays.css', import.meta.url),
      'utf8',
    )
    const source = readFileSync(
      new URL('./AgentPopup.vue', import.meta.url),
      'utf8',
    )
    const tokens = readFileSync(
      new URL('../tokens.css', import.meta.url),
      'utf8',
    )
    const transitionRule = overlays.match(
      /\.agent-popup-rise-enter-active \.agent-popup__panel,[\s\S]*?\.agent-popup-rise-leave-active \.agent-popup__panel\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations

    expect(transitionRule).toBeDefined()
    expect(transitionRule).toContain(
      'transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);',
    )
    expect(transitionRule).not.toContain('opacity')
    expect(overlays).toMatch(
      /\.agent-popup-rise-enter-from \.agent-popup__panel,[\s\S]*?transform:\s*translateY\(100%\);/,
    )
    expect(overlays).toMatch(
      /\.agent-popup__backdrop\s*\{[^}]*background:\s*rgba\(0, 0, 0, 0\.5\);/,
    )
    expect(overlays).toMatch(
      /\.agent-popup__panel\s*\{[^}]*background:\s*var\(--agent-popup-background, var\(--agent-surface\)\);/,
    )
    expect(overlays).toMatch(
      /\.agent-popup__panel\s*\{[^}]*inset:\s*0;[^}]*overflow:\s*hidden;[^}]*box-shadow:\s*none;/,
    )
    expect(source).not.toContain(':duration=')
    expect(tokens).toContain('--agent-popup-background: #ffffff;')
    expect(tokens).toContain('--agent-popup-background: #000000;')
  })
})
