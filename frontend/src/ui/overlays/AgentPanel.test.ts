import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentPanel from './AgentPanel.vue'

async function renderPanel(
  props: InstanceType<typeof AgentPanel>['$props'],
): Promise<string> {
  return renderToString(
    createSSRApp({
      render: () => h(AgentPanel, props, () => 'Panel content'),
    }),
  )
}

describe('AgentPanel', () => {
  it('renders the complete modal and floating state contract', async () => {
    const html = await renderPanel({
      ariaLabel: 'Right panel',
      floating: true,
      opened: true,
      side: 'right',
    })

    expect(html).toContain(
      'class="agent-panel agent-panel--floating agent-panel--modal"',
    )
    expect(html).toContain('class="agent-overlay-backdrop agent-panel__backdrop"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('<aside')
    expect(html).toContain('agent-panel__panel--right')
    expect(html).toContain('agent-panel__panel--floating')
    expect(html).toContain('agent-glass-surface')
    expect(html).toContain('role="dialog"')
    expect(html).toContain('aria-label="Right panel"')
    expect(html).toContain('aria-modal="true"')
    expect(html).toContain('tabindex="-1"')
  })

  it('omits closed panels and optional backdrops', async () => {
    expect(await renderPanel({ opened: false })).not.toContain('agent-panel')

    const html = await renderPanel({ backdrop: false, opened: true })
    expect(html).not.toContain('agent-panel__backdrop')
    expect(html).toContain('Panel content')
  })

  it('matches the Konsta iOS surface, geometry, backdrop, and motion', () => {
    const overlays = readFileSync(
      new URL('../overlays.css', import.meta.url),
      'utf8',
    )
    const source = readFileSync(
      new URL('./AgentPanel.vue', import.meta.url),
      'utf8',
    )
    const tokens = readFileSync(
      new URL('../tokens.css', import.meta.url),
      'utf8',
    )
    const panelRule = overlays.match(
      /\n\.agent-panel__panel\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations

    expect(panelRule).toBeDefined()
    expect(panelRule).toMatch(/top:\s*0;[\s\S]*bottom:\s*0;/)
    expect(panelRule).toMatch(/width:\s*288px;[\s\S]*max-width:\s*100%;/)
    expect(panelRule).toMatch(/overflow:\s*hidden;/)
    expect(overlays).toMatch(
      /\.agent-panel__panel:not\(\.agent-panel__panel--floating\)\s*\{[^}]*background:\s*var\(--agent-panel-background, var\(--agent-surface\)\);/,
    )
    expect(overlays).toMatch(
      /\.agent-panel__panel--floating\s*\{[^}]*top:\s*calc\(var\(--agent-safe-area-top, 0px\) \+ 8px\);[^}]*bottom:\s*calc\(var\(--agent-safe-area-bottom, 0px\) \+ 8px\);[^}]*border-radius:\s*32px;/s,
    )
    expect(overlays).toMatch(
      /\.agent-panel__panel--left\.agent-panel__panel--floating\s*\{[^}]*left:\s*8px;/,
    )
    expect(overlays).toMatch(
      /\.agent-panel__panel--right\.agent-panel__panel--floating\s*\{[^}]*right:\s*8px;/,
    )
    expect(overlays).toMatch(
      /\.agent-panel__backdrop\s*\{[^}]*background:\s*rgba\(0, 0, 0, 0\.5\);/,
    )
    expect(overlays).toMatch(
      /\.agent-panel-left-enter-active[\s\S]*?transition:\s*transform 400ms cubic-bezier\(0\.4, 0, 0\.2, 1\);/,
    )
    expect(overlays).toMatch(
      /\.agent-panel-left-enter-from[\s\S]*?transform:\s*translateX\(-100%\);/,
    )
    expect(overlays).toMatch(
      /\.agent-panel-right-enter-from[\s\S]*?transform:\s*translateX\(100%\);/,
    )
    expect(source).not.toContain(':duration=')
    expect(tokens).toContain('--agent-panel-background: #ffffff;')
    expect(tokens).toContain('--agent-panel-background: #000000;')
    expect(tokens).toContain('--agent-glass: rgba(255, 255, 255, 0.75);')
    expect(tokens).toContain('--agent-glass: rgba(50, 50, 50, 0.5);')
  })

  it('resets every dark Glass override at a nested light theme boundary', () => {
    const tokens = readFileSync(
      new URL('../tokens.css', import.meta.url),
      'utf8',
    )
    const lightTheme = tokens.slice(
      tokens.indexOf('.agent-ui-provider,'),
      tokens.indexOf('.agent-ui-provider--dark,'),
    )

    expect(lightTheme).toContain('--agent-shadow-glass:')
    expect(lightTheme).toContain('--agent-shadow-glass-thumb:')
    expect(lightTheme).toContain('--agent-shadow-glass-thumb-glow:')
    expect(lightTheme).toContain('--agent-glass-thumb-active-background:')
    expect(lightTheme).toContain('--agent-glass-highlight-color:')
  })
})
