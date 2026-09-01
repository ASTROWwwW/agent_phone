import { readFileSync } from 'node:fs'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import { AgentMediaCard } from '@/ui'

describe('AgentMediaCard', () => {
  it('composes media, metadata, copy, and actions on the public AgentCard shell', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentMediaCard,
            {
              id: 'journey-card',
              meta: 'Posted on January 21, 2021',
              outline: true,
              title: 'Journey To Mountains',
            },
            {
              actions: () => [h('a', 'Like'), h('a', 'Read more')],
              default: () => h('p', 'Card copy'),
              media: () => h('img', { alt: '', src: '/mountains.jpg' }),
            },
          ),
      }),
    )

    expect(html).toContain('id="journey-card"')
    expect(html).toContain('agent-card--outline')
    expect(html).toContain('agent-media-card')
    expect(html).toContain('agent-media-card__media')
    expect(html).toContain('agent-media-card__visual')
    expect(html).toContain('src="/mountains.jpg"')
    expect(html).toContain('agent-media-card__title')
    expect(html).toContain('Journey To Mountains')
    expect(html).toContain('agent-media-card__meta')
    expect(html).toContain('Posted on January 21, 2021')
    expect(html).toContain('agent-media-card__copy')
    expect(html).toContain('Card copy')
    expect(html).toContain('agent-card__footer')
    expect(html).toContain('agent-media-card__actions')
    expect(html.indexOf('agent-media-card__media')).toBeLessThan(
      html.indexOf('agent-media-card__body'),
    )
    expect(html.indexOf('agent-media-card__body')).toBeLessThan(
      html.indexOf('agent-media-card__actions'),
    )
  })

  it('supports semantic title and metadata slots without empty optional regions', async () => {
    const slottedHtml = await renderToString(
      createSSRApp({
        render: () =>
          h(
            AgentMediaCard,
            { meta: 'Fallback meta', title: 'Fallback title' },
            {
              meta: () =>
                h('time', { datetime: '2021-01-21' }, 'January 21, 2021'),
              title: () => h('span', 'Slotted title'),
            },
          ),
      }),
    )
    const copyOnlyHtml = await renderToString(
      createSSRApp({
        render: () =>
          h(AgentMediaCard, null, { default: () => h('p', 'Copy only') }),
      }),
    )

    expect(slottedHtml).toContain('Slotted title')
    expect(slottedHtml).not.toContain('Fallback title')
    expect(slottedHtml).toContain('datetime="2021-01-21"')
    expect(slottedHtml).not.toContain('Fallback meta')
    expect(copyOnlyHtml).toContain('agent-media-card__body')
    expect(copyOnlyHtml).toContain('agent-media-card__copy')
    expect(copyOnlyHtml).not.toContain('agent-media-card__media')
    expect(copyOnlyHtml).not.toContain('agent-media-card__meta')
    expect(copyOnlyHtml).not.toContain('agent-media-card__actions')
    expect(copyOnlyHtml).not.toContain('agent-card__footer')
  })

  it('owns the reusable editorial geometry in the shared stylesheet', () => {
    const controls = readFileSync(
      new URL('../controls.css', import.meta.url),
      'utf8',
    )

    expect(controls).toMatch(
      /\.agent-card__content\s*\{[\s\S]*?font-size:\s*14px;[\s\S]*?line-height:\s*20px;/,
    )
    expect(controls).toMatch(
      /\.agent-media-card__media\s*\{[\s\S]*?height:\s*192px;[\s\S]*?align-items:\s*flex-end;/,
    )
    expect(controls).toMatch(
      /\.agent-media-card__visual > img,[\s\S]*?object-fit:\s*cover;/,
    )
    expect(controls).toMatch(
      /\.agent-media-card__body\s*\{[\s\S]*?padding:\s*var\(--agent-space-4, 16px\);/,
    )
    expect(controls).toMatch(
      /\.agent-media-card__meta\s*\{[\s\S]*?margin-bottom:\s*var\(--agent-space-3, 12px\);/,
    )
    expect(controls).toMatch(
      /\.agent-media-card__actions\s*\{[\s\S]*?justify-content:\s*space-between;[\s\S]*?gap:\s*var\(--agent-space-2, 8px\);/,
    )
  })
})
