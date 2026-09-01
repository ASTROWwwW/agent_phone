import { readFileSync } from 'node:fs'

import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentWidgetFrame from '@/ui/AgentWidgetFrame.vue'

const foundationStyles = readFileSync(
  new URL('./foundation.css', import.meta.url),
  'utf8',
)

describe('AgentWidgetFrame', () => {
  it('reserves a separate app-style label row below the widget surface', async () => {
    const html = await renderToString(
      createSSRApp(AgentWidgetFrame, { label: 'Weather', size: 'small' }),
    )

    expect(html).toContain('agent-widget-frame--small')
    expect(html).toContain('agent-widget-frame__surface')
    expect(html).toContain('agent-widget-frame__label')
    expect(html).toContain('Weather')
    expect(foundationStyles).toContain('var(--agent-widget-label-height);')
    expect(foundationStyles).toContain('var(--agent-widget-label-gap)')
  })

  it('keeps gallery previews unlabelled when requested', async () => {
    const html = await renderToString(
      createSSRApp(AgentWidgetFrame, {
        label: 'Music',
        showLabel: false,
        size: 'medium',
      }),
    )

    expect(html).toContain('agent-widget-frame--unlabelled')
    expect(html).not.toContain('agent-widget-frame__label')
  })
})
