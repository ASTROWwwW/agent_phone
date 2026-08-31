import { defineStore } from 'pinia'

import type {
  AgentRideBootstrap,
  AgentRideCoordinates,
  AgentRideCustomFareInput,
  AgentRideHistoryResponse,
  AgentRideLocation,
  AgentRideQuote,
  AgentRideQuoteOption,
  AgentRideRide,
  AgentRideProfileInput,
  AgentRideStateUpdate,
} from '@/types/agentride'
import { nuiCall, type NuiResponse } from '@/utils/nui'

type RideAction = 'accept' | 'arrive' | 'start' | 'complete'

export const useAgentRideStore = defineStore('agentride', {
  state: () => ({
    activeRide: null as AgentRideRide | null,
    availableRequests: [] as AgentRideRide[],
    driverEligible: false,
    driverOnline: false,
    error: '',
    history: [] as AgentRideRide[],
    isActionPending: false,
    isLoading: false,
    pendingRating: null as AgentRideRide | null,
    profile: null as AgentRideBootstrap['profile'] | null,
    quickLocations: [] as AgentRideLocation[],
    quote: null as AgentRideQuote | null,
  }),
  actions: {
    applyUpdate(update: AgentRideStateUpdate): void {
      if (update.activeRide !== undefined) this.activeRide = update.activeRide
      if (update.availableRequests !== undefined)
        this.availableRequests = update.availableRequests
      if (update.driverOnline !== undefined)
        this.driverOnline = update.driverOnline
      if (update.history !== undefined) this.history = update.history
      if (update.pendingRating !== undefined)
        this.pendingRating = update.pendingRating
      if (update.profile !== undefined) this.profile = update.profile
    },
    async bootstrap(): Promise<boolean> {
      this.isLoading = true
      const response = await nuiCall<AgentRideBootstrap>('agentride:bootstrap')
      this.isLoading = false
      if (!response.success || !response.data) {
        this.error = response.error ?? 'request_failed'
        return false
      }

      this.activeRide = response.data.activeRide
      this.availableRequests = response.data.availableRequests
      this.driverEligible = response.data.driverEligible
      this.driverOnline = response.data.driverOnline
      this.history = response.data.history
      this.pendingRating = response.data.pendingRating
      this.profile = response.data.profile
      this.quickLocations = response.data.quickLocations
      this.quote = null
      this.error = ''
      return true
    },
    async loadHistory(): Promise<boolean> {
      const response = await nuiCall<AgentRideHistoryResponse>('agentride:history')
      if (!response.success || !response.data) {
        this.error = response.error ?? 'request_failed'
        return false
      }
      this.history = response.data.items
      this.error = ''
      return true
    },
    async updateProfile(
      profile: AgentRideProfileInput,
    ): Promise<NuiResponse<AgentRideStateUpdate>> {
      this.isActionPending = true
      const response = await nuiCall<AgentRideStateUpdate>(
        'agentride:update-profile',
        profile,
      )
      this.isActionPending = false
      if (response.success) {
        if (response.data) this.applyUpdate(response.data)
        this.error = ''
      } else {
        this.error = response.error ?? 'request_failed'
      }
      return response
    },
    async createQuote(
      pickup: AgentRideLocation,
      destination: AgentRideLocation,
      customFare?: AgentRideCustomFareInput,
    ): Promise<NuiResponse<AgentRideQuote>> {
      this.isActionPending = true
      const response = await nuiCall<AgentRideQuote>('agentride:quote', {
        ...(customFare ? { customFare } : {}),
        destination,
        pickup,
      })
      this.isActionPending = false
      if (response.success && response.data) {
        this.quote = response.data
        this.error = ''
      } else {
        this.error = response.error ?? 'request_failed'
      }
      return response
    },
    async requestRide(
      option: Pick<AgentRideQuoteOption, 'quoteId'>,
    ): Promise<NuiResponse<AgentRideStateUpdate>> {
      this.isActionPending = true
      const response = await nuiCall<AgentRideStateUpdate>('agentride:request', {
        quoteId: option.quoteId,
      })
      this.isActionPending = false
      if (response.success) {
        if (response.data) this.applyUpdate(response.data)
        this.quote = null
        this.error = ''
      } else {
        this.error = response.error ?? 'request_failed'
      }
      return response
    },
    async setDriverStatus(
      online: boolean,
    ): Promise<NuiResponse<AgentRideStateUpdate>> {
      this.isActionPending = true
      const response = await nuiCall<AgentRideStateUpdate>(
        'agentride:set-driver-status',
        { online },
      )
      this.isActionPending = false
      if (response.success) {
        this.driverOnline = response.data?.driverOnline ?? online
        if (response.data) this.applyUpdate(response.data)
        this.error = ''
      } else {
        this.error = response.error ?? 'request_failed'
      }
      return response
    },
    async performRideAction(
      action: RideAction,
      rideId: string,
    ): Promise<NuiResponse<AgentRideStateUpdate>> {
      this.isActionPending = true
      const response = await nuiCall<AgentRideStateUpdate>(`agentride:${action}`, {
        rideId,
      })
      this.isActionPending = false
      if (response.success) {
        if (response.data) this.applyUpdate(response.data)
        this.error = ''
      } else {
        this.error = response.error ?? 'request_failed'
      }
      return response
    },
    async cancelRide(
      rideId: string,
      reason?: string,
    ): Promise<NuiResponse<AgentRideStateUpdate>> {
      this.isActionPending = true
      const response = await nuiCall<AgentRideStateUpdate>('agentride:cancel', {
        rideId,
        ...(reason ? { reason } : {}),
      })
      this.isActionPending = false
      if (response.success) {
        if (response.data) this.applyUpdate(response.data)
        this.error = ''
      } else {
        this.error = response.error ?? 'request_failed'
      }
      return response
    },
    async rateRide(
      rideId: string,
      rating: number,
      tip: number,
      comment: string,
    ): Promise<NuiResponse<AgentRideStateUpdate>> {
      this.isActionPending = true
      const response = await nuiCall<AgentRideStateUpdate>('agentride:rate', {
        comment,
        rating,
        rideId,
        tip,
      })
      this.isActionPending = false
      if (response.success) {
        if (response.data) this.applyUpdate(response.data)
        this.pendingRating = null
        this.error = ''
      } else {
        this.error = response.error ?? 'request_failed'
      }
      return response
    },
    async getPlayerCoordinates(): Promise<
      NuiResponse<{ coords: AgentRideCoordinates }>
    > {
      return nuiCall<{ coords: AgentRideCoordinates }>(
        'agentride:get-player-coords',
      )
    },
    async setWaypoint(coords: AgentRideCoordinates): Promise<NuiResponse> {
      return nuiCall('map:setWaypoint', { coords })
    },
    clearQuote(): void {
      this.quote = null
      this.error = ''
    },
  },
})
