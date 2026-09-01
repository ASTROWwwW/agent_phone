import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./MessagesDemo.vue', import.meta.url),
  'utf8',
)

describe('MessagesDemo Konsta parity', () => {
  it('uses the real scroll owner without tabbar padding', () => {
    expect(source).not.toContain('with-tabbar')
    expect(source).toContain("closest('.agent-scroll-area')")
    expect(source).toContain(
      'scrollArea.scrollHeight - scrollArea.clientHeight',
    )
    expect(source.indexOf('</AgentMessages>')).toBeLessThan(
      source.indexOf('ref="messagesEnd"'),
    )
    expect(source).toMatch(
      /\.agent-ui-demo-messages__end\s*\{[\s\S]*?height:\s*36px;/,
    )
  })

  it('uses the exact filled 20px and 28px Framework7 iOS actions', () => {
    expect(source).toContain(
      "import ArrowUpCircleFill from 'framework7-icons/vue/vue/ArrowUpCircleFill.vue'",
    )
    expect(source).toContain(
      "import CameraFill from 'framework7-icons/vue/vue/CameraFill.vue'",
    )
    expect(source).toContain('<AgentIcon :size="20"><CameraFill /></AgentIcon>')
    expect(source).toContain(
      '<AgentIcon :size="28"><ArrowUpCircleFill /></AgentIcon>',
    )
    expect(source.match(/component="button"/g)).toHaveLength(2)
  })
})
