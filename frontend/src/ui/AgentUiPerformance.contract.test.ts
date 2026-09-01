import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

function performanceRules(css: string): string {
  const rules: string[] = []
  const pattern = /([^{}]+)\{([^{}]*)\}/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(css)) !== null) {
    if (match[1].includes('.phone-app--performance')) rules.push(match[0])
  }

  return rules.join('\n')
}

describe('Agent UI graphics modes', () => {
  const mainCss = readFileSync(
    fileURLToPath(new URL('../assets/main.css', import.meta.url)),
    'utf8',
  )
  const performanceCss = performanceRules(mainCss)
  const controlsCss = readFileSync(
    fileURLToPath(new URL('./controls.css', import.meta.url)),
    'utf8',
  )
  const controlCenterSource = readFileSync(
    fileURLToPath(new URL('../components/PhoneControlCenter.vue', import.meta.url)),
    'utf8',
  )
  const appModeConsumers = [
    '../components/SpringboardWidget.vue',
    '../views/apps/AppStoreApp.vue',
    '../views/apps/AppStoreDetail.vue',
    '../views/apps/MusicApp.vue',
  ]
    .map((path) =>
      readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8'),
    )
    .join('\n')

  it('keeps Performance glass solid and blur-free', () => {
    expect(performanceCss).toContain('--agent-glass: var(--agent-glass-solid)')
    expect(performanceCss).not.toContain(
      '--agent-glass-solid: var(--phone-performance-glass)',
    )
    expect(performanceCss).toContain('--agent-navbar-glass: var(--agent-bg)')
    expect(performanceCss).toContain('--agent-shadow-glass: none')
    expect(performanceCss).toContain('backdrop-filter: none !important')
    expect(performanceCss).toContain('-webkit-backdrop-filter: none !important')
    expect(performanceCss).toMatch(
      /\.phone-app--performance \.k-glass\s*\{[^}]*box-shadow:\s*none !important[^}]*\}/s,
    )
    expect(performanceCss).not.toMatch(
      /\.phone-app--performance \.k-glass\s*\{[^}]*background(?:-color)?:/s,
    )
    expect(performanceCss).toMatch(
      /\.k-glass:where\(\[class~='bg-ios-light-glass'\]\)\s*\{[^}]*background:\s*var\(--phone-performance-glass\) !important/s,
    )
    expect(performanceCss).not.toContain("[class~='dark:bg-ios-dark-glass']")
    expect(controlCenterSource).toContain("bgIos: 'bg-[#5e5ce6]'")
    expect(controlCenterSource).not.toContain(
      "bgIos: 'bg-ios-light-glass bg-[#5e5ce6]'",
    )
  })

  it('removes Range and Toggle hold glass only inside Performance mode', () => {
    expect(performanceCss).toContain('--agent-hold-thumb-scale: 1')
    expect(performanceCss).toContain('--agent-range-hold-background: #ffffff')
    expect(performanceCss).toContain(
      '--agent-range-hold-shadow: var(--agent-shadow-thumb)',
    )
    expect(performanceCss).toContain('--agent-toggle-hold-background: #ffffff')
    expect(performanceCss).toContain('--agent-toggle-hold-glass-opacity: 0')
    expect(performanceCss).toContain('--agent-toggle-hold-glow-opacity: 0')
    expect(performanceCss).toContain('--agent-toggle-hold-track-scale: 1')
    expect(performanceCss).toContain(
      '.phone-app--performance .agent-glass--touch-highlight',
    )
    expect(performanceCss).toContain(
      '.phone-app--performance .agent-glass--highlight-visible::after',
    )
    expect(performanceCss).not.toContain("[class~='rounded-[inherit]']")
    expect(performanceCss).toContain(
      "[class~='group-has-[input:active]/range:scale-[1.4]']",
    )
    expect(performanceCss).toContain("[class~='group-active:scale-[1.4]']")
    expect(performanceCss).toContain("[class~='group-active:opacity-100']")
    expect(performanceCss).not.toMatch(/(?:^|[;{])\s*scale\s*:/m)
    expect(performanceCss).toContain('--tw-scale-x: 1 !important')
    expect(performanceCss).toContain('var(--tw-translate-x, 0)')
    expect(performanceCss).toContain('var(--tw-translate-y, 0)')
    expect(performanceCss).toContain('scale(1) !important')
  })

  it('does not globally disable functional motion or focus styling', () => {
    const universalPerformanceRule = performanceCss.match(
      /\.phone-app--performance,\s*\.phone-app--performance \*,\s*\.phone-app--performance \*::before,\s*\.phone-app--performance \*::after\s*\{([^}]*)\}/,
    )?.[1]

    expect(universalPerformanceRule).toBeDefined()
    expect(universalPerformanceRule).not.toMatch(
      /(?:^|;)\s*(?:animation|box-shadow|opacity|transform|transition)\s*:/,
    )
  })

  it('keeps pill navigation solid in Performance and glass in Ultimate', () => {
    expect(performanceCss).toMatch(
      /\.phone-app--performance \.agent-segmented--navigation\s*\{[^}]*background:\s*var\(--agent-glass-solid\)[^}]*box-shadow:\s*none/s,
    )
    expect(performanceCss).toMatch(
      /\.phone-app--performance \.agent-segmented--navbar\s*\{[^}]*background:\s*var\(--agent-glass-solid\)[^}]*box-shadow:\s*none/s,
    )
    expect(controlsCss).toMatch(
      /\.agent-glass\s*\{[^}]*background:\s*var\(--agent-glass-solid[^}]*box-shadow:\s*var\(--agent-shadow-glass\)/s,
    )
    expect(controlsCss).toContain('@supports (')
    expect(controlsCss).toContain('backdrop-filter: blur(16px)')
    expect(controlsCss).toContain(
      'background: var(--agent-glass, rgba(255, 255, 255, 0.75))',
    )
  })

  it('keeps app-specific effect choices behind shared semantic markers', () => {
    expect(appModeConsumers).not.toContain(':global(.phone-app--performance)')
    expect(appModeConsumers).not.toContain(
      '[`phone-app--${phone.preferences.settings.graphicsMode}`]',
    )
    expect(appModeConsumers).toContain('phone-effect--expensive-shadow')
    expect(appModeConsumers).toContain('phone-effect--decorative')
    expect(appModeConsumers).toContain('phone-effect--solid-surface')
    expect(performanceCss).toContain(
      '.phone-app--performance .phone-effect--expensive-shadow',
    )
    expect(performanceCss).toMatch(
      /\.phone-app--performance \.phone-effect--solid-surface\s*\{[^}]*background:\s*var\(/s,
    )
  })
})
