import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAgentRideStore } from '@/stores/agentride'
import type {
  AgentRideBootstrap,
  AgentRideLocation,
  AgentRideQuote,
  AgentRideRide,
} from '@/types/agentride'
import { nuiCall } from '@/utils/nui'

vi.mock('@/utils/nui', () => ({ nuiCall: vi.fn() }))

const mockNuiCall = vi.mocked(nuiCall)
const pickup: AgentRideLocation = {
  coords: { x: -1037.7, y: -2737.8, z: 20.1 },
  label: 'Los Santos International',
}
const destination: AgentRideLocation = {
  coords: { x: 215.8, y: -810.1, z: 30.7 },
  label: 'Pillbox Hill',
}
const ride: AgentRideRide = {
  createdAt: 1_755_000_000,
  currency: '$',
  destination,
  distanceMeters: 5_200,
  driver: null,
  durationSeconds: 640,
  id: 'ride-1',
  pickup,
  price: 48,
  serviceClass: 'comfort',
  status: 'searching',
  updatedAt: 1_755_000_000,
}
const bootstrap: AgentRideBootstrap = {
  activeRide: null,
  availableRequests: [ride],
  driverEligible: true,
  driverOnline: false,
  history: [],
  pendingRating: null,
  profile: {
    acceptanceRate: 94,
    avatarMediaId: null,
    avatarUrl: null,
    cancelledRides: 2,
    completedRides: 128,
    currency: '$',
    defaultPaymentMethod: 'Bank',
    earningsToday: 320,
    id: 'profile-1',
    memberSince: 1_700_000_000,
    name: 'Alex Morgan',
    rating: 4.9,
  },
  quickLocations: [destination],
}
const quote: AgentRideQuote = {
  destination,
  distance: 5.2,
  distanceMeters: 5200,
  distanceUnit: 'kilometer',
  durationSeconds: 640,
  expiresAt: 1_755_000_120,
  options: [
    {
      available: true,
      calculatedPrice: 48,
      currency: '$',
      etaMinutes: 4,
      fareMode: 'calculated',
      maximumCustomPrice: 144,
      minimumCustomPrice: 24,
      price: 48,
      pricePerDistanceUnit: 24,
      quoteId: 'quote-comfort',
      seats: 4,
      serviceClass: 'comfort',
    },
  ],
  pickup,
}

describe('AgentRide store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockNuiCall.mockReset()
  })

  it('hydrates the complete server-authoritative snapshot', async () => {
    mockNuiCall.mockResolvedValueOnce({ data: bootstrap, success: true })
    const agentride = useAgentRideStore()
    agentride.quote = quote

    expect(await agentride.bootstrap()).toBe(true)
    expect(agentride.profile).toEqual(bootstrap.profile)
    expect(agentride.driverEligible).toBe(true)
    expect(agentride.availableRequests).toEqual([ride])
    expect(agentride.quote).toBeNull()
    expect(mockNuiCall).toHaveBeenCalledWith('agentride:bootstrap')
  })

  it('requests a quote with pickup and destination coordinates', async () => {
    mockNuiCall.mockResolvedValueOnce({ data: quote, success: true })
    const agentride = useAgentRideStore()

    expect((await agentride.createQuote(pickup, destination)).success).toBe(true)
    expect(agentride.quote).toEqual(quote)
    expect(mockNuiCall).toHaveBeenCalledWith('agentride:quote', {
      destination,
      pickup,
    })
  })

  it('updates the editable profile with an owned media id', async () => {
    const updatedProfile = {
      ...bootstrap.profile,
      avatarMediaId: 17,
      avatarUrl: 'https://example.test/avatar.webp',
      name: 'Jordan Sky',
    }
    mockNuiCall.mockResolvedValueOnce({
      data: { profile: updatedProfile },
      success: true,
    })
    const agentride = useAgentRideStore()
    agentride.profile = bootstrap.profile

    const response = await agentride.updateProfile({
      avatarMediaId: 17,
      name: 'Jordan Sky',
    })

    expect(response.success).toBe(true)
    expect(agentride.profile).toEqual(updatedProfile)
    expect(mockNuiCall).toHaveBeenCalledWith('agentride:update-profile', {
      avatarMediaId: 17,
      name: 'Jordan Sky',
    })
  })

  it('books with the opaque quote id and never sends a client price', async () => {
    mockNuiCall.mockResolvedValueOnce({
      data: { activeRide: ride },
      success: true,
    })
    const agentride = useAgentRideStore()
    agentride.quote = quote

    const response = await agentride.requestRide(quote.options[0])

    expect(response.success).toBe(true)
    expect(agentride.activeRide).toEqual(ride)
    expect(agentride.quote).toBeNull()
    expect(mockNuiCall).toHaveBeenCalledWith('agentride:request', {
      quoteId: 'quote-comfort',
    })
  })

  it('asks the server to bind a validated own price to a new quote', async () => {
    const customQuote = {
      ...quote,
      options: [
        {
          ...quote.options[0],
          fareMode: 'custom' as const,
          price: 60,
          quoteId: 'quote-comfort-custom',
        },
      ],
    }
    mockNuiCall.mockResolvedValueOnce({ data: customQuote, success: true })
    const agentride = useAgentRideStore()

    await agentride.createQuote(pickup, destination, {
      price: 60,
      serviceClass: 'comfort',
    })

    expect(mockNuiCall).toHaveBeenCalledWith('agentride:quote', {
      customFare: { price: 60, serviceClass: 'comfort' },
      destination,
      pickup,
    })
  })

  it('preserves the active ride when a lifecycle action is rejected', async () => {
    mockNuiCall.mockResolvedValueOnce({
      error: 'ride_state_changed',
      success: false,
    })
    const agentride = useAgentRideStore()
    agentride.activeRide = ride

    await agentride.performRideAction('start', ride.id)

    expect(agentride.activeRide).toEqual(ride)
    expect(agentride.error).toBe('ride_state_changed')
  })

  it('applies live snapshots including an explicit cleared ride', () => {
    const agentride = useAgentRideStore()
    agentride.activeRide = ride
    agentride.driverOnline = false

    agentride.applyUpdate({ activeRide: null, driverOnline: true })

    expect(agentride.activeRide).toBeNull()
    expect(agentride.driverOnline).toBe(true)
  })

  it('submits rating details and clears the pending rating on success', async () => {
    mockNuiCall.mockResolvedValueOnce({
      data: { history: [{ ...ride, status: 'completed' }] },
      success: true,
    })
    const agentride = useAgentRideStore()
    agentride.pendingRating = { ...ride, status: 'completed' }

    await agentride.rateRide(ride.id, 5, 10, 'Excellent')

    expect(agentride.pendingRating).toBeNull()
    expect(mockNuiCall).toHaveBeenCalledWith('agentride:rate', {
      comment: 'Excellent',
      rating: 5,
      rideId: ride.id,
      tip: 10,
    })
  })
})
