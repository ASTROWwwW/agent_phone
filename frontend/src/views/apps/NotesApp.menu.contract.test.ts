import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./NotesApp.vue', import.meta.url),
  'utf8',
).replace(/\r\n/g, '\n')
const menuSource = source.slice(
  source.indexOf('<AgentActionSheet'),
  source.indexOf('</AgentActionSheet>') + '</AgentActionSheet>'.length,
)
const listStart = source.search(/<agent-app-page\r?\n\s+v-if="!editorOpened"/)
const listSource = source.slice(
  listStart,
  source.indexOf('<agent-app-page v-else'),
)

describe('NotesApp list controls', () => {
  it('places the Agent searchbar and create action together at the bottom', () => {
    const composerSource = listSource.slice(
      listSource.indexOf('<AgentToolbar'),
      listSource.indexOf('</AgentToolbar>') + '</AgentToolbar>'.length,
    )

    expect(composerSource).toContain('component="footer"')
    expect(listSource).toContain('<AgentScrollArea as="main"')
    expect(composerSource).toContain('<AgentSearchbar')
    expect(composerSource).toContain('v-model="searchQuery"')
    expect(composerSource).toContain('<AgentFab')
    expect(composerSource).toContain('variant="glass"')
    expect(composerSource).toContain('@click="createNote"')
    expect(composerSource).not.toContain('notes-search')
    expect(composerSource).not.toContain('notes-create-fab')
    expect(listSource).not.toContain('<k-searchbar')
    expect(listSource).not.toContain('<template #right>')
    expect(listSource).not.toContain('!pt-[44px]')
  })
})

describe('NotesApp headers', () => {
  it('keeps list and editor headers at the shared app height', () => {
    expect(source).toContain('class="notes-list-navbar"')
    expect(source).toContain(
      '.notes-list-navbar.agent-navbar--large.agent-navbar--no-navigation',
    )
    expect(source).toContain(
      'padding-top: calc(var(--agent-navbar-safe-area-top) + var(--agent-space-3))',
    )
    expect(source).toContain('class="notes-editor-page !pb-0"')
    expect(source).not.toContain('notes-editor-page !pt-[44px]')
  })
})

describe('NotesApp more menu', () => {
  it('uses the shared Feather-style action sheet', () => {
    expect(menuSource).toContain(
      ':aria-label="phone.t(\'Apps.notes.actions\')"',
    )
    expect(menuSource.match(/<AgentButton\b/g)).toHaveLength(4)
    expect(menuSource.match(/\btonal\b/g)).toHaveLength(3)
    expect(menuSource).toContain('<AgentButton block clear large')
    expect(menuSource).toContain('class="notes-action-sheet agent-ui-provider"')
    expect(menuSource).toContain("'agent-ui-provider--dark': phone.isDarkMode")
    expect(source).not.toContain('<AgentPopover')
  })

  it('keeps every action and close path connected', () => {
    expect(menuSource).toContain('@click="shareNote"')
    expect(menuSource).toContain('@click="togglePinned"')
    expect(menuSource).toContain('@click="deleteNote"')
    expect(menuSource).toContain('@backdropclick="menuOpened = false"')
    expect(menuSource).toContain('@escape="menuOpened = false"')
  })
})
