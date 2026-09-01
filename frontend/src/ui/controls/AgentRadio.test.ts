import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentRadio from './AgentRadio.vue'

describe('AgentRadio', () => {
  it('keeps native radio semantics and accessible label wiring', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentRadio,
            {
              modelValue: 'apps',
              name: 'view',
              value: 'apps',
            },
            { default: () => 'Apps' },
          ),
      }),
    )

    expect(html).toContain('type="radio"')
    expect(html).toContain('checked')
    expect(html).toContain('name="view"')
    expect(html).toContain('value="apps"')
    expect(html).toContain('aria-labelledby=')
    expect(html).toContain('agent-radio--checked')
    expect(html).toContain('Apps')
  })

  it('uses the 22px mark footprint without shrinking the 44px input target', () => {
    const uiDirectory = fileURLToPath(new URL('..', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')
    const radioStyles = controls.slice(
      controls.indexOf('.agent-radio {'),
      controls.indexOf('.agent-range {'),
    )

    expect(radioStyles).toMatch(
      /\.agent-radio\s*\{\s*min-width: 22px;\s*min-height: 22px/,
    )
    expect(radioStyles).toMatch(
      /\.agent-radio__input\s*\{[\s\S]*?width: var\(--agent-touch-target, 44px\)[\s\S]*?height: var\(--agent-touch-target, 44px\)[\s\S]*?inset-inline-start: -11px/,
    )
  })
})
