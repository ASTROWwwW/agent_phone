import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import type { WeatherConditionId } from '@/types/weather'

const source = readFileSync(
  new URL('./WeatherApp.vue', import.meta.url),
  'utf8',
)
const styles = readFileSync(
  new URL('../../assets/main.css', import.meta.url),
  'utf8',
)

const CONDITIONS: WeatherConditionId[] = [
  'sunny',
  'clear',
  'partly_cloudy',
  'cloudy',
  'rain',
  'thunder',
  'fog',
  'snow',
]

describe('WeatherApp layout contract', () => {
  it('preserves its exact custom forecast gutter instead of generic page padding', () => {
    expect(source).toMatch(
      /<SkyScrollArea[\s\S]*?class="weather-scroll"[\s\S]*?>/,
    )
    expect(source).toMatch(
      /\.weather-scroll\s*\{\s*padding:\s*4px 14px 24px;\s*\}/,
    )
    expect(source).not.toMatch(
      /<SkyScrollArea[\s\S]*?class="weather-scroll"[\s\S]*?\spadded(?:\s|=)[\s\S]*?>/,
    )
  })

  it('gives every weather condition its own backdrop', () => {
    for (const condition of CONDITIONS) {
      expect(
        styles,
        `la condition ${condition} n'a pas de decor`,
      ).toContain(`.weather-app--${condition} .weather-app__backdrop {`)
    }
  })

  it('paints night as a veil over the condition rather than duplicating each decor', () => {
    expect(styles).toMatch(
      /\.weather-app--night \.weather-app__backdrop::before\s*\{[\s\S]*?content:\s*'';/,
    )
    for (const condition of CONDITIONS) {
      expect(
        styles,
        `${condition} a une variante de nuit dediee, le voile suffit`,
      ).not.toContain(
        `.weather-app--night.weather-app--${condition} .weather-app__backdrop`,
      )
    }
  })

  it('builds the detail tiles on the shared surface token', () => {
    expect(styles).toMatch(
      /\.weather-details\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,/,
    )
    expect(styles).toMatch(
      /\.weather-tile\s*\{[\s\S]*?background:\s*var\(--weather-surface\);/,
    )
    expect(styles).toMatch(
      /\.weather-hourly\s*\{[\s\S]*?background:\s*var\(--weather-surface\);/,
    )
  })

  it('marks the current hour with a filled pill instead of column separators', () => {
    expect(styles).toMatch(/\.weather-hour\.is-now\s*\{[\s\S]*?background:/)
    expect(styles).not.toMatch(/\.weather-hour\s*\{[\s\S]*?border-left:/)
    expect(source).toMatch(/:class="\{ 'is-now': index === 0 \}"/)
  })

  it('reserves the rain line even when no shower is forecast', () => {
    // Sans hauteur reservee, une colonne sans averse remonte et la ligne des
    // temperatures se casse en escalier.
    expect(styles).toMatch(/\.weather-hour__rain\s*\{[\s\S]*?height:\s*\d+px;/)
  })

  it('drops the blur on the surfaces in performance mode', () => {
    expect(styles).toMatch(
      /\.phone-app--performance \.weather-tile,[\s\S]*?backdrop-filter:\s*none;/,
    )
  })
})
