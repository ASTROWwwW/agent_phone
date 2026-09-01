import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { resourceUrl } from '../../testing/resource'

const source = readFileSync(new URL('./GarageApp.vue', import.meta.url), 'utf8')
const garageServer = readFileSync(
  resourceUrl('source/server/garage.lua'),
  'utf8',
)
const phoneConfig = readFileSync(
  resourceUrl('config/config.lua'),
  'utf8',
)

describe('GarageApp Agent UI contract', () => {
  it('uses first-party Agent UI without direct Konsta markup', () => {
    expect(source).not.toContain("from 'konsta/vue'")
    expect(source).not.toMatch(/<\/?k-[a-z]/)
    expect(source).toContain('<AgentAppPage')
    expect(source).toContain('<AgentNavbar')
    expect(source).toContain('<AgentScrollArea')
    expect(source).toContain('<AgentSearchbar')
    expect(source).toContain('<AgentSegmented')
    expect(source).toContain('<AgentGlass')
  })

  it('does not expose provider metadata or vehicle sharing', () => {
    expect(source).not.toContain('useEasyShareStore')
    expect(source).not.toContain('shareVehicle')
    expect(source).not.toContain('Apps.garage.provider')
    expect(source).not.toContain('overview.system')
  })

  it('raises the Garage title and subtitle when no navbar action exists', () => {
    expect(source).toContain('class="garage-navbar"')
    expect(source).toMatch(
      /\.garage-navbar :deep\(\.agent-navbar__title-container > div\)\s*\{[^}]*translateY\(-30px\)/s,
    )
  })

  it('centers filter labels and counters inside their segmented controls', () => {
    expect(source).toMatch(
      /\.garage-filters :deep\(button\)\s*\{[^}]*height: 36px;[^}]*align-items: center;[^}]*line-height: 1;/s,
    )
    expect(source).toMatch(
      /\.garage-filters span,\s*\.garage-filters small\s*\{[^}]*height: 18px;[^}]*align-items: center;[^}]*line-height: 1;/s,
    )
  })

  it('uses configurable vehicle imagery with an icon fallback', () => {
    expect(source).toContain('vehicleImageUrl(vehicle)')
    expect(source).toContain('@error="useVehicleIcon(vehicle)"')
    expect(source).toContain('v-else :is="kindIcons[vehicle.kind]"')
    expect(garageServer).toContain('imageUrl = vehicle_image_url(model)')
    expect(phoneConfig).toContain(
      'UrlTemplate = "https://docs.fivem.net/vehicles/{model}.webp"',
    )
    expect(phoneConfig).toContain('ModelNames = {}')
  })

  it('uses the draggable Agent sheet instead of a close button', () => {
    expect(source).toContain('swipe-to-close')
    expect(source).toContain('grabber-clickable')
    expect(source).toContain('@swipeclose="selectedVehicle = null"')
    expect(source).not.toContain('garage-detail__close')
  })
})
