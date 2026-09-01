import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentMessagebar from './AgentMessagebar.vue'

async function renderMessagebar(
  props: Record<string, unknown> = {},
): Promise<string> {
  return renderToString(
    createSSRApp({
      render: () =>
        h(AgentMessagebar, props, {
          left: () => h('button', { class: 'camera' }, 'Camera'),
          right: () => h('button', { class: 'send' }, 'Send'),
        }),
    }),
  )
}

describe('AgentMessagebar', () => {
  it('uses a toolbar fade with separate Glass around the input', async () => {
    const html = await renderMessagebar({
      ariaLabel: 'Message',
      modelValue: 'Hello',
    })

    expect(html).toMatch(/class="[^"]*agent-messagebar[^"]*agent-toolbar[^"]*"/)
    expect(html).toContain('agent-toolbar__blur')
    expect(html).toContain('agent-toolbar__background')
    expect(html).toContain('agent-messagebar__inner')
    expect(html).toContain('agent-messagebar__area')
    expect(html).toContain('agent-glass')
    expect(html).not.toContain('agent-glass-surface')
    expect(html).toContain('aria-label="Message"')
    expect(html).toContain('>Hello</textarea>')
    expect(html.indexOf('agent-messagebar__left')).toBeLessThan(
      html.indexOf('agent-messagebar__area'),
    )
    expect(html.indexOf('agent-messagebar__area')).toBeLessThan(
      html.indexOf('agent-messagebar__right'),
    )
  })

  it('keeps app-owned composers in flow through the embedded variant', async () => {
    const html = await renderMessagebar({ embedded: true })
    const overlays = readFileSync(
      new URL('../overlays.css', import.meta.url),
      'utf8',
    )

    expect(html).toContain('agent-messagebar--embedded')
    expect(overlays).toMatch(
      /\.agent-messagebar--embedded\s*\{[\s\S]*?position:\s*relative;[\s\S]*?z-index:\s*auto;[\s\S]*?padding:\s*0;/,
    )
    expect(overlays).toMatch(
      /\.agent-messagebar--embedded \.agent-toolbar__blur,[\s\S]*?\.agent-messagebar--embedded \.agent-toolbar__background\s*\{[\s\S]*?display:\s*none;/,
    )
  })

  it('locks the Konsta iOS messagebar geometry', () => {
    const overlays = readFileSync(
      new URL('../overlays.css', import.meta.url),
      'utf8',
    )

    expect(overlays).toMatch(
      /\.agent-messagebar\s*\{[\s\S]*?--agent-messagebar-gap:\s*12px;/,
    )
    expect(overlays).toMatch(
      /\.agent-messagebar__area\s*\{[\s\S]*?height:\s*40px;[\s\S]*?border-radius:\s*24px;/,
    )
    expect(overlays).toMatch(
      /\.agent-messagebar textarea\s*\{[\s\S]*?height:\s*40px;[\s\S]*?padding:\s*12px 16px 4px;[\s\S]*?line-height:\s*16px;/,
    )
    expect(overlays).toMatch(
      /\.agent-messagebar \.agent-toolbar-pane\s*\{[\s\S]*?height:\s*40px;/,
    )
    expect(overlays).toMatch(
      /\.agent-messagebar__left,[\s\S]*?\.agent-messagebar__right\s*\{[\s\S]*?color:\s*var\(--agent-messagebar-icon\);/,
    )
    expect(overlays).toMatch(
      /\.agent-messagebar__left \.agent-link,[\s\S]*?\.agent-messagebar__right \.agent-link\s*\{[\s\S]*?color:\s*inherit;/,
    )
  })
})
