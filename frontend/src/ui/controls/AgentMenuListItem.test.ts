import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentMenuListItem from './AgentMenuListItem.vue'

describe('AgentMenuListItem', () => {
  it('forwards the active and auto-strong media state to AgentListItem', async () => {
    const html = await renderToString(
      createSSRApp(AgentMenuListItem, {
        active: true,
        subtitle: 'Home subtitle',
        title: 'Home',
      }),
    )

    expect(html).toContain('agent-menu-list-item--active')
    expect(html).toContain('agent-list-item--active')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('agent-list-item__title--strong')
  })

  it('matches Konsta iOS active colors in light and dark themes', () => {
    const uiDirectory = fileURLToPath(new URL('..', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')
    const tokens = readFileSync(`${uiDirectory}/tokens.css`, 'utf8')
    const lightTokens = tokens.slice(
      tokens.indexOf('.agent-ui-provider,'),
      tokens.indexOf('.agent-ui-provider--dark,'),
    )
    const darkTokens = tokens.slice(tokens.indexOf('.agent-ui-provider--dark,'))

    expect(lightTokens).toContain(
      '--agent-menu-list-active-background: var(--agent-app-accent-soft);',
    )
    expect(lightTokens).toContain(
      '--agent-menu-list-active-text: var(--agent-app-accent);',
    )
    expect(darkTokens).toContain(
      '--agent-menu-list-active-background: var(--agent-app-accent);',
    )
    expect(darkTokens).toContain('--agent-menu-list-active-text: #ffffff;')
    expect(controls).toMatch(
      /\.agent-list-item--menu\.agent-list-item--active \.agent-list-item__row\s*\{[\s\S]*?background:\s*var\(\s*--agent-menu-list-active-background[\s\S]*?color:\s*var\(\s*--agent-menu-list-active-text/,
    )
  })

  it('keeps the title and subtitle on adjacent 20px line boxes', () => {
    const uiDirectory = fileURLToPath(new URL('..', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')

    expect(controls).toMatch(
      /\.agent-list-item--menu\s*\{[^}]*padding:\s*4px 0;/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item--menu \.agent-list-item__row\s*\{[^}]*min-height:\s*var\(--agent-touch-target, 44px\);[^}]*gap:\s*16px;[^}]*padding:\s*0 0 0 8px;/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item--menu \.agent-list-item__content\s*\{[^}]*gap:\s*0;[^}]*padding:\s*12px 16px 12px 0;/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item--menu \.agent-list-item__title-wrap\s*\{[^}]*min-height:\s*0;/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item--menu \.agent-list-item__title\s*\{[^}]*font-size:\s*14px;[^}]*font-weight:\s*500;[^}]*line-height:\s*20px;/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item--menu \.agent-list-item__title--strong\s*\{[^}]*font-weight:\s*600;/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item--menu \.agent-list-item__subtitle\s*\{[^}]*color:\s*inherit;[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s,
    )
  })
})
