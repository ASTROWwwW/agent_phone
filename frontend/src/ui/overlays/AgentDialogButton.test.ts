import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentDialogButton from './AgentDialogButton.vue'

async function renderDialogButton(
  props: { disabled?: boolean; strong?: boolean } = {},
): Promise<string> {
  return renderToString(
    createSSRApp({
      render: () => h(AgentDialogButton, props, () => 'Continue'),
    }),
  )
}

describe('AgentDialogButton', () => {
  it('uses the Konsta iOS tonal button for a regular action', async () => {
    const html = await renderDialogButton()
    const overlays = readFileSync(
      new URL('../overlays.css', import.meta.url),
      'utf8',
    )

    expect(html).toContain('<button')
    expect(html).toContain('type="button"')
    expect(html).toContain('agent-dialog-button')
    expect(html).toContain('agent-button--primary')
    expect(html).toContain('agent-button--large')
    expect(html).toContain('agent-button--rounded')
    expect(html).toContain('agent-button--tonal')
    expect(html).not.toContain('agent-dialog-button--strong')
    expect(overlays).toMatch(
      /\.agent-dialog-button\.agent-button\s*\{\s*color:\s*#fff;/,
    )
  })

  it('uses the Konsta iOS filled button for a strong action', async () => {
    const html = await renderDialogButton({ strong: true })

    expect(html).toContain('agent-dialog-button--strong')
    expect(html).toContain('agent-button--primary')
    expect(html).not.toContain('agent-button--tonal')
  })

  it('uses neutral Konsta disabled colors instead of fading the button', async () => {
    const html = await renderDialogButton({ disabled: true, strong: true })
    const overlays = readFileSync(
      new URL('../overlays.css', import.meta.url),
      'utf8',
    )

    expect(html).toContain('disabled')
    expect(overlays).toMatch(
      /\.agent-dialog-button:disabled\s*\{[\s\S]*?background:\s*var\(--agent-pressed\);[\s\S]*?color:\s*var\(--agent-subtle\);[\s\S]*?opacity:\s*1;/,
    )
    expect(overlays).not.toMatch(
      /\.agent-action-button:disabled,[\s\S]*?\.agent-dialog-button:disabled,[\s\S]*?opacity:\s*0\.45;/,
    )
  })
})
