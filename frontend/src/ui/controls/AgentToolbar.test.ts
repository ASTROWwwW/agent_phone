import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentLink from './AgentLink.vue'
import AgentToolbar from './AgentToolbar.vue'
import AgentToolbarPane from './AgentToolbarPane.vue'

describe('AgentToolbar', () => {
  it('renders separate fade layers and glass panes', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(AgentToolbar, { ariaLabel: 'Actions', component: 'nav' }, () => [
            h(AgentToolbarPane, {}, () => 'Link 1'),
            h(AgentToolbarPane, {}, () => 'Link 2'),
          ]),
      }),
    )

    expect(html).toContain('role="toolbar"')
    expect(html).toContain('aria-label="Actions"')
    expect(html).toContain('agent-toolbar__blur')
    expect(html).toContain('agent-toolbar__background')
    expect(html.match(/agent-toolbar-pane/g)).toHaveLength(2)
    expect(html.match(/agent-glass/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('matches the Konsta iOS pane and background geometry', () => {
    const uiDirectory = fileURLToPath(new URL('..', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')
    const toolbarStyles = controls.slice(
      controls.indexOf('.agent-toolbar {'),
      controls.indexOf('.agent-visually-hidden'),
    )

    expect(toolbarStyles).toMatch(
      /\.agent-toolbar__inner\s*\{[\s\S]*?justify-content: space-between;[\s\S]*?gap: 16px;/,
    )
    expect(toolbarStyles).toMatch(
      /\.agent-toolbar\s*\{[\s\S]*?padding-right: calc\(var\(--agent-safe-area-right, 0px\) \+ 16px\);[\s\S]*?padding-left: calc\(var\(--agent-safe-area-left, 0px\) \+ 16px\);/,
    )
    expect(toolbarStyles).toMatch(
      /\.agent-toolbar-pane\s*\{[\s\S]*?height: 48px;[\s\S]*?border-radius: var\(--agent-radius-pill, 999px\);/,
    )
    expect(toolbarStyles).toMatch(
      /\.agent-toolbar--top \.agent-toolbar__blur,[\s\S]*?\.agent-toolbar--top \.agent-toolbar__background\s*\{\s*display: none;/,
    )
    expect(controls).toMatch(
      /\.agent-toolbar__blur\s*\{[\s\S]*?backdrop-filter: blur\(2px\);[\s\S]*?mask-image: linear-gradient/,
    )
  })

  it('inherits the iOS foreground for Toolbar links without changing generic links', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(AgentToolbar, {}, () =>
            h(AgentToolbarPane, {}, () => h(AgentLink, {}, () => 'Link 1')),
          ),
      }),
    )
    const uiDirectory = fileURLToPath(new URL('..', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')

    expect(html).toContain('class="agent-link"')
    expect(controls).toMatch(
      /\.agent-toolbar \.agent-link\s*\{\s*color: inherit;\s*\}/,
    )
    expect(controls).toMatch(
      /\.agent-glass\s*\{[^}]*color: var\(--agent-text, #000000\);/s,
    )
    expect(controls).toMatch(
      /\.agent-link\s*\{[^}]*color: var\(--agent-app-accent, #007aff\);/s,
    )
  })
})
