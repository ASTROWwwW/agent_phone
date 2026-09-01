import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentList from '@/ui/controls/AgentList.vue'

describe('AgentList', () => {
  it('exposes compact flush grouping as a reusable list contract', async () => {
    const app = createSSRApp(AgentList, {
      density: 'compact',
      flush: true,
      inset: true,
      strong: true,
    })

    const html = await renderToString(app)

    expect(html).toContain('agent-list--compact')
    expect(html).toContain('agent-list--flush')
    expect(html).toContain('agent-list--inset')
    expect(html).toContain('agent-list--strong')
    expect(html).toMatch(/^<div[^>]*class="agent-list/)
    expect(html).toMatch(/<ul class="agent-list__items">[\s\S]*<\/ul><\/div>$/)
  })
})
