import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentPillNavigation from './AgentPillNavigation.vue'

const foundation = readFileSync(
  new URL('./foundation.css', import.meta.url),
  'utf8',
)

describe('AgentPillNavigation', () => {
  it('defaults to a labelled full-width navigation', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentPillNavigation,
            { label: 'Store navigation' },
            { default: () => h('div', 'Tabs') },
          ),
      }),
    )

    expect(html).toContain('<nav')
    expect(html).toContain('aria-label="Store navigation"')
    expect(html).toContain('agent-pill-navigation--full')
    expect(html).toContain('agent-pill-navigation--align-center')
    expect(html).toContain('agent-pill-navigation__group--primary')
    expect(html).not.toContain('agent-pill-navigation__group--end')
  })

  it('supports compact start/end alignment and separated groups', async () => {
    const compact = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentPillNavigation,
            { align: 'end', label: 'Compact navigation', layout: 'compact' },
            { default: () => h('div', 'Compact') },
          ),
      }),
    )
    const split = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentPillNavigation,
            { label: 'Split navigation', layout: 'split' },
            {
              default: () => h('div', 'Apps and games'),
              end: () => h('div', 'Search'),
            },
          ),
      }),
    )

    expect(compact).toContain('agent-pill-navigation--compact')
    expect(compact).toContain('agent-pill-navigation--align-end')
    expect(split).toContain('agent-pill-navigation--split')
    expect(split).toContain('agent-pill-navigation__group--primary')
    expect(split).toContain('agent-pill-navigation__group--end')
  })

  it('locks full, compact and split geometry to the safe phone surface', () => {
    expect(foundation).toMatch(
      /\.agent-pill-navigation\s*\{[^}]*right:\s*calc\(var\(--agent-safe-area-right\) \+ var\(--agent-space-4\)\)[^}]*bottom:\s*calc\(var\(--agent-safe-area-bottom\) \+ 10px\)[^}]*left:\s*calc\(var\(--agent-safe-area-left\) \+ var\(--agent-space-4\)\)/s,
    )
    expect(foundation).toMatch(
      /\.agent-pill-navigation--full[\s\S]*?\.agent-pill-navigation__group--primary\s*\{[^}]*width:\s*100%/,
    )
    expect(foundation).toMatch(
      /\.agent-pill-navigation--compact\.agent-pill-navigation--align-start[\s\S]*?justify-content:\s*flex-start/,
    )
    expect(foundation).toMatch(
      /\.agent-pill-navigation--compact\.agent-pill-navigation--align-end[\s\S]*?justify-content:\s*flex-end/,
    )
    expect(foundation).toMatch(
      /\.agent-pill-navigation--split \.agent-pill-navigation__inner\s*\{[^}]*justify-content:\s*space-between/,
    )
    expect(foundation).toMatch(
      /\.agent-pill-navigation__group--end\s*\{[^}]*margin-inline-start:\s*auto/,
    )
    expect(foundation).toMatch(
      /\.agent-pill-navigation--compact \.agent-segmented-button,[\s\S]*?width:\s*60px;[\s\S]*?flex:\s*0 0 60px/,
    )
  })
})
