import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentSegmented from './AgentSegmented.vue'
import AgentSegmentedButton from './AgentSegmentedButton.vue'

const controls = readFileSync(
  new URL('../controls.css', import.meta.url),
  'utf8',
)

async function renderNavigation(activeIndex = 1): Promise<string> {
  return renderToString(
    createSSRApp({
      render: () =>
        h(
          AgentSegmented,
          {
            activeIndex,
            ariaLabel: 'App Store',
            itemCount: 3,
            navigation: true,
            rounded: true,
            strong: true,
          },
          {
            default: () =>
              ['Apps', 'Games', 'Search'].map((label, index) =>
                h(
                  AgentSegmentedButton,
                  {
                    active: activeIndex === index,
                    'aria-label': label,
                  },
                  () => label,
                ),
              ),
          },
        ),
    }),
  )
}

describe('AgentSegmented navigation', () => {
  it('keeps ordinary iOS segments at Konsta height and Strong colors', () => {
    expect(controls).toMatch(
      /\.agent-segmented\s*\{[^}]*height:\s*34px[^}]*min-height:\s*34px/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented-button\s*\{[^}]*height:\s*34px[^}]*min-height:\s*34px[^}]*padding:\s*0 8px[^}]*font-size:\s*15px[^}]*font-weight:\s*500/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--strong:not\(\.agent-segmented--navigation\):not\([\s\S]*?height:\s*38px[^}]*padding:\s*2px[^}]*background:\s*rgba\(0, 0, 0, 0\.05\)/,
    )
    expect(controls).toMatch(
      /\.agent-segmented--strong:not\(\.agent-segmented--navigation\):not\([\s\S]*?\.agent-segmented-button\s*\{[^}]*color:\s*var\(--agent-text, #000000\)/,
    )
    expect(controls).toMatch(
      /\.agent-segmented--strong:not\(\.agent-segmented--navigation\):not\([\s\S]*?\.agent-segmented__highlight\s*\{[^}]*background:\s*var\(--agent-segmented-strong-highlight, #ffffff\)/,
    )
    expect(controls).toMatch(
      /\.agent-segmented--strong:not\(\.agent-segmented--navigation\):not\([\s\S]*?\.agent-segmented__highlight\s*\{[^}]*border-radius:\s*inherit/,
    )
    expect(controls).toMatch(
      /\.agent-segmented--strong:not\(\.agent-segmented--navigation\):not\([\s\S]*?\.agent-segmented-button--active\s*\{[^}]*background:\s*transparent;[^}]*color:\s*#000000;[^}]*box-shadow:\s*none/,
    )
  })

  it('keeps ordinary rounded groups square between the pill edges', () => {
    expect(controls).toMatch(
      /\.agent-segmented:not\(\.agent-segmented--navigation\):not\(\.agent-segmented--navbar\)[\s\S]*?\.agent-segmented-button::before\s*\{[^}]*inset-block:\s*-5px;[^}]*inset-inline:\s*0;/,
    )
    expect(controls).toMatch(
      /\.agent-segmented:not\(\.agent-segmented--strong\):not\(\s*\.agent-segmented--outline\s*\):not\(\s*\.agent-segmented--navigation\s*\):not\(\.agent-segmented--navbar\)\s*\.agent-segmented-button\s*\{[^}]*border-radius:\s*0;/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented:not\(\.agent-segmented--strong\):not\(\s*\.agent-segmented--outline\s*\):not\(\s*\.agent-segmented--navigation\s*\):not\(\.agent-segmented--navbar\)\s*\.agent-segmented-button:first-child\s*\{[^}]*border-start-start-radius:\s*4px;[^}]*border-end-start-radius:\s*4px;/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--rounded:not\(\.agent-segmented--strong\):not\(\s*\.agent-segmented--outline\s*\):not\(\.agent-segmented--navigation\):not\(\.agent-segmented--navbar\)\s*\.agent-segmented-button:first-child\s*\{[^}]*border-start-start-radius:\s*var\(--agent-radius-pill, 999px\);[^}]*border-end-start-radius:\s*var\(--agent-radius-pill, 999px\);/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--rounded:not\(\.agent-segmented--strong\):not\(\s*\.agent-segmented--outline\s*\):not\(\.agent-segmented--navigation\):not\(\.agent-segmented--navbar\)\s*\.agent-segmented-button:last-child\s*\{[^}]*border-start-end-radius:\s*var\(--agent-radius-pill, 999px\);[^}]*border-end-end-radius:\s*var\(--agent-radius-pill, 999px\);/s,
    )
    expect(controls).not.toMatch(
      /\.agent-segmented--rounded[^{}]*\.agent-segmented-button--active\s*\{[^}]*border-radius:/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--outline\.agent-segmented--rounded\s*\.agent-segmented-button:first-child\s*\{[^}]*border-start-start-radius:\s*var\(--agent-radius-pill, 999px\);[^}]*border-end-start-radius:\s*var\(--agent-radius-pill, 999px\);/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--rounded \.agent-segmented-button\s*\{[^}]*border-radius:\s*var\(--agent-radius-pill, 999px\);/s,
    )
  })

  it('renders the Konsta iOS glass stack and one moving highlight', async () => {
    const html = await renderNavigation()

    expect(html).toContain('agent-glass')
    expect(html).toContain('agent-glass--highlight')
    expect(html).toContain('agent-segmented--navigation')
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-label="App Store"')
    expect(html.match(/<button/g)).toHaveLength(3)
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(html).toContain('agent-segmented__highlight')
    expect(html).toContain('width:calc(33.3333% - 5.3333px)')
    expect(html).toContain('--agent-segmented-indicator-offset:calc(100% + 4px)')
  })

  it('allows callers to disable only the interactive Glass highlight', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentSegmented,
            {
              ariaLabel: 'Static glass',
              glassHighlight: false,
              itemCount: 1,
              navigation: true,
            },
            {
              default: () =>
                h(AgentSegmentedButton, { active: true }, () => 'One'),
            },
          ),
      }),
    )

    expect(html).toContain('agent-glass')
    expect(html).not.toContain('agent-glass--highlight')
  })

  it('locks the 56px container, 48px controls and reduced motion', () => {
    expect(controls).toMatch(
      /\.agent-glass\.agent-segmented--navigation\s*\{[^}]*min-height:\s*56px[^}]*gap:\s*4px[^}]*padding:\s*4px/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--navigation \.agent-segmented-button\s*\{[^}]*min-height:\s*48px/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented__highlight\s*\{[^}]*top:\s*4px[^}]*bottom:\s*4px[^}]*background:\s*#e5e5ea/s,
    )
    expect(controls).toMatch(
      /\.agent-app-page--dark \.agent-segmented__highlight\s*\{[^}]*background:\s*#2c2c2e/s,
    )
    expect(controls).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.agent-segmented__highlight,[\s\S]*transition-duration:\s*0\.01ms/,
    )
  })

  it('keeps text-only Glass navigation compact with 44px targets', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentSegmented,
            {
              activeIndex: 1,
              ariaLabel: 'Availability',
              compact: true,
              itemCount: 3,
              navigation: true,
              strong: true,
            },
            {
              default: () =>
                ['Available', 'Busy', 'Closed'].map((label, index) =>
                  h(AgentSegmentedButton, { active: index === 1 }, () => label),
                ),
            },
          ),
      }),
    )

    expect(html).toContain('agent-segmented--compact')
    expect(html).toContain('width:calc(33.3333% - 5.3333px)')
    expect(controls).toMatch(
      /\.agent-glass\.agent-segmented--navigation\.agent-segmented--compact\s*\{[^}]*height:\s*48px[^}]*min-height:\s*48px[^}]*padding-block:\s*2px/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--navigation\.agent-segmented--compact \.agent-segmented-button\s*\{[^}]*height:\s*var\(--agent-touch-target, 44px\)[^}]*font-size:\s*15px[^}]*font-weight:\s*500/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--compact \.agent-segmented__highlight\s*\{[^}]*top:\s*2px[^}]*bottom:\s*2px/s,
    )
  })

  it('lets subnavbar search controls fill the available Konsta row', () => {
    expect(controls).toMatch(
      /\.agent-searchbar\s*\{[^}]*width:\s*100%[^}]*flex:\s*1 1 auto/s,
    )
  })

  it('keeps Navbar segmented visuals at Konsta size with 44px targets', () => {
    expect(controls).toMatch(
      /\.agent-glass\.agent-segmented--navbar\s*\{[^}]*height:\s*var\(--agent-touch-target, 44px\)[^}]*gap:\s*4px[^}]*padding:\s*0 4px/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--navbar \.agent-segmented-button\s*\{[^}]*min-height:\s*var\(--agent-touch-target, 44px\)[^}]*padding:\s*0 8px[^}]*font-size:\s*15px[^}]*font-weight:\s*500/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--navbar \.agent-segmented__highlight\s*\{[^}]*top:\s*5px[^}]*bottom:\s*5px[^}]*background:\s*#ffffff/s,
    )
    expect(controls).toMatch(
      /\.agent-app-page--dark \.agent-segmented--navbar \.agent-segmented__highlight\s*\{[^}]*background:\s*rgba\(255, 255, 255, 0\.75\)/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--navbar\.agent-segmented--strong\s*\.agent-segmented-button:not\(\.agent-segmented-button--active\)\s*\{[^}]*color:\s*inherit;/s,
    )
    expect(controls).toMatch(
      /\.agent-segmented--navbar \.agent-segmented-button--active\s*\{[^}]*color:\s*#000000;/s,
    )
  })

  it('calculates the same sliding pill for full-width five-item navigation', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentSegmented,
            {
              activeIndex: 4,
              ariaLabel: 'Five tabs',
              itemCount: 5,
              navigation: true,
              strong: true,
            },
            {
              default: () =>
                Array.from({ length: 5 }, (_, index) =>
                  h(
                    AgentSegmentedButton,
                    { active: index === 4 },
                    () => `${index}`,
                  ),
                ),
            },
          ),
      }),
    )

    expect(html).toContain('width:calc(20% - 4.8px)')
    expect(html).toContain('--agent-segmented-indicator-offset:calc(400% + 16px)')
  })

  it('keeps Konsta strong mode opt-in by default', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentSegmented,
            {},
            {
              default: () =>
                h(AgentSegmentedButton, { active: true }, () => 'One'),
            },
          ),
      }),
    )

    expect(html).not.toContain('agent-segmented--strong')
    expect(html).not.toContain('agent-segmented__highlight')
  })

  it('renders the rounded iOS strong highlight as a moving pill', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentSegmented,
            {
              activeIndex: 0,
              itemCount: 4,
              rounded: true,
              strong: true,
            },
            {
              default: () =>
                ['10%', '30%', '50%', '100%'].map((label, index) =>
                  h(AgentSegmentedButton, { active: index === 0 }, () => label),
                ),
            },
          ),
      }),
    )

    expect(html).toContain('agent-segmented--rounded')
    expect(html).toContain('agent-segmented--strong')
    expect(html).toContain('agent-segmented__highlight')
    expect(html).toContain('width:calc(25% - 4px)')
  })
})
