import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentSettingsIcon from '@/ui/settings/AgentSettingsIcon.vue'

describe('AgentSettingsIcon', () => {
  it('renders its icon slot as a decorative colored tile by default', async () => {
    const app = createSSRApp({
      render: () =>
        h(
          AgentSettingsIcon,
          { color: '#007aff' },
          { default: () => h('svg', { class: 'wifi-icon' }) },
        ),
    })

    const html = await renderToString(app)

    expect(html).toContain('class="agent-settings-icon"')
    expect(html).toContain('--agent-settings-icon-color:#007aff')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('wifi-icon')
  })

  it('can expose a meaningful icon when it is not redundant with row copy', async () => {
    const app = createSSRApp(AgentSettingsIcon, {
      ariaLabel: 'Connected network',
    })

    const html = await renderToString(app)

    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Connected network"')
    expect(html).not.toContain('aria-hidden="true"')
  })
})
