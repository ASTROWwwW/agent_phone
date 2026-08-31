export type AgentRideMode = 'rider' | 'driver'

export type AgentRideServiceClass = 'taxi' | 'comfort' | 'xl' | 'premium'

export type AgentRideDistanceUnit = 'kilometer' | 'mile'

export type AgentRideFareMode = 'calculated' | 'custom'

export type AgentRideRideStatus =
  | 'searching'
  | 'accepted'
  | 'driver_arriving'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type AgentRideCoordinates = {
  x: number
  y: number
  z: number
}

export type AgentRideLocation = {
  coords: AgentRideCoordinates
  id?: string
  label: string
}

export type AgentRidePerson = {
  avatarUrl: string | null
  id: string
  name: string
  phoneNumber?: string
  rating: number
  trips: number
}

export type AgentRideVehicle = {
  color: string
  model: string
  plate: string
}

export type AgentRideDriver = AgentRidePerson & {
  location?: AgentRideCoordinates
  vehicle: AgentRideVehicle
}

export type AgentRidePassenger = Pick<
  AgentRidePerson,
  'avatarUrl' | 'id' | 'name' | 'phoneNumber' | 'rating' | 'trips'
>

export type AgentRideQuoteOption = {
  available: boolean
  calculatedPrice: number
  currency: string
  etaMinutes: number
  fareMode: AgentRideFareMode
  maximumCustomPrice: number
  minimumCustomPrice: number
  price: number
  pricePerDistanceUnit: number
  quoteId: string
  seats: number
  serviceClass: AgentRideServiceClass
}

export type AgentRideCustomFareInput = {
  price: number
  serviceClass: AgentRideServiceClass
}

export type AgentRideQuote = {
  destination: AgentRideLocation
  distance: number
  distanceMeters: number
  distanceUnit: AgentRideDistanceUnit
  durationSeconds: number
  expiresAt: number
  options: AgentRideQuoteOption[]
  pickup: AgentRideLocation
}

export type AgentRideRide = {
  createdAt: number
  currency: string
  destination: AgentRideLocation
  distanceMeters: number
  driver: AgentRideDriver | null
  durationSeconds: number
  finalPrice?: number
  id: string
  passenger?: AgentRidePassenger
  pickup: AgentRideLocation
  price: number
  serviceClass: AgentRideServiceClass
  status: AgentRideRideStatus
  updatedAt: number
}

export type AgentRideProfile = {
  acceptanceRate: number | null
  avatarMediaId: number | null
  avatarUrl: string | null
  cancelledRides: number
  completedRides: number
  currency: string
  defaultPaymentMethod: string
  earningsToday: number | null
  id: string
  memberSince: number
  name: string
  rating: number
}

export type AgentRideProfileInput = {
  avatarMediaId: number
  name: string
}

export type AgentRideBootstrap = {
  activeRide: AgentRideRide | null
  availableRequests: AgentRideRide[]
  driverEligible: boolean
  driverOnline: boolean
  history: AgentRideRide[]
  pendingRating: AgentRideRide | null
  profile: AgentRideProfile
  quickLocations: AgentRideLocation[]
}

export type AgentRideStateUpdate = Partial<
  Pick<
    AgentRideBootstrap,
    | 'activeRide'
    | 'availableRequests'
    | 'driverOnline'
    | 'history'
    | 'pendingRating'
    | 'profile'
  >
>

export type AgentRideHistoryResponse = {
  items: AgentRideRide[]
}

export type AgentRideChangedMessage = {
  data: AgentRideStateUpdate
  type: 'agentride:changed'
}
