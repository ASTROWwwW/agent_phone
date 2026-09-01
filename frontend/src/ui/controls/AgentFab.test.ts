import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentFab from './AgentFab.vue'

describe('AgentFab', () => {
  it('composes the iOS glass layers with native button semantics', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentFab,
            { ariaLabel: 'Create', text: 'Create' },
            { icon: () => '+' },
          ),
      }),
    )

    expect(html).toContain('<button')
    expect(html).toContain('type="button"')
    expect(html).toContain('aria-label="Create"')
    expect(html).toContain('agent-glass')
    expect(html).toContain('agent-fab__accent-layer')
    expect(html).toContain('agent-fab__dark-accent-layer')
    expect(html).toContain('agent-fab__surface-layer')
    expect(html).toContain('Create')
  })

  it('keeps every FAB shadow layer on the contextual accent', () => {
    const uiDirectory = fileURLToPath(new URL('..', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')
    const tokens = readFileSync(`${uiDirectory}/tokens.css`, 'utf8')
    const fabStyles = controls.slice(
      controls.indexOf('.agent-glass.agent-fab {'),
      controls.indexOf('.agent-glass {'),
    )
    const fabTokens = tokens.slice(
      tokens.indexOf('--agent-shadow-glass-fab:'),
      tokens.indexOf('--agent-shadow-glass-thumb:'),
    )

    expect(fabStyles).toContain('background: var(--agent-app-accent, #007aff)')
    expect(fabStyles).toMatch(
      /\.agent-fab__surface-layer\s*\{[\s\S]*?var\(--agent-fab-accent-inset-start\) var\(--agent-app-accent, #007aff\)/,
    )
    expect(fabStyles).toMatch(
      /\.agent-fab__dark-accent-layer\s*\{[\s\S]*?inset 0 -5px 5px var\(--agent-app-accent, #007aff\)/,
    )
    expect(fabStyles).not.toContain('--agent-app-accent-shade')
    expect(fabStyles).not.toContain('scale(0.96)')
    expect(fabTokens).toContain('--agent-fab-accent-inset-start')
    expect(fabTokens).not.toContain('rgba(10, 132, 255, 0.25)')
  })

  it('offers a neutral glass variant without accent layers', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(AgentFab, { ariaLabel: 'Create', variant: 'neutral' }),
      }),
    )

    expect(html).toContain('agent-fab--neutral')

    const controls = readFileSync(
      fileURLToPath(new URL('../controls.css', import.meta.url)),
      'utf8',
    )
    expect(controls).toMatch(
      /\.agent-glass\.agent-fab--neutral\s*\{[^}]*background:\s*var\(--agent-glass-solid/s,
    )
  })

  it('offers a translucent glass variant for adjacent floating controls', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () => h(AgentFab, { ariaLabel: 'Create', variant: 'glass' }),
      }),
    )

    expect(html).toContain('agent-fab--glass')

    const controls = readFileSync(
      fileURLToPath(new URL('../controls.css', import.meta.url)),
      'utf8',
    )
    expect(controls).toMatch(
      /\.agent-glass\.agent-fab--glass\s*\{[^}]*border:\s*1px solid var\(--agent-hairline[^}]*background:\s*var\(--agent-glass[^}]*box-shadow:\s*var\(--agent-shadow-glass\)/s,
    )
  })

  it('keeps icon-only fabs perfectly square inside stretching toolbars', () => {
    const controls = readFileSync(
      fileURLToPath(new URL('../controls.css', import.meta.url)),
      'utf8',
    )

    expect(controls).toMatch(
      /\.agent-fab--icon-only\s*\{[^}]*width:\s*var\(--agent-touch-target, 44px\);[^}]*height:\s*var\(--agent-touch-target, 44px\);[^}]*flex:\s*none;[^}]*align-self:\s*center;/s,
    )
  })
})
