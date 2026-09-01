import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentIcon from './AgentIcon.vue'

describe('AgentIcon', () => {
  it('uses the Konsta i element default and renders a colored badge', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentIcon,
            {
              badge: 5,
              badgeColors: { bg: '#ef4444', text: '#ffffff' },
              size: 28,
            },
            { default: () => h('svg') },
          ),
      }),
    )

    expect(html).toContain('<i')
    expect(html).toContain('class="agent-icon"')
    expect(html).toContain('height:28px')
    expect(html).toContain('width:28px')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('agent-icon__badge')
    expect(html).toContain('background:#ef4444')
    expect(html).toContain('color:#ffffff')
    expect(html).toMatch(/agent-icon__badge[\s\S]*?5[\s\S]*?<\/span>/)
  })

  it('supports a custom component and a badge slot without a badge prop', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentIcon,
            { component: 'span', label: 'Inbox' },
            {
              badge: () => 'NEW',
              default: () => h('svg'),
            },
          ),
      }),
    )

    expect(html).toContain('<span')
    expect(html).toContain('aria-label="Inbox"')
    expect(html).toContain('role="img"')
    expect(html).not.toContain('aria-hidden="true"')
    expect(html).toContain('agent-icon__badge')
    expect(html).toMatch(/agent-icon__badge[\s\S]*?NEW[\s\S]*?<\/span>/)
  })
})
