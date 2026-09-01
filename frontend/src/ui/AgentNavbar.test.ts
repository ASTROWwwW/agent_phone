import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentNavbar from '@/ui/AgentNavbar.vue'
import AgentSegmented from '@/ui/controls/AgentSegmented.vue'
import AgentSegmentedButton from '@/ui/controls/AgentSegmentedButton.vue'

import { getAgentNavbarCollapseState } from './navbar-collapse'

const foundationStyles = readFileSync(
  new URL('./foundation.css', import.meta.url),
  'utf8',
)
const controlsStyles = readFileSync(
  new URL('./controls.css', import.meta.url),
  'utf8',
)
const appPageSource = readFileSync(
  new URL('./AgentAppPage.vue', import.meta.url),
  'utf8',
)
const navbarSource = readFileSync(
  new URL('./AgentNavbar.vue', import.meta.url),
  'utf8',
)

describe('AgentNavbar', () => {
  it('keeps the compact centered header as the default', async () => {
    const html = await renderToString(
      createSSRApp(AgentNavbar, { title: 'Account' }),
    )

    expect(html).toContain('agent-navbar--compact')
    expect(html).toContain('agent-navbar__blur')
    expect(html).toContain('agent-navbar__background')
    expect(html).toContain('agent-navbar__inner')
    expect(html).not.toContain('agent-navbar__left')
    expect(html).not.toContain('agent-navbar__right')
    expect(html).toContain('<h1 class="agent-navbar__title">')
    expect(html).toContain('Account')
  })

  it('constrains long compact titles to the center column', () => {
    const titleRule = foundationStyles.match(
      /\.agent-navbar__title\s*\{([^}]*)\}/s,
    )?.[1]

    expect(titleRule).toContain('max-width: 100%')
    expect(titleRule).toContain('overflow: hidden')
    expect(titleRule).toContain('text-overflow: ellipsis')
    expect(titleRule).toContain('white-space: nowrap')
  })

  it('exposes the large-title header without changing heading semantics', async () => {
    const html = await renderToString(
      createSSRApp(AgentNavbar, {
        title: 'Settings',
        variant: 'large',
      }),
    )

    expect(html).toContain('agent-navbar--large')
    expect(html).toContain('agent-navbar--no-navigation')
    expect(html).not.toContain('agent-navbar__inner')
    expect(html).not.toContain('agent-navbar__left')
    expect(html).not.toContain('agent-navbar__right')
    expect(html).toContain('<h1 class="agent-navbar__title">')
    expect(html).toContain('Settings')
  })

  it('keeps migrated boolean sizing and inner hooks compatible', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentNavbar,
            {
              component: 'nav',
              innerClass: 'custom-inner',
              large: true,
              title: 'Clock',
            },
            { right: () => h('button', 'Edit') },
          ),
      }),
    )

    expect(html).toMatch(/^<nav/)
    expect(html).toContain('agent-navbar--large')
    expect(html).toContain('agent-navbar__inner custom-inner')
  })

  it('renders the extended navigation row only when it has controls', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentNavbar,
            { title: 'Account', variant: 'large' },
            { right: () => h('button', { type: 'button' }, 'Done') },
          ),
      }),
    )

    expect(html).not.toContain('agent-navbar--no-navigation')
    expect(html).toContain('agent-navbar__inner')
    expect(html).not.toContain('agent-navbar__left')
    expect(html).toContain('agent-navbar__right')
    expect(html).toContain('>Done</button>')
  })

  it('reserves the navigation-row geometry without empty elements', () => {
    const noNavigationRule = foundationStyles.match(
      /\.agent-navbar--no-navigation\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations
    const navigationRowRule = foundationStyles.match(
      /\.agent-navbar__inner\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations

    expect(noNavigationRule).toBeDefined()
    expect(noNavigationRule).toContain('var(--agent-navbar-safe-area-top)')
    expect(noNavigationRule).toContain('var(--agent-navbar-height)')
    expect(noNavigationRule).toContain('var(--agent-space-3)')
    expect(navigationRowRule).toBeDefined()
    expect(navigationRowRule).toContain('margin-bottom: var(--agent-space-3)')
  })

  it('reserves the Konsta iOS title row below the navigation controls', () => {
    const mediumNavbarRule = foundationStyles.match(
      /(?:^|\n)\.agent-navbar--medium\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations
    const largeNavbarRule = foundationStyles.match(
      /(?:^|\n)\.agent-navbar--large\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations

    expect(mediumNavbarRule).toContain('var(--agent-navbar-height)')
    expect(mediumNavbarRule).not.toContain(
      'var(--agent-navbar-large-title-height)',
    )
    expect(largeNavbarRule).toContain('var(--agent-navbar-height)')
    expect(largeNavbarRule).toContain('var(--agent-navbar-large-title-height)')
  })

  it('uses Konsta medium and large collapse geometry', () => {
    expect(getAgentNavbarCollapseState(0, 52)).toEqual({
      compactTitleOpacity: 0,
      extendedTitleOpacity: 1,
      offset: 0,
    })
    expect(getAgentNavbarCollapseState(26, 52)).toEqual({
      compactTitleOpacity: 0.25,
      extendedTitleOpacity: 0,
      offset: 26,
    })
    expect(getAgentNavbarCollapseState(100, 52)).toEqual({
      compactTitleOpacity: 1,
      extendedTitleOpacity: 0,
      offset: 52,
    })
    expect(getAgentNavbarCollapseState(44, 44).offset).toBe(44)
  })

  it('fades a compact transparent title without collapsing its layout', () => {
    expect(getAgentNavbarCollapseState(44, 44, false)).toEqual({
      compactTitleOpacity: 1,
      extendedTitleOpacity: 0,
      offset: 0,
    })
    expect(navbarSource).toContain(
      'hasExtendedTitle.value || props.transparent',
    )
    expect(foundationStyles).toMatch(
      /\.agent-navbar--transparent \.agent-navbar__heading\s*\{[^}]*opacity:\s*var\(--agent-navbar-compact-title-opacity\)/s,
    )
  })

  it('compensates the collapsing sibling header inside the scroll content', () => {
    const scrollAreaRule = foundationStyles.match(
      /(?:^|\n)\.agent-scroll-area\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations
    const compensationRule = foundationStyles.match(
      /(?:^|\n)\.agent-scroll-area::before\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations

    expect(scrollAreaRule).toContain('overflow-anchor: none')
    expect(compensationRule).toContain(
      'height: var(--agent-page-collapse-offset)',
    )
    expect(appPageSource).toContain(
      "'--agent-page-collapse-offset': `${pageScroll.collapseOffset.value}px`",
    )
    expect(navbarSource).toContain(
      'pageScroll.collapseOffset.value = collapseState.value.offset',
    )
  })

  it('keeps one semantic heading while exposing the collapsed visual title', async () => {
    const html = await renderToString(
      createSSRApp(AgentNavbar, { title: 'Store', variant: 'large' }),
    )

    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html).toContain('agent-navbar__collapsed-heading')
    expect(html).toContain('aria-hidden="true"')
  })

  it('keeps the custom title slot in sync while collapsed', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentNavbar,
            { title: 'Fallback', variant: 'large' },
            { title: () => 'Custom title' },
          ),
      }),
    )

    expect(html).not.toContain('Fallback')
    expect(html.match(/Custom title/g)).toHaveLength(2)
    expect(html.match(/<h1/g)).toHaveLength(1)
  })

  it('separates and fades the Konsta navbar blur before the scroll content', () => {
    expect(foundationStyles).toMatch(
      /\.agent-navbar__background\s*\{[\s\S]*?linear-gradient\([\s\S]*?--agent-navbar-glass[\s\S]*?transparent 100%/,
    )
    expect(foundationStyles).toMatch(
      /@supports[\s\S]*?-webkit-mask-image: linear-gradient\(#000, transparent\)[\s\S]*?\.agent-navbar__blur\s*\{[\s\S]*?backdrop-filter: blur\(2px\)[\s\S]*?-webkit-mask-image: linear-gradient\([\s\S]*?#000 50%[\s\S]*?transparent 100%/,
    )
    expect(foundationStyles).not.toMatch(
      /\.agent-navbar__background\s*\{[^}]*backdrop-filter/,
    )
  })

  it('exposes the optional surface back affordance for detail screens', async () => {
    const html = await renderToString(
      createSSRApp(AgentNavbar, {
        backAppearance: 'surface',
        backLabel: 'Back to Settings',
        showBack: true,
        title: 'Account',
      }),
    )

    expect(html).toContain('agent-navbar__back--surface')
    expect(html).toContain('aria-label="Back to Settings"')
    expect(html).toContain('class="agent-navbar__back-icon"')
    expect(html).toContain('viewBox="0 0 12 20"')
    expect(html).not.toContain('lucide-chevron-left')
  })

  it('keeps the Konsta glass wrappers and centers the exact iOS back icon', () => {
    expect(navbarSource).toContain('class="agent-navbar__left agent-glass-surface"')
    expect(navbarSource).toContain(
      'class="agent-navbar__right agent-glass-surface"',
    )
    expect(foundationStyles).toMatch(
      /\.agent-navbar__back\s*\{[^}]*padding:\s*0 16px;[^}]*justify-content:\s*center/s,
    )
    expect(foundationStyles).toMatch(
      /\.agent-navbar__back-icon\s*\{[^}]*width:\s*12px;[^}]*height:\s*20px;[^}]*display:\s*block;[^}]*fill:\s*currentColor/s,
    )
  })

  it('inherits the Konsta iOS foreground for navbar and toolbar actions', () => {
    expect(foundationStyles).toMatch(
      /\.agent-navbar__back\s*\{[^}]*color:\s*inherit;/s,
    )
    expect(controlsStyles).toMatch(
      /\.agent-navbar \.agent-link,\s*\.agent-navbar \.agent-navbar-back-link,\s*\.agent-toolbar \.agent-link\s*\{[^}]*color:\s*inherit;/s,
    )
    expect(controlsStyles).toMatch(
      /\.agent-link\s*\{[^}]*color:\s*var\(--agent-app-accent, #007aff\);/s,
    )
    expect(controlsStyles).toMatch(
      /\.agent-navbar-back-link:active:not\(:disabled\)\s*\{[^}]*opacity:\s*0\.5;[^}]*transition-duration:\s*0ms;/s,
    )
    expect(controlsStyles).toMatch(
      /\.agent-navbar-back-link__chevron\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;[^}]*display:\s*block;/s,
    )
    expect(controlsStyles).not.toMatch(
      /\.agent-navbar-back-link:active:not\(:disabled\)\s*\{[^}]*--agent-app-accent-soft/s,
    )
  })

  it('renders the Konsta 56px subnavbar and custom class hook', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentNavbar,
            { subnavbarClass: 'custom-subnavbar', title: 'Search' },
            { subnavbar: () => h('label', 'Search controls') },
          ),
      }),
    )
    const subnavbarRule = foundationStyles.match(
      /(?:^|\n)\.agent-navbar__subnavbar\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations

    expect(html).toContain('agent-navbar--with-subnavbar')
    expect(html).toContain('agent-navbar__subnavbar')
    expect(html).toContain('custom-subnavbar')
    expect(subnavbarRule).toContain('height: 56px')
    expect(subnavbarRule).toContain('var(--agent-safe-area-right)')
    expect(subnavbarRule).toContain('var(--agent-safe-area-left)')
    expect(subnavbarRule).not.toMatch(/padding-(?:top|bottom)|padding:\s/)
  })

  it('uses the Konsta navbar glass heights with and without subnavbar', () => {
    const navbarRule = foundationStyles.match(
      /(?:^|\n)\.agent-navbar\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations
    const baseEffectRule = foundationStyles.match(
      /\.agent-navbar__blur,\s*\.agent-navbar__background\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations
    const subnavbarEffectRule = foundationStyles.match(
      /\.agent-navbar--with-subnavbar \.agent-navbar__blur,\s*\.agent-navbar--with-subnavbar \.agent-navbar__background\s*\{(?<declarations>[^}]*)\}/,
    )?.groups?.declarations

    expect(navbarRule).toContain(
      '--agent-navbar-safe-area-top: max(16px, var(--agent-safe-area-top))',
    )
    expect(baseEffectRule).toContain('var(--agent-navbar-safe-area-top)')
    expect(baseEffectRule).toContain('var(--agent-navbar-height)')
    expect(baseEffectRule).toContain('+ 16px')
    expect(subnavbarEffectRule).toContain('var(--agent-navbar-safe-area-top)')
    expect(subnavbarEffectRule).toContain('var(--agent-navbar-height)')
    expect(subnavbarEffectRule).toContain('+ 70px + 16px')
    expect(foundationStyles).toMatch(
      /\.agent-navbar--outline::after\s*\{[^}]*bottom:\s*0/s,
    )
    expect(foundationStyles).not.toMatch(
      /\.agent-navbar--with-subnavbar\.agent-navbar--outline[\s\S]*?\.agent-navbar__background::after/,
    )
  })

  it('provides the Konsta navbar Glass context to segmented content', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentNavbar,
            { title: 'Store' },
            {
              subnavbar: () =>
                h(
                  AgentSegmented,
                  {
                    activeIndex: 0,
                    ariaLabel: 'Store sections',
                    itemCount: 2,
                    strong: true,
                  },
                  {
                    default: () => [
                      h(AgentSegmentedButton, { active: true }, () => 'Apps'),
                      h(AgentSegmentedButton, { active: false }, () => 'Games'),
                    ],
                  },
                ),
            },
          ),
      }),
    )

    expect(html).toContain('agent-navbar__subnavbar')
    expect(html).toContain('agent-glass')
    expect(html).toContain('agent-glass--highlight')
    expect(html).toContain('agent-segmented--navbar')
    expect(html).not.toContain('agent-segmented--navigation')
    expect(html).toContain('agent-segmented__highlight')
    expect(foundationStyles).toContain('height: 56px')
  })

  it('lets subnavbar content explicitly opt out of navigation Glass', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentNavbar,
            { title: 'Filters' },
            {
              subnavbar: () =>
                h(
                  AgentSegmented,
                  { ariaLabel: 'Filters', navigation: false },
                  { default: () => h(AgentSegmentedButton, () => 'All') },
                ),
            },
          ),
      }),
    )

    expect(html).toContain('agent-navbar__subnavbar')
    expect(html).not.toContain('agent-glass')
    expect(html).not.toContain('agent-segmented--navigation')
  })

  it('keeps Konsta transparent navbar glass while fading the compact title', () => {
    expect(foundationStyles).toMatch(
      /\.agent-navbar--transparent \.agent-navbar__heading\s*\{[^}]*opacity:\s*var\(--agent-navbar-compact-title-opacity\)/s,
    )
    expect(foundationStyles).not.toMatch(
      /\.agent-navbar--transparent \.agent-navbar__(?:blur|background)\s*\{[^}]*opacity:\s*0/s,
    )
  })
})
