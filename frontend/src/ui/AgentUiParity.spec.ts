import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import {
  AgentActionButton,
  AgentActionGroup,
  AgentBadge,
  AgentButton,
  AgentCard,
  AgentChip,
  AgentDialog,
  AgentField,
  AgentListItem,
  AgentMessage,
  AgentMessagebar,
  AgentMenuList,
  AgentMenuListItem,
  AgentSearchbar,
  AgentScrollArea,
  AgentSpinner,
  AgentToast,
} from '@/ui'

async function render(
  component: Parameters<typeof h>[0],
  props: Record<string, unknown> = {},
  slots?: Record<string, () => ReturnType<typeof h> | string>,
): Promise<string> {
  return renderToString(
    createSSRApp({ render: () => h(component, props, slots) }),
  )
}

describe('Agent UI Konsta 5.3 parity contracts', () => {
  it('keeps Page content edge-to-edge unless padded compatibility is explicit', async () => {
    const edgeToEdge = await render(
      AgentScrollArea,
      {},
      { default: () => 'Content' },
    )
    const padded = await render(
      AgentScrollArea,
      { padded: true },
      { default: () => 'Content' },
    )

    expect(edgeToEdge).toContain('class="agent-scroll-area"')
    expect(edgeToEdge).not.toContain('agent-scroll-area--padded')
    expect(padded).toContain('agent-scroll-area--padded')
  })

  it('keeps Field styling on its root while forwarding native attrs to the control', async () => {
    const html = await render(AgentField, {
      class: 'native-input-class',
      'data-native': 'yes',
      inputId: 'native-input',
      placeholder: 'Name',
    })

    const rootTag = html.match(/^<li[^>]*>/)?.[0]
    const inputTag = html.match(/<input[^>]*>/)?.[0]

    expect(rootTag).toMatch(/class="[^"]*\bagent-field\b/)
    expect(rootTag).toContain('native-input-class')
    expect(rootTag).not.toContain('agent-field--error')
    expect(rootTag).not.toContain('data-native')
    expect(inputTag).not.toContain('native-input-class')
    expect(inputTag).toContain('data-native="yes"')
  })

  it('uses Konsta iOS defaults for Badge, Button, Messagebar, Message and Spinner', async () => {
    const [badge, button, messagebar, message, spinner] = await Promise.all([
      render(AgentBadge),
      render(AgentButton, {}, { default: () => 'Continue' }),
      render(AgentMessagebar),
      render(AgentMessage, {}, { default: () => 'Sent' }),
      render(AgentSpinner),
    ])

    expect(badge).toContain('agent-badge--primary')
    expect(button).not.toContain('agent-button--inline')
    expect(messagebar).not.toContain('agent-messagebar--outline')
    expect(message).toMatch(/^<div[^>]*agent-message--sent/)
    expect(spinner).toContain('width:32px')
    expect(spinner.match(/<path/g)).toHaveLength(8)
    expect(spinner).not.toContain('<i')
  })

  it('keeps the main ListItem migration hooks and slot geometry', async () => {
    const html = await render(
      AgentListItem,
      {
        after: 'Now',
        contentClass: 'custom-content',
        dividers: true,
        href: '/details',
        innerClass: 'custom-inner',
        media: 'M',
        mediaClass: 'custom-media',
        target: '_blank',
        text: 'Body',
        title: 'Title',
        titleWrapClass: 'custom-title-wrap',
      },
      {
        content: () => h('span', { class: 'custom-content-slot' }, 'Content'),
        default: () => h('span', { class: 'custom-default-slot' }, 'Default'),
        inner: () => h('span', { class: 'custom-inner-slot' }, 'Inner'),
      },
    )

    expect(html).toContain('<a')
    expect(html).toContain('href="/details"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('agent-list-item--dividers')
    expect(html).toContain('agent-list-item__title-wrap custom-title-wrap')
    expect(html).toContain('custom-content')
    expect(html).toContain('custom-inner')
    expect(html).toContain('custom-media')
    expect(html).toContain('custom-content-slot')
    expect(html.indexOf('custom-default-slot')).toBeGreaterThan(
      html.indexOf('</a>'),
    )
    expect(html).toContain('custom-inner-slot')
    expect(html).toContain('<div class="agent-list-item__title')
  })

  it('marks MenuList and forwards inherited MenuListItem content', async () => {
    const app = createSSRApp({
      render: () =>
        h(
          AgentMenuList,
          { dividers: false, outline: true },
          {
            default: () =>
              h(AgentMenuListItem, {
                active: true,
                footer: 'Footer',
                text: 'Text',
                title: 'Entry',
              }),
          },
        ),
    })
    const html = await renderToString(app)

    expect(html).toContain('agent-list--menu')
    expect(html).toContain('agent-list--outline')
    expect(html).toContain('agent-menu-list-item--active')
    expect(html).toContain('Text')
    expect(html).toContain('Footer')
  })

  it('exposes Searchbar migration props without unnamed action buttons', async () => {
    const html = await render(AgentSearchbar, {
      clearLabel: 'Clear query',
      component: 'form',
      disableButton: true,
      disableLabel: 'Close search',
      inputId: 'directory-search',
      modelValue: 'agent',
    })

    expect(html).toContain('<form')
    expect(html).toContain('id="directory-search"')
    expect(html).toContain('agent-glass')
    expect(html).not.toContain('agent-glass--highlight')
    expect(html).toContain('<svg class="agent-searchbar__icon"')
    expect(html).toContain('fill-rule="evenodd"')
    expect(html).not.toContain('<circle')
    expect(html).toContain('agent-searchbar__clear')
    expect(html).toContain('aria-label="Clear query"')
    expect(html).toContain('agent-searchbar__disable')
    expect(html).toContain('aria-label="Close search"')
  })

  it('renders added Chip, Badge, and Card variants', async () => {
    const chip = await render(
      AgentChip,
      { deleteButton: true, deleteLabel: 'Remove', outline: true },
      {
        default: () => 'Tag',
        media: () => h('span', 'M'),
      },
    )
    const badge = await render(AgentBadge, { component: 'strong', small: true })
    const card = await render(
      AgentCard,
      { contentWrapPadding: 'custom-padding' },
      { default: () => 'Body' },
    )

    expect(chip).toContain('agent-chip--outline')
    expect(chip).toContain('agent-chip__media')
    expect(chip).toContain('agent-chip__delete')
    expect(chip).toContain('aria-label="Remove"')
    expect(badge).toContain('<strong')
    expect(badge).toContain('agent-badge--small')
    expect(card).toContain('agent-card__content custom-padding')
  })

  it('keeps overlay component, backdrop, slot, and position parity', async () => {
    const dialog = await render(
      AgentDialog,
      { backdrop: false, opened: true },
      {
        buttons: () => h('button', 'OK'),
        title: () => h('span', 'Title slot'),
      },
    )
    const toast = await render(
      AgentToast,
      { opened: true, position: 'right', verticalPosition: 'center' },
      {
        button: () => h('button', 'Undo'),
        default: () => 'Saved',
      },
    )
    const actionGroup = await render(
      AgentActionGroup,
      { component: 'section', dividers: false },
      { default: () => h(AgentActionButton, { href: '/action' }, () => 'Open') },
    )

    expect(dialog).toContain('Title slot')
    expect(dialog).not.toContain('agent-overlay-backdrop')
    expect(toast).toContain('agent-toast--right')
    expect(toast).toContain('agent-toast--vertical-center')
    expect(toast).toContain('agent-toast__button')
    expect(actionGroup).toContain('<section')
    expect(actionGroup).not.toContain('agent-action-group--dividers')
    expect(actionGroup).toContain('<a')
    expect(actionGroup).toContain('href="/action"')
  })

  it('keeps Konsta glass blur optional over a solid fallback', () => {
    const uiDirectory = fileURLToPath(new URL('.', import.meta.url))
    const sources = ['controls.css', 'foundation.css', 'overlays.css'].map(
      (file) => readFileSync(`${uiDirectory}/${file}`, 'utf8'),
    )
    const combined = sources.join('\n')

    expect(combined).toContain('--agent-shadow-glass')
    expect(combined).toContain('var(--agent-glass-solid')
    expect(combined).toMatch(/@supports[\s\S]*backdrop-filter/)
    expect(combined).toContain('agent-glass--highlight-visible')
    expect(combined).toContain('agent-glass--touch-highlight')
    expect(combined).toContain('agent-glass-surface')
    expect(combined).toContain('var(--agent-navbar-glass, var(--agent-bg))')
  })

  it('locks visible iOS geometry while keeping touch expansion invisible', () => {
    const uiDirectory = fileURLToPath(new URL('.', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')
    const overlays = readFileSync(`${uiDirectory}/overlays.css`, 'utf8')

    expect(controls).toMatch(
      /\.agent-button\s*\{[^}]*height:\s*34px[^}]*min-height:\s*34px[^}]*padding:\s*4px 8px/s,
    )
    expect(controls).toMatch(
      /\.agent-button--small\s*\{[^}]*height:\s*28px[^}]*min-height:\s*28px[^}]*padding-inline:\s*8px/s,
    )
    expect(controls).toMatch(
      /\.agent-button::before\s*\{[^}]*width:\s*max\(100%, var\(--agent-touch-target, 44px\)\)[^}]*inset-block:\s*-5px/s,
    )
    expect(controls).not.toMatch(
      /\.agent-button:active:not\(:disabled\)\s*\{[^}]*transform:/s,
    )
    expect(controls).toMatch(
      /\.agent-checkbox__mark\s*\{[^}]*width:\s*22px[^}]*height:\s*22px/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item__title-wrap\s*\{[^}]*min-height:\s*28px/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item__row\s*\{[^}]*gap:\s*0[^}]*padding:\s*0 0 0 calc\(var\(--agent-safe-area-left\) \+ 16px\)/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item__media\s*\{[^}]*margin-right:\s*16px[^}]*padding:\s*8px 0/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item__content\s*\{[^}]*padding:\s*12px calc\(var\(--agent-safe-area-right\) \+ 16px\) 12px 0/s,
    )
    expect(controls).toMatch(
      /\.agent-block-title \+ \.agent-block-header,[\s\S]*?\.agent-block-title \+ \.agent-block-footer,[\s\S]*?\{[\s\S]*?margin-top:\s*8px;/,
    )
    expect(controls).toContain(
      '.agent-list-item--dividers:not(.agent-list-item--menu)',
    )
    expect(controls).toMatch(
      /\.agent-radio__mark\s*\{[^}]*width:\s*22px[^}]*height:\s*22px/s,
    )
    expect(controls).toMatch(
      /\.agent-toggle__track\s*\{[^}]*width:\s*64px[^}]*height:\s*28px/s,
    )
    expect(controls).toMatch(/\.agent-range__input\s*\{[^}]*height:\s*28px/s)
    expect(controls).toMatch(
      /\.agent-spinner__svg\s*\{[^}]*animation:\s*agent-spinner-spin 1s steps\(8, end\) infinite/s,
    )
    expect(controls).toMatch(
      /\.agent-list-item--group-title\.agent-list-item--contacts\s*\{[^}]*background:\s*var\(--agent-list-group-title-contacts-background[^}]*color:\s*var\(--agent-list-group-title-contacts-text/s,
    )
    expect(overlays).toMatch(/\.agent-action-button\s*\{[^}]*font-size:\s*20px/s)
    expect(overlays).toMatch(/\.agent-messages\s*\{[^}]*margin-bottom:\s*48px/s)
  })
})
