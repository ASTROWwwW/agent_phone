import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentChip from './AgentChip.vue'

const controls = readFileSync(
  new URL('../controls.css', import.meta.url),
  'utf8',
)

describe('AgentChip', () => {
  it('matches Konsta iOS chip geometry and colors', () => {
    expect(controls).toMatch(
      /\.agent-chip\s*\{[^}]*height:\s*28px[^}]*min-height:\s*28px[^}]*padding:\s*0 12px[^}]*border:\s*0[^}]*background:\s*rgba\(0, 0, 0, 0\.1\)[^}]*font-size:\s*14px[^}]*font-weight:\s*400/s,
    )
    expect(controls).toMatch(
      /\.agent-app-page--dark \.agent-chip:not\(\.agent-chip--outline\):not\(\.agent-chip--selected\)\s*\{[^}]*background:\s*rgba\(255, 255, 255, 0\.1\)/s,
    )
    expect(controls).toMatch(
      /\.agent-chip--outline\s*\{[^}]*border:\s*1px solid\s*var\(--agent-chip-outline-border, rgba\(0, 0, 0, 0\.2\)\)[^}]*background:\s*transparent[^}]*color:\s*var\(--agent-chip-outline-text, currentColor\)/s,
    )
  })

  it('matches Konsta media and delete geometry while retaining 44px hit areas', () => {
    expect(controls).toMatch(
      /\.agent-chip__media\s*\{[^}]*margin-block:\s*-4px[^}]*margin-inline-end:\s*4px[^}]*margin-inline-start:\s*-12px/s,
    )
    expect(controls).toMatch(
      /\.agent-chip__delete\s*\{[^}]*width:\s*24px[^}]*height:\s*28px[^}]*margin-inline-end:\s*-8px[^}]*margin-inline-start:\s*4px/s,
    )
    expect(controls).toMatch(
      /\.agent-chip__delete::before\s*\{[^}]*inset:\s*-8px -10px/s,
    )
    expect(controls).toMatch(
      /button\.agent-chip::before,[\s\S]*?a\.agent-chip::before\s*\{[^}]*inset:\s*-8px -4px/s,
    )
  })

  it('renders one accessible delete action with the Konsta delete icon', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentChip,
            {
              deleteButton: true,
              deleteLabel: 'Delete Adam Smith',
            },
            () => 'Adam Smith',
          ),
      }),
    )

    expect(html).toContain('agent-chip--with-delete')
    expect(html).toContain('aria-label="Delete Adam Smith"')
    expect(html).toContain('agent-chip__delete-icon')
    expect(html.match(/role="button"/g)).toHaveLength(1)
  })
})
