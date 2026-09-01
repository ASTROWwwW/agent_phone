import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./AgentRideApp.vue', import.meta.url),
  'utf8',
)
const types = readFileSync(
  new URL('../../types/agentride.ts', import.meta.url),
  'utf8',
)

describe('AgentRide app layout', () => {
  it('shows the server-authoritative ride distance in history', () => {
    expect(types).toContain('distanceMeters: number')
    expect(source).toContain('formatRideDistance(ride.distanceMeters)')
    expect(source).toContain('agentride-history-card__distance')
  })

  it('explains that requests require an online player driver', () => {
    expect(source).toContain("phone.t('Apps.agentride.playerDriverNotice')")
    expect(source).toContain('class="agentride-player-driver-notice"')
  })

  it('aligns rider and activity surfaces to one content width', () => {
    expect(source).toMatch(
      /\.agentride-location-list,\s*\.agentride-activity-list\s*\{[^}]*margin-inline:\s*2px !important;/s,
    )
    expect(source).toMatch(
      /\.agentride-home-panel\s*\{[^}]*background:\s*linear-gradient/s,
    )
  })

  it('scrolls Ride and Drive away without full-width nav backgrounds', () => {
    expect(source).toMatch(
      /\.agentride-navbar :deep\(\.agent-navbar__blur\),\s*\.agentride-navbar :deep\(\.agent-navbar__background\)\s*\{[^}]*display:\s*none;/s,
    )
    expect(source).toMatch(
      /<div class="agentride-scroll">\s*<div class="agentride-mode">/s,
    )
    expect(source).toMatch(
      /\.agentride-scroll\s*\{[^}]*box-sizing:\s*border-box;[^}]*inset:\s*114px 0 0;[^}]*padding:\s*0 0 116px;/s,
    )
    expect(source).toMatch(
      /\.agentride-tabbar :deep\(\.agent-tabbar__blur\),\s*\.agentride-tabbar :deep\(\.agent-tabbar__background\)\s*\{[^}]*display:\s*none;/s,
    )
    expect(source).not.toMatch(
      /\.agentride-tabbar :deep\(\.agent-tabbar__pane\)\s*\{\s*border:/s,
    )
  })

  it('keeps active-ride card spacing even and outline actions contrasted', () => {
    expect(source).toMatch(
      /\.agentride-ride-status-card\s*\{[^}]*margin-bottom:\s*12px;/s,
    )
    expect(source).toMatch(
      /\.agentride-person-card\s*\{[^}]*margin-bottom:\s*12px;/s,
    )
    expect(source).toMatch(
      /\.agentride-trip-card\s*\{[^}]*margin-bottom:\s*12px;/s,
    )
    expect(source).toContain('.agent-button--primary:not(.agent-button--outline)')
    expect(source).not.toMatch(
      /\.agentride-app :deep\(\.agent-button--primary\)\s*\{/,
    )
  })

  it('aligns pickup and destination text to one timeline axis', () => {
    expect(source).toMatch(
      /\.agentride-route-stop\s*\{[^}]*grid-template-columns:\s*18px minmax\(0, 1fr\);/s,
    )
    expect(source).toMatch(
      /\.agentride-route-stop > \.agentride-dot\s*\{[^}]*justify-self:\s*center;/s,
    )
    expect(source).toMatch(
      /\.agentride-trip-card > i\s*\{[^}]*margin:\s*1px 0 1px 8px;/s,
    )
  })

  it('uses a compact swipeable profile editor with equal actions', () => {
    expect(source).toContain('class="agentride-profile-sheet"')
    expect(source).toContain('swipe-to-close')
    expect(source).toContain('@swipeclose="closeProfileEditor"')
    expect(source).toMatch(
      /\.agentride-profile-sheet :deep\(\.agent-sheet__panel\)\s*\{[^}]*max-height:\s*78%;/s,
    )
    expect(source.match(/<AgentButton\s+block\s+large\s+rounded/g)).toHaveLength(
      2,
    )
    expect(source).toContain('agentride-profile-media-button')
  })
})
