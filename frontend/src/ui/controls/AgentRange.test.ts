import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'

import AgentRange from '@/ui/controls/AgentRange.vue'

describe('AgentRange', () => {
  it('renders a native accessible range with the configured progress', async () => {
    const app = createSSRApp(AgentRange, {
      ariaLabel: 'Radio volume',
      ariaValueText: '25%',
      max: 100,
      min: 0,
      modelValue: 25,
      step: 1,
    })

    const html = await renderToString(app)

    expect(html).toContain('type="range"')
    expect(html).toContain('aria-label="Radio volume"')
    expect(html).toContain('aria-valuetext="25%"')
    expect(html).toContain('min="0"')
    expect(html).toContain('max="100"')
    expect(html).toContain('step="1"')
    expect(html).toContain('--agent-range-progress:25%')
  })

  it('integrates an optional caption without replacing the accessible name', async () => {
    const app = createSSRApp(AgentRange, {
      ariaLabel: 'Radio volume',
      caption: 'Volume',
      modelValue: 64,
    })

    const html = await renderToString(app)

    expect(html).toContain('agent-range--captioned')
    expect(html).toContain('class="agent-range__caption"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('Volume')
    expect(html).toContain('aria-label="Radio volume"')
  })

  it('keeps the Konsta glass hold state on enabled range thumbs', () => {
    const uiDirectory = fileURLToPath(new URL('..', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')
    const tokens = readFileSync(`${uiDirectory}/tokens.css`, 'utf8')

    expect(controls).toMatch(
      /\.agent-range__input:not\(:disabled\):active::-webkit-slider-thumb\s*\{[\s\S]*?--agent-range-hold-background[\s\S]*?--agent-glass-thumb-active-background[\s\S]*?--agent-range-hold-shadow[\s\S]*?--agent-shadow-thumb[\s\S]*?--agent-shadow-glass-thumb[\s\S]*?--agent-shadow-glass-thumb-glow[\s\S]*?--agent-hold-thumb-scale, 1\.4/,
    )
    expect(controls).toMatch(
      /\.agent-range__input:not\(:disabled\):focus-visible:active::-webkit-slider-thumb/,
    )
    expect(controls).not.toContain(
      '.agent-range__input:active::-webkit-slider-runnable-track',
    )
    expect(tokens).toContain('--agent-shadow-glass-thumb-glow')
  })

  it('keeps the native range above its enlarged pointer target', () => {
    const uiDirectory = fileURLToPath(new URL('..', import.meta.url))
    const controls = readFileSync(`${uiDirectory}/controls.css`, 'utf8')

    expect(controls).toMatch(
      /\.agent-range__input\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s,
    )
  })
})
