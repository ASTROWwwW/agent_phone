import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentButton from './AgentButton.vue'

describe('AgentButton', () => {
  it('renders a native button with the requested variants', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentButton,
            { outline: true, rounded: true, tonal: true, type: 'submit' },
            () => 'Continue',
          ),
      }),
    )

    expect(html).toContain('<button')
    expect(html).toContain('type="submit"')
    expect(html).toContain('agent-button--outline')
    expect(html).toContain('agent-button--rounded')
    expect(html).toContain('agent-button--tonal')
    expect(html).toContain('Continue')
  })

  it('renders interactive liquid glass buttons through the shared glass surface', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(AgentButton, { glass: true, rounded: true }, () => 'Edit'),
      }),
    )

    expect(html).toContain('agent-button--glass')
    expect(html).toContain('agent-glass')
    expect(html).toContain('agent-glass--interactive')

    const controls = readFileSync(
      fileURLToPath(new URL('../controls.css', import.meta.url)),
      'utf8',
    )
    expect(controls).toMatch(
      /\.agent-glass\.agent-button--glass\s*\{[^}]*background:\s*var\(--agent-glass[^}]*box-shadow:\s*var\(--agent-shadow-glass\)/s,
    )
    expect(controls).toMatch(
      /\.agent-glass--interactive\s*\{[^}]*-webkit-backdrop-filter:\s*blur\(18px\) saturate\(145%\);[^}]*backdrop-filter:\s*blur\(18px\) saturate\(145%\);/s,
    )
  })

  it('keeps focus and pressed feedback on the contextual accent', () => {
    const uiDirectory = fileURLToPath(new URL('..', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')
    const buttonStyles = controls.slice(
      controls.indexOf('.agent-button:focus-visible'),
      controls.indexOf('.agent-badge'),
    )

    expect(buttonStyles).toMatch(
      /\.agent-button:focus-visible[\s\S]*?outline: 2px solid var\(--agent-app-accent, #007aff\)/,
    )
    expect(buttonStyles).toMatch(
      /\.agent-button--primary:active:not\(:disabled\)\s*\{\s*background: var\(--agent-app-accent, #007aff\);\s*filter: brightness\(0\.86\)/,
    )
    expect(buttonStyles).toMatch(
      /\.agent-button--tonal:active:not\(:disabled\)\s*\{\s*background: var\(--agent-app-accent-soft, rgba\(0, 122, 255, 0\.15\)\);\s*filter: brightness\(0\.92\)/,
    )
    expect(buttonStyles).not.toContain('--agent-app-accent-shade')
  })

  it('keeps outline text accented through hover and pressed states', () => {
    const uiDirectory = fileURLToPath(new URL('..', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')
    const buttonStyles = controls.slice(
      controls.indexOf('.agent-button:focus-visible'),
      controls.indexOf('.agent-badge'),
    )

    expect(buttonStyles).not.toContain('.agent-button--outline:hover')
    expect(buttonStyles).toMatch(
      /\.agent-button--outline:active:not\(:disabled\)\s*\{[\s\S]*?background:\s*var\(--agent-app-accent-soft, rgba\(0, 122, 255, 0\.15\)\);[\s\S]*?color:\s*var\(--agent-app-accent, #007aff\);[\s\S]*?filter:\s*none;/,
    )
    expect(buttonStyles).toMatch(
      /\.agent-button--danger\.agent-button--outline:active:not\(:disabled\)\s*\{[\s\S]*?background:\s*var\(--agent-danger-soft, rgba\(220, 38, 38, 0\.14\)\);[\s\S]*?color:\s*var\(--agent-danger, #dc2626\);/,
    )
    expect(buttonStyles).toContain(
      'color var(--agent-transition-fast, 100ms) ease,',
    )
  })
})
