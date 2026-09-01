import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentTabBar from '@/ui/AgentTabBar.vue'

describe('AgentTabBar', () => {
  const source = readFileSync(
    fileURLToPath(new URL('./AgentTabBar.vue', import.meta.url)),
    'utf8',
  )
  const foundation = readFileSync(
    fileURLToPath(new URL('./foundation.css', import.meta.url)),
    'utf8',
  )
  const controls = readFileSync(
    fileURLToPath(new URL('./controls.css', import.meta.url)),
    'utf8',
  )
  const mainCss = readFileSync(
    fileURLToPath(new URL('../assets/main.css', import.meta.url)),
    'utf8',
  )

  it('uses the Konsta-style floating glass capsule by default', async () => {
    const html = await renderToString(
      createSSRApp(AgentTabBar, { label: 'Navigation' }),
    )

    expect(html).toContain('agent-tabbar agent-tabbar--floating')
    expect(html).toContain('agent-tabbar--icons')
    expect(html).toContain('agent-tabbar--labels')
    expect(html).toContain('agent-glass')
    expect(html).toContain('agent-tabbar__blur')
    expect(html).toContain('agent-tabbar__background')
  })

  it('keeps icon and label density explicit', async () => {
    const html = await renderToString(
      createSSRApp(AgentTabBar, {
        icons: false,
        label: 'Navigation',
        labels: true,
      }),
    )

    expect(html).not.toContain('agent-tabbar--icons')
    expect(html).toContain('agent-tabbar--labels')
  })

  it('keeps migrated component and styling hooks on their intended layers', async () => {
    const html = await renderToString(
      createSSRApp(AgentTabBar, {
        bgClass: 'custom-background',
        component: 'footer',
        innerClass: 'custom-inner',
        label: 'Navigation',
      }),
    )

    expect(html).toMatch(/^<footer/)
    expect(html).toContain('agent-tabbar__background custom-background')
    expect(html).toContain('agent-tabbar__inner custom-inner')
  })

  it('matches the Konsta iOS glass, density, and moving highlight contract', () => {
    expect(foundation).toMatch(
      /\.agent-tabbar\s*\{[^}]*--agent-tabbar-pane-height:\s*48px[^}]*padding-right:\s*calc\(var\(--agent-safe-area-right\) \+ 16px\)[^}]*padding-bottom:\s*calc\(var\(--agent-safe-area-bottom\) \+ 16px\)/s,
    )
    expect(foundation).toMatch(
      /\.agent-tabbar--icons\.agent-tabbar--labels\s*\{[^}]*--agent-tabbar-pane-height:\s*64px/s,
    )
    expect(foundation).toMatch(
      /\.agent-tabbar__highlight-inner,[\s\S]*?inset:\s*4px/s,
    )
    expect(controls).toMatch(
      /\.agent-tab-button__icon\s*\{[^}]*width:\s*28px[^}]*height:\s*28px/s,
    )
    expect(controls).toMatch(
      /\.agent-tab-button__label\s*\{[^}]*font-size:\s*16px[^}]*font-weight:\s*400[^}]*line-height:\s*24px/s,
    )
    expect(controls).toMatch(
      /\.agent-tabbar \.agent-tab-button__icon \+ \.agent-tab-button__label\s*\{[^}]*font-size:\s*12px[^}]*font-weight:\s*500[^}]*line-height:\s*16px/s,
    )
    expect(controls).toMatch(
      /\.agent-tabbar \.agent-tab-button\s*\{[^}]*color:\s*var\(--agent-text,\s*#000000\)/s,
    )
    expect(foundation).not.toContain(
      '.agent-tabbar__links > button > span > span:last-child',
    )
    expect(source).toContain("attributeFilter: ['class']")
    expect(source).toContain(
      "button.classList.contains('agent-tab-button--active')",
    )
  })

  it('keeps Performance solid while Ultimate retains shared Glass', () => {
    expect(mainCss).toMatch(
      /\.phone-app--performance \.agent-tabbar__pane\s*\{[^}]*background:\s*var\(--agent-glass-solid\)[^}]*box-shadow:\s*none/s,
    )
    expect(source).toContain('<AgentGlass class="agent-tabbar__pane">')
  })
})
