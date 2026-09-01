import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./FeatherApp.vue', import.meta.url),
  'utf8',
)
const postCard = readFileSync(
  new URL('../../components/feather/FeatherPostCard.vue', import.meta.url),
  'utf8',
)

describe('FeatherApp Agent UI contract', () => {
  it('uses explicit Agent UI components without Konsta-style aliases', () => {
    expect(source).not.toContain("from 'konsta/vue'")
    expect(postCard).not.toContain("from 'konsta/vue'")
    expect(postCard).toContain('import { AgentButton, AgentGlass, AgentIcon }')
    expect(postCard).not.toMatch(/Agent[A-Za-z]+ as k[A-Za-z]+/)
    expect(postCard).not.toMatch(/<\/?k[A-Z]/)
    expect(source).not.toContain('AgentTabBar')
    expect(source).not.toContain('AgentTabButton')
    expect(source).not.toContain('AgentToolbarPane')
    expect(source).toContain('<AgentPillNavigation')
    expect(source).toContain('<AgentScrollArea')
    expect(source).toContain('with-tabbar')
  })

  it('uses shared liquid glass for the floating compose action', () => {
    expect(source).toMatch(
      /<AgentFab[\s\S]*?class="feather-compose-fab"[\s\S]*?variant="glass"/,
    )
  })

  it('gives likes and bookmarks a reduced-motion-safe pulse animation', () => {
    expect(postCard).toContain(
      "const reactionPulse = ref<'like' | 'bookmark' | null>(null)",
    )
    expect(postCard).toContain('@click.stop="react(\'like\')"')
    expect(postCard).toContain('@click.stop="react(\'bookmark\')"')
    expect(postCard).toContain("'is-pulsing': reactionPulse === 'like'")
    expect(postCard).toContain("'is-pulsing': reactionPulse === 'bookmark'")
    expect(postCard).toContain('@keyframes feather-reaction-pop')
    expect(postCard).toContain('@keyframes feather-reaction-ring')
    expect(postCard).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('keeps the post header actions visible and compact', () => {
    expect(postCard).toContain(
      ':aria-label="phone.t(\'Apps.feather.moreActions\')"',
    )
    expect(postCard).toMatch(
      /<AgentButton\s+icon-only\s+rounded\s+small\s+tonal\s+class="feather-more"/s,
    )
    expect(postCard).toMatch(
      /\.feather-follow\s*\{[^}]*--agent-app-accent:\s*var\(--feather-blue,[^}]*color:\s*var\(--feather-blue,/s,
    )
    expect(postCard).not.toMatch(
      /\.feather-follow\s*\{[^}]*--agent-app-accent:\s*transparent/s,
    )
    expect(postCard).toMatch(
      /\.feather-more\s*\{[^}]*width:\s*27px[^}]*height:\s*27px[^}]*border:\s*1px/s,
    )
  })

  it('keeps the composer below the iPhone header with compact actions', () => {
    expect(source).toContain("'feather-app--composer':")
    expect(source).toMatch(
      /\.feather-app--active\.feather-app--composer \.feather-navbar\s*\{[^}]*--agent-safe-area-top:\s*54px/s,
    )
    expect(source).toMatch(
      /\.feather-app--active\.feather-app--composer > \.feather-composer\s*\{[^}]*top:\s*112px[^}]*padding-top:\s*18px/s,
    )
    expect(source).toMatch(
      /\.feather-composer-close\s*\{[^}]*width:\s*32px[^}]*height:\s*32px/s,
    )
    expect(source).toMatch(
      /\.feather-composer-publish\s*\{[^}]*min-width:\s*52px[^}]*min-height:\s*28px/s,
    )
    expect(source).toMatch(
      /v-if="screen === 'composer'"[\s\S]*?variant="secondary"[\s\S]*?class="feather-composer-publish"/,
    )
    expect(source).toMatch(
      /v-else-if="screen === 'edit'"[\s\S]*?variant="plain"[\s\S]*?class="feather-edit__navbar-save"/,
    )
  })

  it('uses the shared draggable phone sheet for every post more menu', () => {
    expect(source).toContain('<AgentSheet')
    expect(source).toContain('function openPostMenu(post: FeatherPost)')
    expect(source).toContain('@menu="openPostMenu"')
    expect(source).toContain('@click="openPostMenu(post)"')
    expect(source).toContain('@backdropclick="closePostMenu"')
    expect(source).toMatch(
      /<div class="feather-post-menu">\s*<AgentSheet[\s\S]*?swipe-to-close/,
    )
    expect(source).toContain('swipe-to-close')
    expect(source).toContain('@swipeclose="closePostMenu"')
    expect(source).toContain('@grabberclick="closePostMenu"')
    expect(source).not.toContain('.feather-post-menu :deep(.agent-sheet__panel)')
    expect(source).toMatch(
      /\.feather-post-menu__action\s*\{[^}]*min-height:\s*46px[^}]*font-size:\s*12px/s,
    )
    expect(source).not.toContain('<AgentActionSheet')
  })

  it('renders compact Instagram-style comments with a bottom message bar', () => {
    expect(source).toContain('class="feather-comments"')
    expect(source).toContain('class="feather-comment"')
    expect(source).toContain("'feather-comment--reply'")
    expect(source).toContain('class="feather-comment__like"')
    expect(source).toContain('class="feather-comment-composer"')
    expect(source).toContain('<AgentMessagebar')
    expect(source).toContain('@click="reactComment(post)"')
    expect(source).toContain('@click="focusThreadReply(post)"')
    expect(source).not.toMatch(
      /<FeatherPostCard\s+v-for="post in feather\.thread\.replies"/,
    )
    expect(source).toMatch(
      /\.feather-comment\s*\{[^}]*grid-template-columns:\s*36px minmax\(0, 1fr\) 34px/s,
    )
    expect(source).toMatch(
      /\.feather-comment-composer\s*\{[^}]*border-top:\s*1px solid var\(--feather-border\)[^}]*border-radius:\s*0/s,
    )
  })

  it('returns to the profile tab navigation after closing its connection list', () => {
    expect(source).toContain(
      "const connectionReturnScreen = ref<'main' | 'profile'>('profile')",
    )
    expect(source).toContain(
      "connectionReturnScreen.value = screen.value === 'main' ? 'main' : 'profile'",
    )
    expect(source).toContain('screen.value = connectionReturnScreen.value')
  })

  it('uses a strong Explore filter and a dedicated Network follow control', () => {
    expect(source).toMatch(
      /<AgentSegmented[\s\S]*?class="feather-explore-tabs"[\s\S]*?rounded[\s\S]*?strong/,
    )
    expect(source).toContain(
      'class="feather-follow-button feather-network-person__follow"',
    )
    expect(source).toContain(':tonal="person.is_following"')
    expect(source).toMatch(
      /\.feather-network-person__follow\s*\{[^}]*min-width:\s*84px[^}]*min-height:\s*32px/s,
    )
    expect(source).not.toContain('feather-feed-add')
  })

  it('keeps profile suggestion content styles off the follow button', () => {
    expect(source).toContain(
      'class="feather-profile-suggestion__profile"',
    )
    expect(source).toMatch(
      /\.feather-app\.feather-app--active \.feather-profile-suggestion__profile\s*\{[^}]*width:\s*100%/s,
    )
    expect(source).not.toContain(
      '.feather-app.feather-app--active .feather-profile-suggestion > button',
    )
    expect(source).not.toContain(
      '.dark.feather-app .feather-profile-suggestion > button',
    )
  })

  it('keeps owner actions in the navbar and removes the profile media tab', () => {
    const profileStart = source.indexOf('class="feather-profile"')
    const tabsStart = source.indexOf(
      'class="feather-profile-tabs"',
      profileStart,
    )
    const profile = source.slice(profileStart, tabsStart)

    expect(profile).toContain('class="feather-profile__cover-title"')
    expect(profile).not.toContain('class="feather-profile__logout"')
    expect(source).toContain('class="feather-profile__logout"')
    expect(source).toContain(':aria-label="phone.t(\'Common.signOut\')"')
    expect(source).toContain('@click="logoutDialogOpen = true"')
    expect(profile).not.toContain('feather-profile-action--logout')
    expect(source).toMatch(
      /v-else-if="screen === 'edit'"[\s\S]*?icon-only[\s\S]*?class="feather-edit__navbar-save"[\s\S]*?<AgentSpinner v-if="busy"[\s\S]*?<Check v-else/,
    )
    expect(source).toMatch(
      /\.feather-edit__navbar-save\s*\{[^}]*width:\s*44px !important[^}]*height:\s*44px !important[^}]*border-radius:\s*50% !important[^}]*background:\s*transparent !important[^}]*box-shadow:\s*none/s,
    )
    expect(source).toContain("'feather-edit__navbar-back': screen === 'edit'")
    expect(source).toMatch(
      /\.feather-edit__navbar-back :deep\(\.agent-navbar-back-link__icon\)\s*\{[^}]*translateX\(2px\)/s,
    )
    expect(source).not.toContain("profileView === 'media'")
    expect(source).not.toContain("selectProfileView('media')")
    expect(source).toMatch(
      /\.feather-profile__cover-title\s*\{[^}]*color:\s*#fff/s,
    )
    expect(source).toMatch(
      /\.feather-app--active \.feather-profile__logout\s*\{[^}]*--agent-app-accent:\s*#fff/s,
    )
  })

  it('keeps suggestion profile geometry off the follow button', () => {
    expect(source).toContain('<AgentScrollRail')
    expect(source).toContain('class="feather-profile-suggestions__rail"')
    expect(source).toContain(':label="t(\'people\')"')
    expect(source).toContain('class="feather-profile-suggestion__profile"')
    expect(source).toMatch(
      /\.feather-app\.feather-app--active \.feather-profile-suggestion__profile\s*\{[^}]*width:\s*100%/s,
    )
    expect(source).toMatch(
      /\.feather-app\.feather-app--active[\s\S]*?\.feather-profile-suggestion[\s\S]*?> :deep\(\.agent-button\)\s*\{[^}]*width:\s*auto/s,
    )
    expect(source).not.toContain(
      '.feather-profile-suggestion > button',
    )
    expect(source).toMatch(
      /\.feather-profile-suggestions__rail::-webkit-scrollbar\s*\{[^}]*display:\s*block[^}]*height:\s*5px/s,
    )
  })
})
