import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentBreadcrumbs from './AgentBreadcrumbs.vue'
import AgentBreadcrumbsCollapsed from './AgentBreadcrumbsCollapsed.vue'
import AgentBreadcrumbsItem from './AgentBreadcrumbsItem.vue'
import AgentBreadcrumbsSeparator from './AgentBreadcrumbsSeparator.vue'

const controls = readFileSync(
  new URL('../controls.css', import.meta.url),
  'utf8',
)

describe('AgentBreadcrumbs', () => {
  it('renders semantic current-page and collapsed navigation controls', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentBreadcrumbs,
            { ariaLabel: 'Catalog breadcrumb' },
            {
              default: () => [
                h(AgentBreadcrumbsItem, { component: 'button' }, () => 'Home'),
                h(AgentBreadcrumbsSeparator),
                h(AgentBreadcrumbsCollapsed, {
                  ariaControls: 'hidden-levels',
                  ariaLabel: 'Show hidden levels',
                  expanded: false,
                }),
                h(AgentBreadcrumbsSeparator),
                h(AgentBreadcrumbsItem, { active: true }, () => 'iPhone 12'),
              ],
            },
          ),
      }),
    )

    expect(html).toContain('<nav')
    expect(html).toContain('aria-label="Catalog breadcrumb"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('aria-controls="hidden-levels"')
    expect(html).toContain('aria-expanded="false"')
    expect(html.match(/agent-breadcrumbs-collapsed__dot/g)).toHaveLength(3)
  })

  it('matches Konsta iOS geometry while retaining 44px hit boxes', () => {
    expect(controls).toMatch(
      /\.agent-breadcrumbs\s*\{[^}]*height:\s*var\(--agent-touch-target, 44px\)[^}]*gap:\s*12px[^}]*overflow-x:\s*auto[^}]*overflow-y:\s*hidden[^}]*margin-block:\s*-6px[^}]*padding:\s*10px 0[^}]*font-size:\s*17px[^}]*line-height:\s*24px/s,
    )
    expect(controls).toMatch(
      /\.agent-breadcrumbs-separator\s*\{[^}]*width:\s*12px[^}]*min-width:\s*12px[^}]*opacity:\s*0\.35/s,
    )
    expect(controls).toMatch(
      /\.agent-breadcrumbs-collapsed\s*\{[^}]*width:\s*var\(--agent-touch-target, 44px\)[^}]*height:\s*var\(--agent-touch-target, 44px\)[^}]*margin-inline:\s*-7px[^}]*padding:\s*0/s,
    )
    expect(controls).toMatch(
      /\.agent-breadcrumbs-collapsed::before\s*\{[^}]*width:\s*30px[^}]*height:\s*17px[^}]*background:\s*rgba\(0, 0, 0, 0\.15\)/s,
    )
    expect(controls).toMatch(
      /\.agent-app-page--dark \.agent-breadcrumbs-collapsed::before\s*\{[^}]*background:\s*rgba\(255, 255, 255, 0\.15\)/s,
    )
  })

  it('keeps rounded outline segments rounded at both ends', () => {
    expect(controls).toMatch(
      /\.agent-segmented--outline\.agent-segmented--rounded[\s\S]*?\.agent-segmented-button:first-child\s*\{[^}]*border-start-start-radius:\s*var\(--agent-radius-pill, 999px\)[^}]*border-end-start-radius:\s*var\(--agent-radius-pill, 999px\)/,
    )
    expect(controls).toMatch(
      /\.agent-segmented--outline\.agent-segmented--rounded[\s\S]*?\.agent-segmented-button:last-child\s*\{[^}]*border-start-end-radius:\s*var\(--agent-radius-pill, 999px\)[^}]*border-end-end-radius:\s*var\(--agent-radius-pill, 999px\)/,
    )
  })
})
