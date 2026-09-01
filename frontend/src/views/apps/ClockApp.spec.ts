import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const clockView = readFileSync(
  new URL('./ClockApp.vue', import.meta.url),
  'utf8',
)
const alarmEditorView = readFileSync(
  new URL('../../components/AlarmEditor.vue', import.meta.url),
  'utf8',
)
const mainCss = readFileSync(
  new URL('../../assets/main.css', import.meta.url),
  'utf8',
)

describe('Clock app controls', () => {
  it('only renders a title navbar for the alarm tab', () => {
    expect(clockView.match(/<agent-navbar/g)).toHaveLength(1)
    expect(clockView).toContain('v-if="tab === \'alarm\'"')
    expect(clockView).toContain('class="clock-navbar clock-navbar--alarm"')
    expect(clockView).toContain('variant="large"')
    expect(clockView).not.toContain('v-else-if="tab !== \'stopwatch\'"')
    expect(mainCss).toMatch(
      /\.clock-navbar\.agent-navbar\s*\{[^}]*--agent-navbar-safe-area-top:\s*var\(--agent-space-2\);/s,
    )
    expect(mainCss).not.toContain('.clock-navbar.agent-navbar--no-navigation')
  })

  it('opens on the alarms, the wall clock tab having been removed', () => {
    expect(clockView).toContain("? route.query.section")
    expect(clockView).toContain(": 'alarm',")
    expect(clockView).not.toContain('clock-world')
    expect(clockView).not.toContain("'world'")
    expect(mainCss).not.toContain('.clock-world')
  })

  it('uses the orange clock accent and state-specific circular actions', () => {
    expect(clockView).toContain('accent="#ff9f0a"')
    expect(clockView).toContain('clock-action-button--start')
    expect(clockView).toContain('clock-action-button--stop')
    expect(clockView).toContain('<Play')
    expect(clockView).toContain('<Pause')
  })

  it('uses the shared full-width Agent tab bar', () => {
    expect(clockView).toContain('<agent-tab-bar')
    expect(clockView).toContain('<agent-tab-button')
    expect(clockView).not.toContain('<agent-segmented')
  })

  it('does not nest a second AgentBlock around the timer layout', () => {
    expect(clockView).toContain(
      '<section v-else class="clock-tool clock-timer">',
    )
    expect(clockView).not.toContain(
      '<agent-block v-else nested class="clock-tool clock-timer">',
    )
    expect(mainCss).toMatch(
      /\.clock-timer\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*align-items:\s*center;/s,
    )
    expect(mainCss).toMatch(/\.clock-timer-actions\s*\{[^}]*width:\s*100%;/s)
    expect(mainCss).toMatch(/\.clock-timer-settings\s*\{[^}]*width:\s*100%;/s)
  })

  it('keeps the stopwatch single-page and separates alarm actions', () => {
    expect(clockView).not.toContain('clock-stopwatch-pages')
    expect(clockView).not.toContain('clock-stopwatch-page')
    expect(clockView).toMatch(
      /<template #left>[\s\S]*?clock-navbar-action--icon[\s\S]*?<\/template>\s*<template #right>[\s\S]*?clock-navbar-action--edit/,
    )
    expect(clockView).not.toContain('clock-navbar-actions')
    expect(clockView).toMatch(
      /<agent-button\s+v-if="alarmsEditing"[\s\S]*?icon-only[\s\S]*?class="clock-alarm-remove"/,
    )
    expect(mainCss).toMatch(
      /\.clock-navbar--alarm \.agent-navbar__inner\s*\{[^}]*margin-bottom:\s*0;/s,
    )
    expect(mainCss).toMatch(
      /\.clock-navbar--alarm \.agent-navbar__left\.agent-glass-surface,\s*\.clock-navbar--alarm \.agent-navbar__right\.agent-glass-surface\s*\{/s,
    )
    expect(mainCss).not.toMatch(/\.clock-navbar--alarm\s*\{[^}]*margin-top:/s)
    expect(mainCss).toMatch(
      /\.clock-content\s*\{[^}]*--agent-block-gutter-left:\s*0px;[^}]*--agent-block-gutter-right:\s*0px;/s,
    )
    expect(mainCss).toMatch(
      /\.clock-stopwatch\s*\{[^}]*--agent-block-gutter-left:\s*calc\(\s*var\(--agent-page-gutter\) \+ var\(--agent-safe-area-left\)\s*\);[^}]*--agent-block-gutter-right:\s*calc\(\s*var\(--agent-page-gutter\) \+ var\(--agent-safe-area-right\)\s*\);/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-item > \.agent-toggle\s*\{[^}]*grid-column:\s*3;[^}]*justify-self:\s*end;/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-remove\.agent-button--icon-only\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*min-height:\s*28px;[^}]*padding:\s*0;[^}]*border-radius:\s*50%;/s,
    )
  })

  it('opens the alarm editor as a compact Agent sheet over the alarm page', () => {
    expect(clockView).toMatch(/<AlarmEditor\s+v-if="alarmEditor"/)
    expect(clockView).not.toContain('v-else-if="alarmEditor"')
    expect(alarmEditorView).toContain('<k-sheet')
    expect(alarmEditorView).toContain(':show-grabber="false"')
    expect(alarmEditorView).toContain('swipe-to-close')
    expect(alarmEditorView).toContain('data-agent-sheet-drag-handle')
    expect(alarmEditorView).toContain(
      '<k-scroll-area padded class="clock-alarm-editor">',
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-sheet \.agent-sheet__panel\s*\{[^}]*height:\s*calc\(\s*100% - var\(--agent-safe-area-top\) - var\(--agent-space-2\)\s*\);[^}]*overflow:\s*hidden;[^}]*border-radius:\s*var\(--agent-radius-sheet\) var\(--agent-radius-sheet\) 0 0;[^}]*background:\s*var\(--agent-sheet-background\);/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-sheet\s*\{[^}]*--agent-sheet-background:\s*#1c1c1d;/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-sheet \.agent-sheet__grabber\s*\{[^}]*display:\s*none;/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-sheet-surface\s*\{[^}]*height:\s*100%;[^}]*border-radius:\s*var\(--agent-radius-sheet\) var\(--agent-radius-sheet\) 0 0;[^}]*background:\s*var\(--agent-sheet-background\);/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-sheet-navbar\.agent-navbar,[\s\S]*?\.clock-alarm-sheet-surface > \.agent-navbar\s*\{[^}]*--agent-navbar-safe-area-top:\s*var\(--agent-space-3\);/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-sheet-navbar \.agent-navbar__blur,[\s\S]*?\.clock-alarm-sheet-navbar \.agent-navbar__background\s*\{[^}]*background:\s*transparent;/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-save\.agent-link\s*\{[^}]*background:\s*#ff9f0a;[^}]*color:\s*#fff;/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-editor\.agent-scroll-area--padded\s*\{[^}]*--agent-page-gutter:\s*12px;/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-editor \.time-wheel-picker\s*\{[^}]*width:\s*100%;[^}]*margin-right:\s*0;[^}]*margin-left:\s*0;/s,
    )
    expect(mainCss).toMatch(
      /\.clock-alarm-editor \.agent-list--strong,[\s\S]*?\.clock-alarm-editor \.agent-list--inset\s*\{[^}]*background:\s*#2c2c2e;/s,
    )
  })
})
