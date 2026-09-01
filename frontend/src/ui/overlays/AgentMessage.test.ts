import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentMessage from './AgentMessage.vue'

describe('AgentMessage', () => {
  it('renders received and sent message states', async () => {
    const [received, sent] = await Promise.all([
      renderToString(
        createSSRApp({
          render: () =>
            h(AgentMessage, {
              name: 'Kate',
              text: 'Hi, I am good!',
              type: 'received',
            }),
        }),
      ),
      renderToString(
        createSSRApp({
          render: () => h(AgentMessage, { text: 'Hi, Kate', type: 'sent' }),
        }),
      ),
    ])

    expect(received).toContain('agent-message--received')
    expect(received).toContain('agent-message__name')
    expect(received).toContain('Kate')
    expect(received).toContain('Hi, I am good!')
    expect(sent).toContain('agent-message--sent')
  })

  it('uses the exact Konsta iOS received and metadata colors', () => {
    const overlays = readFileSync(
      new URL('../overlays.css', import.meta.url),
      'utf8',
    )
    const tokens = readFileSync(
      new URL('../tokens.css', import.meta.url),
      'utf8',
    )

    expect(tokens).toMatch(/--agent-message-received-background:\s*#e5e5ea;/)
    expect(tokens).toMatch(/--agent-message-received-background:\s*#252525;/)
    expect(tokens).toMatch(/--agent-message-meta:\s*rgba\(0, 0, 0, 0\.45\);/)
    expect(tokens).toMatch(
      /--agent-message-meta:\s*rgba\(255, 255, 255, 0\.45\);/,
    )
    expect(overlays).toMatch(
      /\.agent-message__bubble\s*\{[\s\S]*?background:\s*var\(--agent-message-received-background\);/,
    )
    expect(overlays).toMatch(
      /\.agent-message__name,[\s\S]*?\.agent-message__header\s*\{[\s\S]*?color:\s*var\(--agent-message-meta\);/,
    )
  })
})
