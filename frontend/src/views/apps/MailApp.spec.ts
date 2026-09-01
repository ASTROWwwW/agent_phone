import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { resourceUrl } from '../../testing/resource'

const source = readFileSync(new URL('./MailApp.vue', import.meta.url), 'utf8')
const editorSource = readFileSync(
  new URL('../../components/MailMarkdownEditor.vue', import.meta.url),
  'utf8',
)
const mailServerSource = readFileSync(
  resourceUrl('source/server/mail.lua'),
  'utf8',
)
const migrationSource = readFileSync(
  resourceUrl('source/server/db_migrate.lua'),
  'utf8',
)
const clientSource = readFileSync(
  resourceUrl('source/client/nui_server_bridge.lua'),
  'utf8',
)

describe('MailApp Agent UI contract', () => {
  it('uses Agent navigation for logout and mailbox back actions', () => {
    expect(source).toContain('class="mail-navbar mail-folders-navbar"')
    expect(source).toContain(':aria-label="phone.t(\'Apps.mail.logout\')"')
    expect(source).toContain('<LogOut :size="20"')
    expect(source).toContain('<agent-navbar-back-link')
    expect(source).not.toContain('<header class="mail-header')
    expect(source).not.toContain('class="mail-header__back"')
  })

  it('puts logout on the left and mailbox editing on the right', () => {
    const foldersStart = source.indexOf('v-else-if="screen === \'folders\'"')
    const foldersEnd = source.indexOf(
      'v-else-if="screen === \'list\'"',
      foldersStart,
    )
    const folders = source.slice(foldersStart, foldersEnd)
    const left = folders.slice(
      folders.indexOf('<template #left>'),
      folders.indexOf('</template>', folders.indexOf('<template #left>')),
    )
    const right = folders.slice(
      folders.indexOf('<template #right>'),
      folders.indexOf('</template>', folders.indexOf('<template #right>')),
    )

    expect(left).toContain("phone.t('Apps.mail.logout')")
    expect(right).toContain('mail-folders-navbar__edit')
    expect(right).toContain("'Apps.mail.editMailboxes'")
  })

  it('provides a Agent UI modal to create and open custom mailboxes', () => {
    const mailboxStart = source.indexOf('class="mail-modal mail-mailbox-modal"')
    const mailboxEnd = source.indexOf('</agent-sheet>', mailboxStart)
    const mailboxModal = source.slice(mailboxStart, mailboxEnd)

    expect(source).not.toContain("screen === 'mailbox-create'")
    expect(source).toContain('class="mail-modal mail-mailbox-modal"')
    expect(source).toContain(':opened="mailboxCreateOpened"')
    expect(source).toContain('@backdropclick="cancelMailboxCreate"')
    expect(source).toContain('@escape="cancelMailboxCreate"')
    expect(source).toContain('@swipeclose="cancelMailboxCreate"')
    expect(source).toContain('v-model="mailboxName"')
    expect(source).toContain("phone.t('Apps.mail.mailboxLocation')")
    expect(source).toContain('@click="createMailbox"')
    expect(source).toContain(
      '@click="openFolder(mailboxFolderKey(mailbox.id))"',
    )
    expect(source).toContain('@click="moveMessageToMailbox(mailbox)"')
    expect(source).toContain('@click="moveMessageToDefaultMailbox"')
    expect(mailboxModal).toContain('class="mail-modal__nav-button"')
    expect(mailboxModal).toContain(':aria-label="phone.t(\'Common.cancel\')"')
    expect(mailboxModal).toContain(':aria-label="phone.t(\'Common.save\')"')
    expect(mailboxModal).toContain('<X :size="20" />')
    expect(mailboxModal).toContain('<Check :size="20" />')
    expect(mailboxModal).not.toContain('<agent-spinner')
    expect(mailboxModal).toContain('class="mail-mailbox-create__name"')
    expect(mailboxModal).toContain('class="mail-mailbox-create__location-row"')
    expect(mailboxModal).not.toContain(' outline')
    expect(source).toMatch(
      /\.mail-mailbox-create__form\s*\{[^}]*overflow-y:\s*auto/s,
    )
    expect(source).toMatch(
      /\.mail-mailbox-create__name\s*\{[^}]*border-radius:\s*17px[^}]*background:\s*var\(--agent-surface-variant\)/s,
    )
    expect(source).toMatch(
      /\.mail-mailbox-modal\s+:deep\(\.agent-sheet__panel\)\s*\{[^}]*height:\s*auto[^}]*background:\s*var\(--agent-surface\)/s,
    )
    expect(source).toMatch(
      /\.mail-mailbox-create\s*\{[^}]*height:\s*auto[^}]*background:\s*var\(--agent-surface\)/s,
    )
  })

  it('places the Apple-style filter, Agent search and compose action together', () => {
    const toolbarClass = 'class="mail-bottom-toolbar mail-list-toolbar"'
    const classIndex = source.indexOf(toolbarClass)
    const toolbarStart = source.lastIndexOf('<agent-toolbar', classIndex)
    const toolbarEnd =
      source.indexOf('</agent-toolbar>', classIndex) + '</agent-toolbar>'.length
    const toolbar = source.slice(toolbarStart, toolbarEnd)

    expect(toolbar).toContain('component="footer"')
    expect(toolbar).toContain('@click="openMailFilters"')
    expect(toolbar).toContain('<ListFilter :size="21"')
    expect(toolbar).toContain('mail-filter-fab--active')
    expect(toolbar).toContain("phone.t('Apps.mail.filteredBy')")
    expect(toolbar).toContain('{{ activeFilterSummary }}')
    expect(toolbar).toContain('<agent-searchbar')
    expect(toolbar).toContain('@update:model-value="updateSearch"')
    expect(toolbar).toContain('variant="glass"')
    expect(toolbar).toContain('@click="beginCompose()"')
    expect(source).not.toContain('class="mail-search"')
    expect(source).not.toContain('class="mail-compose-fab"')
    expect(source).toMatch(
      /\.mail-bottom-toolbar\s*\{[^}]*padding-bottom:\s*calc\([\s\S]*var\(--agent-space-6\)/,
    )
  })

  it('uses liquid glass for mailbox, filter and compose floating actions', () => {
    expect(source.match(/variant="glass"/g)).toHaveLength(5)
    expect(source).not.toContain('variant="neutral"')
  })

  it('offers multiple filter criteria in one scrolling Agent UI modal', () => {
    const filterStart = source.indexOf('class="mail-modal mail-filter-modal"')
    const filterEnd = source.indexOf('</agent-sheet>', filterStart)
    const filterScreen = source.slice(filterStart, filterEnd)

    expect(source).not.toContain("screen === 'filters'")
    expect(filterScreen).toContain(':opened="filtersOpened"')
    expect(filterScreen).toContain('@backdropclick="closeMailFilters"')
    expect(filterScreen).toContain('@escape="closeMailFilters"')
    expect(filterScreen).toContain('@swipeclose="closeMailFilters"')
    expect(filterScreen).toContain(
      'class="mail-modal__navbar mail-filters__navbar"',
    )
    expect(filterScreen).toContain('@click="applyMailFilters"')
    expect(filterScreen).toContain("toggleDraftReadFilter('unread')")
    expect(filterScreen).toContain("toggleDraftReadFilter('read')")
    expect(filterScreen).toContain("toggleDraftAddressFilter('to-me')")
    expect(filterScreen).toContain("toggleDraftAddressFilter('from-me')")
    expect(filterScreen).toContain("toggleDraftDirectionFilter('inbox')")
    expect(filterScreen).toContain("toggleDraftDirectionFilter('sent')")
    expect(filterScreen).toContain(
      'draftMailFilters.today = !draftMailFilters.today',
    )
    expect(source).toMatch(
      /\.mail-filters__content\s*\{[^}]*overflow-y:\s*auto/s,
    )
  })

  it('keeps the filtered empty state as only No Mail', () => {
    expect(source).toContain('<template v-if="hasActiveFilters">')
    expect(source).toContain("<h2>{{ phone.t('Apps.mail.noMail') }}</h2>")
    expect(source).not.toContain('mail.search || showUnreadOnly')
  })

  it('sends active filters through the paginated mail list contract', () => {
    expect(source).toContain('mail.setListFilters(mailFilters.value)')
    expect(mailServerSource).toContain('local function normalize_list_filters')
    expect(mailServerSource).toContain(
      'local filters = normalize_list_filters(data.filters)',
    )
    expect(mailServerSource).toContain('filters.read == "unread"')
    expect(mailServerSource).toContain('filters.address == "to-me"')
    expect(mailServerSource).toContain('m.`created_at` >= CURRENT_DATE()')
  })

  it('keeps authentication hints legible and placeholders muted', () => {
    expect(source).toMatch(
      /\.mail-auth__row input::placeholder\s*\{[^}]*color:\s*var\(--mail-muted\)[^}]*opacity:\s*0\.72/s,
    )
    expect(source).toMatch(
      /\.mail-auth__note\s*\{[^}]*color:\s*var\(--agent-text\)[^}]*font-size:\s*14px[^}]*font-weight:\s*500[^}]*line-height:\s*19px/s,
    )
    expect(source).toContain('<ShieldCheck :size="17" />')
  })

  it('uses icon actions in the new-message navbar', () => {
    const composeStart = source.indexOf('v-else-if="screen === \'compose\'"')
    const compose = source.slice(composeStart)

    expect(compose).toContain(':aria-label="phone.t(\'Common.cancel\')"')
    expect(compose).toContain('<X :size="21"')
    expect(compose).toContain(':aria-label="phone.t(\'Common.send\')"')
    expect(compose).toContain('<Send :size="20"')
    expect(source).toMatch(
      /\.mail-navbar\s*\{[^}]*--agent-safe-area-top:\s*calc\(46px \+ var\(--agent-space-2\)\)/s,
    )
    expect(source).not.toContain('deleteCurrentDraft')
    expect(source).not.toContain("phone.t('Apps.mail.deleteDraft')")
  })

  it('keeps mail rows and navbar actions geometrically stable', () => {
    expect(source).not.toContain(
      '.mail-row-shell:not(.is-dragging) .mail-row:hover',
    )
    expect(source).toMatch(
      /\.mail-row\s*\{[^}]*color:\s*var\(--agent-text\)[^}]*transition:\s*transform/s,
    )
    expect(source).toContain('class="mail-navbar__select"')
    expect(source).toMatch(
      /\.mail-navbar__select\.agent-link\)\s*\{[^}]*width:\s*auto[^}]*height:\s*var\(--agent-touch-target\)[^}]*padding:\s*0 var\(--agent-space-3\)[^}]*color:\s*#fff[^}]*font-size:\s*15px/s,
    )
    expect(source).toMatch(
      /\.mail-navbar__select\.agent-link:focus-visible\)\s*\{[^}]*outline:\s*0[^}]*box-shadow:\s*inset 0 0 0 1px #fff/s,
    )
    expect(source).toMatch(
      /\.agent-navbar-back-link__icon\)\s*\{[^}]*transform:\s*translateX\(2px\)/s,
    )
    expect(source).toMatch(
      /\.mail-navbar\s+:deep\(\.agent-link\)\s*\{[^}]*color:\s*#fff/s,
    )
    expect(source).toMatch(
      /\.mail-navbar\s+:deep\(\.agent-navbar-back-link\)\s*\{[^}]*color:\s*#fff/s,
    )
    expect(source).not.toMatch(
      /\.mail-navbar\s+:deep\(\.agent-link\)\s*\{[^}]*color:\s*var\(--mail-blue\)/s,
    )
  })
})

describe('MailMarkdownEditor Agent toolbar contract', () => {
  it('places formatting actions in a Agent toolbar instead of navigation', () => {
    expect(editorSource.indexOf('<EditorContent')).toBeLessThan(
      editorSource.indexOf('<AgentToolbar'),
    )
    expect(editorSource).toContain('class="mail-editor__tools"')
    expect(editorSource).toContain('<AgentToolbarPane')
    expect(editorSource.match(/<AgentButton\b/g)).toHaveLength(7)
    expect(editorSource).toContain('<AgentIcon')
    expect(editorSource).toContain(':aria-pressed="editor.isActive')
    expect(editorSource).not.toContain('<AgentTabBar')
    expect(editorSource).not.toContain('<AgentTabButton')
    expect(editorSource).toMatch(
      /\.mail-editor\s*\{[^}]*width:\s*100%[^}]*display:\s*flex[^}]*flex-direction:\s*column[^}]*overflow:\s*hidden/s,
    )
    expect(editorSource).toMatch(
      /\.mail-editor__content\s*\{[^}]*flex:\s*1[^}]*overflow-y:\s*auto/s,
    )
    expect(editorSource).toMatch(
      /\.mail-editor__tool--active\s*\{[^}]*background:\s*transparent[^}]*color:\s*var\(--agent-app-accent\)/s,
    )
    expect(editorSource).toMatch(
      /\.mail-editor__tools\s*\{[^}]*padding-right:\s*var\(--agent-space-3\)[^}]*padding-left:\s*var\(--agent-space-3\)/s,
    )
    expect(editorSource).toMatch(/:deep\(\.tiptap p\)\s*\{[^}]*margin:\s*0;/s)
    expect(editorSource).not.toContain(':deep(.tiptap p:last-child)')
  })
})

describe('Mail list toolbar styling contract', () => {
  it('keeps the outer action buttons on the same hairline as the search field', () => {
    expect(source).toMatch(
      /\.mail-list-toolbar\s+:deep\(\.agent-fab\)\s*\{[^}]*border:\s*1px solid var\(--agent-hairline\)/s,
    )
  })

  it('right-aligns the mailbox compose action and keeps folders compact', () => {
    expect(source).toMatch(
      /\.mail-folders-toolbar\s+:deep\(\.agent-toolbar__inner\)\s*\{[^}]*width:\s*100%[^}]*justify-content:\s*flex-end/s,
    )
    expect(source).toMatch(
      /\.mail-folders-toolbar\s+:deep\(\.agent-fab\)\s*\{[^}]*border:\s*1px solid var\(--agent-hairline\)/s,
    )
    expect(source).toMatch(/\.mail-folder-row\s*\{[^}]*min-height:\s*52px/s)
  })
})

describe('Mail custom mailbox server contract', () => {
  it('persists account-owned mailboxes and custom entry placement', () => {
    expect(migrationSource).toContain('name = "agent_phone_mailboxes"')
    expect(migrationSource).toContain(
      '{ name = "mailbox_id", type = "BIGINT UNSIGNED NULL" }',
    )
    expect(mailServerSource).toContain(
      'Bridge.Callbacks.Register("agent_phone:mail:create-mailbox"',
    )
    expect(mailServerSource).toContain(
      'Bridge.Callbacks.Register("agent_phone:mail:delete-mailbox"',
    )
    expect(mailServerSource).toContain(
      'Bridge.Callbacks.Register("agent_phone:mail:move"',
    )
    expect(mailServerSource).toContain('WHERE `id` = ? AND `account_id` = ?')
    expect(mailServerSource).toContain(
      'WHERE `id` = ? AND `account_id` = ? AND `trashed_at` IS NULL',
    )
  })

  it('exposes every mailbox callback through the client allowlist', () => {
    for (const endpoint of [
      'mail:mailboxes',
      'mail:create-mailbox',
      'mail:delete-mailbox',
      'mail:move',
    ]) {
      const callback = endpoint.slice('mail:'.length)
      expect(clientSource).toMatch(
        new RegExp(`mail\\s*=\\s*\\[\\[[^\\]]*(?:^|\\s)${callback}(?:\\s|\\]\\])`),
      )
    }
  })
})

function functionSource(name: string, nextName: string): string {
  const start = source.indexOf(`async function ${name}`)
  const end = source.indexOf(`async function ${nextName}`, start + 1)
  return source.slice(start, end)
}

describe('MailApp contact compose deep-link contract', () => {
  it('normalizes a compose=1 recipient only after mail authentication', () => {
    const consumeRequest = functionSource(
      'consumeContactComposeRequest',
      'closeCompose',
    )

    expect(source).toContain('const route = useRoute()')
    expect(source).toContain('const router = useRouter()')
    expect(consumeRequest).toContain(
      "if (!authenticated.value || route.query.compose !== '1') return",
    )
    expect(consumeRequest).toContain("typeof route.query.to === 'string'")
    expect(consumeRequest).toContain('normalizeMailAddress(route.query.to)')
    expect(consumeRequest).toContain(
      "beginCompose({ body: '', recipients: [requestedRecipient], subject: '' })",
    )
  })

  it('consumes the route after handling the request', () => {
    const consumeRequest = functionSource(
      'consumeContactComposeRequest',
      'closeCompose',
    )
    const composeIndex = consumeRequest.indexOf('beginCompose(')
    const replaceIndex = consumeRequest.indexOf(
      "await router.replace('/apps/mail')",
    )

    expect(replaceIndex).toBeGreaterThan(composeIndex)
  })

  it('retries the pending compose request after auth and on authenticated mount', () => {
    const submitAuth = functionSource('submitAuth', 'signOut')
    const mounted = source.slice(
      source.indexOf('onMounted(() => {'),
      source.indexOf('onBeforeUnmount(() => {'),
    )

    expect(submitAuth).toMatch(
      /if \(!response\.success\)[\s\S]*await consumeContactComposeRequest\(\)/,
    )
    expect(mounted).toContain('void consumeContactComposeRequest()')
    expect(source).toMatch(
      /watch\(authenticated,[\s\S]*isAuthenticated && !wasAuthenticated && !submitting\.value[\s\S]*consumeContactComposeRequest\(\)/,
    )
  })
})
