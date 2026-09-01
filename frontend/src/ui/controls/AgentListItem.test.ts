import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentListItem from './AgentListItem.vue'

describe('AgentListItem', () => {
  it('matches the Konsta anchor default for link rows', async () => {
    const html = await renderToString(
      createSSRApp(AgentListItem, { link: true, title: 'Inbox' }),
    )

    expect(html).toMatch(
      /^<li[^>]*class="agent-list-item[^"]*agent-list-item--link[^"]*"><a class="agent-list-item__row"/,
    )
    expect(html).not.toContain('<button')
  })

  it('renders row actions beside rather than inside the primary control', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentListItem,
            { link: true, linkComponent: 'button', title: 'Note' },
            { actions: () => h('button', { type: 'button' }, 'Delete') },
          ),
      }),
    )

    expect(html).toContain('agent-list-item--with-actions')
    expect(html).toMatch(
      /<button[^>]*class="agent-list-item__row"[\s\S]*?<\/button><div class="agent-list-item__actions">[\s\S]*?<button/,
    )
  })
})
