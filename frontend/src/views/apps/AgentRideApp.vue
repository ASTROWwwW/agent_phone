<script setup lang="ts">
import {
  Bell,
  BriefcaseBusiness,
  Camera,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  CircleDollarSign,
  Clock3,
  Crosshair,
  History,
  House,
  Images,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Pencil,
  Power,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useCallsStore } from '@/stores/calls'
import { useMessageMediaStore } from '@/stores/messageMedia'
import { usePhoneStore } from '@/stores/phone'
import { useAgentRideStore } from '@/stores/agentride'
import type { PhoneMedia } from '@/types/media'
import type {
  AgentRideChangedMessage,
  AgentRideCustomFareInput,
  AgentRideDistanceUnit,
  AgentRideFareMode,
  AgentRideLocation,
  AgentRideMode,
  AgentRideQuoteOption,
  AgentRideRide,
  AgentRideRideStatus,
} from '@/types/agentride'
import { isTrustedRootMessageSource } from '@/utils/windowMessages'
import {
  SkyAppPage as kPage,
  SkyBadge as kBadge,
  SkyBlock as kBlock,
  SkyBlockHeader as kBlockHeader,
  SkyBlockTitle as kBlockTitle,
  SkyButton,
  SkyButton as kButton,
  SkyCard as kCard,
  SkyChip as kChip,
  SkyDialog as kDialog,
  SkyDialogButton as kDialogButton,
  SkyField,
  SkyField as kListInput,
  SkyLink as kLink,
  SkyList as kList,
  SkyListItem as kListItem,
  SkyNavbar as kNavbar,
  SkySegmented as kSegmented,
  SkySegmentedButton as kSegmentedButton,
  SkySettingsGroup,
  SkySettingsRow,
  SkySheet,
  SkySheet as kSheet,
  SkySpinner as kPreloader,
  SkyTabBar as kTabbar,
  SkyTabButton as kTabbarLink,
  SkyNotification as kNotification,
  SkyToggle as kToggle,
} from '@/ui'

type AgentRideTab = 'home' | 'rides' | 'activity' | 'messages' | 'profile'
type LocationTarget = 'pickup' | 'destination'
type ProfileMediaContext = {
  avatarMediaId: number
  name: string
  selectedAvatar: PhoneMedia | null
}

const phone = usePhoneStore()
const agentride = useAgentRideStore()
const calls = useCallsStore()
const messageMedia = useMessageMediaStore()
const router = useRouter()

const activeTab = ref<AgentRideTab>('home')
const mode = ref<AgentRideMode>('rider')
const pickup = ref<AgentRideLocation | null>(null)
const destination = ref<AgentRideLocation | null>(null)
const locationTarget = ref<LocationTarget | null>(null)
const selectedQuoteId = ref<string | null>(null)
const fareMode = ref<AgentRideFareMode>('calculated')
const customFareInput = ref('')
const cancelDialogOpened = ref(false)
const rating = ref(0)
const tip = ref(0)
const ratingComment = ref('')
const toastText = ref('')
const profileEditorOpened = ref(false)
const profileName = ref('')
const profileAvatarMediaId = ref(0)
const selectedProfileAvatar = ref<PhoneMedia | null>(null)
let toastTimer: number | undefined

const tabs = [
  { icon: House, id: 'home' as const },
  { icon: Route, id: 'rides' as const },
  { icon: Bell, id: 'activity' as const },
  { icon: MessageCircle, id: 'messages' as const },
  { icon: CircleUserRound, id: 'profile' as const },
]
const selectedQuote = computed(() =>
  agentride.quote?.options.find(
    (option) => option.quoteId === selectedQuoteId.value,
  ),
)
const canRequestSelectedQuote = computed(() => {
  const option = selectedQuote.value
  if (!option) return false
  if (fareMode.value === 'calculated') {
    return option.fareMode === 'calculated'
  }
  return (
    option.fareMode === 'custom' &&
    Number(customFareInput.value) === option.price
  )
})
const activeContact = computed(() =>
  mode.value === 'driver'
    ? agentride.activeRide?.passenger
    : agentride.activeRide?.driver,
)
const canCancelRide = computed(() =>
  [
    'searching',
    'accepted',
    'driver_arriving',
    'arrived',
    'in_progress',
  ].includes(agentride.activeRide?.status ?? ''),
)
const driverAction = computed<'arrive' | 'start' | 'complete' | null>(() => {
  const status = agentride.activeRide?.status
  if (status === 'accepted' || status === 'driver_arriving') return 'arrive'
  if (status === 'arrived') return 'start'
  if (status === 'in_progress') return 'complete'
  return null
})
const ratingRide = computed(() => agentride.pendingRating)
const profileAvatarUrl = computed(
  () =>
    selectedProfileAvatar.value?.url ??
    (profileAvatarMediaId.value > 0 ? agentride.profile?.avatarUrl : null),
)
const canSaveProfile = computed(() => {
  const length = Array.from(profileName.value.trim()).length
  return length >= 2 && length <= 50 && !agentride.isActionPending
})

function showToast(message: string): void {
  if (toastTimer) window.clearTimeout(toastTimer)
  toastText.value = message
  toastTimer = window.setTimeout(() => {
    toastText.value = ''
    toastTimer = undefined
  }, 2200)
}

function errorText(error?: string): string {
  const key = error ?? 'request_failed'
  const translated = phone.t(`Apps.agentride.errors.${key}`)
  return translated === `Apps.agentride.errors.${key}`
    ? phone.t('Apps.agentride.errors.request_failed')
    : translated
}

function locationLabel(location: AgentRideLocation | null): string {
  if (!location) return phone.t('Apps.agentride.notSelected')
  if (!location.id) return location.label
  const key = `Apps.agentride.quickLocations.${location.id}`
  const translated = phone.t(key)
  return translated === key ? phone.t('Apps.agentride.savedPlace') : translated
}

function paymentMethodLabel(method: string): string {
  const key = `Apps.agentride.paymentMethods.${method}`
  const translated = phone.t(key)
  return translated === key
    ? phone.t('Apps.agentride.paymentMethods.default')
    : translated
}

function formatMoney(amount: number, currency: string): string {
  if (/^[A-Z]{3}$/.test(currency)) {
    return new Intl.NumberFormat(phone.lang, {
      currency,
      maximumFractionDigits: 0,
      style: 'currency',
    }).format(amount)
  }
  return `${currency}${new Intl.NumberFormat(phone.lang, {
    maximumFractionDigits: 0,
  }).format(amount)}`
}

function formatQuoteDistance(
  distance: number,
  unit: AgentRideDistanceUnit,
): string {
  return phone.t(
    unit === 'mile'
      ? 'Apps.agentride.distanceMiles'
      : 'Apps.agentride.distanceKilometers',
    {
      distance: distance.toLocaleString(phone.lang, {
        maximumFractionDigits: 1,
      }),
    },
  )
}

function formatRideDistance(distanceMeters: number): string {
  return formatQuoteDistance(Math.max(0, distanceMeters) / 1000, 'kilometer')
}

function formatDistanceRate(option: AgentRideQuoteOption): string {
  const unitKey =
    agentride.quote?.distanceUnit === 'mile' ? 'perMile' : 'perKilometer'
  return phone.t(`Apps.agentride.${unitKey}`, {
    price: formatMoney(option.pricePerDistanceUnit, option.currency),
  })
}

function formatDuration(durationSeconds: number): string {
  return phone.t('Apps.agentride.durationMinutes', {
    minutes: Math.max(1, Math.round(durationSeconds / 60)).toLocaleString(
      phone.lang,
    ),
  })
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(phone.lang, {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(timestamp * 1000))
}

function statusLabel(status: AgentRideRideStatus): string {
  return phone.t(`Apps.agentride.status.${status}`)
}

function vehicleLabel(ride: AgentRideRide): string {
  const model = ride.driver?.vehicle.model.trim() ?? ''
  return model && !/^-?\d+$/.test(model)
    ? model
    : phone.t('Apps.agentride.vehicle')
}

function updateRatingComment(event: Event): void {
  ratingComment.value = (event.target as HTMLInputElement).value
}

function openLocationPicker(target: LocationTarget): void {
  if (agentride.activeRide) return
  locationTarget.value = target
}

function chooseLocation(location: AgentRideLocation): void {
  const target = locationTarget.value
  if (!target) return
  if (target === 'pickup') pickup.value = { ...location }
  else destination.value = { ...location }
  locationTarget.value = null
  agentride.clearQuote()
}

function chooseQuickDestination(location: AgentRideLocation): void {
  destination.value = { ...location }
  agentride.clearQuote()
}

async function useCurrentLocation(): Promise<void> {
  const target = locationTarget.value
  if (!target) return
  const response = await agentride.getPlayerCoordinates()
  if (!response.success || !response.data) {
    showToast(errorText(response.error))
    return
  }
  chooseLocation({
    coords: response.data.coords,
    label: phone.t('Apps.agentride.currentLocation'),
  })
}

async function createQuote(customFare?: AgentRideCustomFareInput): Promise<void> {
  if (!pickup.value || !destination.value) return
  const preferredService =
    customFare?.serviceClass ?? selectedQuote.value?.serviceClass
  const response = await agentride.createQuote(
    pickup.value,
    destination.value,
    customFare,
  )
  if (!response.success || !response.data) {
    showToast(errorText(response.error))
    return
  }
  const option =
    response.data.options.find(
      (candidate) =>
        candidate.available && candidate.serviceClass === preferredService,
    ) ?? response.data.options.find((candidate) => candidate.available)
  selectedQuoteId.value = option?.quoteId ?? null
  fareMode.value = option?.fareMode ?? 'calculated'
  customFareInput.value = option ? String(option.price) : ''
}

async function requestRide(
  option: AgentRideQuoteOption | undefined,
): Promise<void> {
  if (!option) return
  const response = await agentride.requestRide(option)
  if (!response.success) showToast(errorText(response.error))
}

function selectQuoteOption(option: AgentRideQuoteOption): void {
  if (!option.available) return
  selectedQuoteId.value = option.quoteId
  fareMode.value = option.fareMode
  customFareInput.value = String(option.price)
}

function selectFareMode(nextMode: AgentRideFareMode): void {
  fareMode.value = nextMode
  const option = selectedQuote.value
  if (!option) return
  customFareInput.value = String(
    nextMode === 'custom' && option.fareMode === 'custom'
      ? option.price
      : option.calculatedPrice,
  )
}

function updateCustomFareInput(event: Event): void {
  customFareInput.value = (event.target as HTMLInputElement).value
}

async function applyCustomFare(): Promise<void> {
  const option = selectedQuote.value
  const price = Number(customFareInput.value)
  if (
    !option ||
    !Number.isInteger(price) ||
    price < option.minimumCustomPrice ||
    price > option.maximumCustomPrice
  ) {
    showToast(errorText('invalid_custom_fare'))
    return
  }
  await createQuote({ price, serviceClass: option.serviceClass })
}

async function applyCalculatedFare(): Promise<void> {
  if (selectedQuote.value?.fareMode === 'calculated') {
    selectFareMode('calculated')
    return
  }
  fareMode.value = 'calculated'
  await createQuote()
}

async function toggleDriverStatus(): Promise<void> {
  const response = await agentride.setDriverStatus(!agentride.driverOnline)
  if (!response.success) showToast(errorText(response.error))
}

async function acceptRide(ride: AgentRideRide): Promise<void> {
  const response = await agentride.performRideAction('accept', ride.id)
  if (!response.success) showToast(errorText(response.error))
}

async function performDriverAction(): Promise<void> {
  const ride = agentride.activeRide
  const action = driverAction.value
  if (!ride || !action) return
  const response = await agentride.performRideAction(action, ride.id)
  if (!response.success) showToast(errorText(response.error))
}

async function confirmCancel(): Promise<void> {
  const ride = agentride.activeRide
  if (!ride) return
  const response = await agentride.cancelRide(ride.id, 'changed_mind')
  if (!response.success) showToast(errorText(response.error))
  cancelDialogOpened.value = false
}

async function setRideWaypoint(): Promise<void> {
  const ride = agentride.activeRide
  if (!ride) return
  const location =
    mode.value === 'driver' && ride.status !== 'in_progress'
      ? ride.pickup
      : ride.destination
  const response = await agentride.setWaypoint(location.coords)
  showToast(
    response.success
      ? phone.t('Apps.agentride.waypointSet')
      : errorText(response.error),
  )
}

async function callActiveContact(): Promise<void> {
  const number = activeContact.value?.phoneNumber
  if (!number) return
  const response = await calls.dial(number)
  if (!response.success) showToast(errorText(response.error))
}

function openMessages(): void {
  void router.push('/apps/messages')
}

function syncProfileEditor(): void {
  if (!agentride.profile) return
  profileName.value = agentride.profile.name
  profileAvatarMediaId.value = agentride.profile.avatarMediaId ?? 0
  selectedProfileAvatar.value = null
}

function openProfileEditor(): void {
  syncProfileEditor()
  profileEditorOpened.value = true
}

function closeProfileEditor(): void {
  profileEditorOpened.value = false
  syncProfileEditor()
}

function openProfileMedia(app: 'camera' | 'photos'): void {
  messageMedia.begin(
    'agentride:profile-avatar',
    'photo',
    '/apps/agentride?profileEdit=1',
    1,
    {
      avatarMediaId: profileAvatarMediaId.value,
      name: profileName.value,
      selectedAvatar: selectedProfileAvatar.value,
    } satisfies ProfileMediaContext,
  )
  profileEditorOpened.value = false
  void router.push({
    path: `/apps/${app}`,
    query: { mediaAttachment: 'photo' },
  })
}

function removeProfileAvatar(): void {
  selectedProfileAvatar.value = null
  profileAvatarMediaId.value = 0
}

async function saveProfile(): Promise<void> {
  if (!canSaveProfile.value) {
    showToast(phone.t('Apps.agentride.errors.invalid_profile_name'))
    return
  }
  const response = await agentride.updateProfile({
    avatarMediaId:
      selectedProfileAvatar.value?.id ?? profileAvatarMediaId.value,
    name: profileName.value.trim(),
  })
  if (!response.success) {
    showToast(errorText(response.error))
    return
  }
  profileEditorOpened.value = false
  syncProfileEditor()
  showToast(phone.t('Apps.agentride.profileSaved'))
}

async function submitRating(): Promise<void> {
  const ride = ratingRide.value
  if (!ride || rating.value < 1) return
  const response = await agentride.rateRide(
    ride.id,
    rating.value,
    tip.value,
    ratingComment.value.trim(),
  )
  if (!response.success) {
    showToast(errorText(response.error))
    return
  }
  rating.value = 0
  tip.value = 0
  ratingComment.value = ''
  showToast(phone.t('Apps.agentride.ratingSaved'))
}

function dismissRating(): void {
  agentride.pendingRating = null
  rating.value = 0
  tip.value = 0
  ratingComment.value = ''
}

function selectTab(tab: AgentRideTab): void {
  activeTab.value = tab
  if (tab === 'rides' || tab === 'activity') void agentride.loadHistory()
}

function handleAgentRideMessage(event: MessageEvent<unknown>): void {
  if (!isTrustedRootMessageSource(event.source, window)) return
  if (typeof event.data !== 'object' || event.data === null) return
  const message = event.data as Partial<AgentRideChangedMessage>
  if (message.type !== 'agentride:changed' || !message.data) return
  agentride.applyUpdate(message.data)
}

watch(
  () => agentride.driverEligible,
  (eligible) => {
    if (!eligible) mode.value = 'rider'
  },
)

watch(
  () => agentride.activeRide,
  (ride) => {
    if (!ride || !agentride.profile) return
    mode.value = ride.passenger?.id === agentride.profile.id ? 'rider' : 'driver'
  },
)

onMounted(async () => {
  window.addEventListener('message', handleAgentRideMessage)
  const profileSelection = messageMedia.consumeMany<ProfileMediaContext>(
    'agentride:profile-avatar',
  )
  await agentride.bootstrap()
  syncProfileEditor()
  if (profileSelection?.context) {
    profileName.value = profileSelection.context.name
    profileAvatarMediaId.value = profileSelection.context.avatarMediaId
    selectedProfileAvatar.value =
      profileSelection.media[0] ?? profileSelection.context.selectedAvatar
    if (profileSelection.media[0]) {
      profileAvatarMediaId.value = profileSelection.media[0].id
    }
    activeTab.value = 'profile'
    profileEditorOpened.value = true
  }
  const response = await agentride.getPlayerCoordinates()
  if (response.success && response.data) {
    if (!pickup.value) {
      pickup.value = {
        coords: response.data.coords,
        label: phone.t('Apps.agentride.currentLocation'),
      }
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleAgentRideMessage)
  if (toastTimer) window.clearTimeout(toastTimer)
})
</script>

<template>
  <k-page
    class="agentride-app pb-safe-24"
    :class="{ 'agentride-app--dark': phone.isDarkMode }"
    :label="phone.t('Apps.agentride.name')"
    :dark="phone.isDarkMode"
    accent="#c49a00"
    accent-soft="rgba(245, 197, 24, 0.16)"
  >
    <div class="agentride-ambient" aria-hidden="true"></div>
    <k-navbar
      class="agentride-navbar"
      :title="phone.t('Apps.agentride.name')"
      :subtitle="phone.t(`Apps.agentride.mode.${mode}`)"
    />

    <k-block
      v-if="agentride.isLoading && !agentride.profile"
      class="agentride-loading"
    >
      <k-preloader />
      <span>{{ phone.t('Apps.agentride.loading') }}</span>
    </k-block>

    <k-card
      v-else-if="!agentride.profile"
      :content-wrap="false"
      class="agentride-unavailable"
    >
      <CarFront :size="36" aria-hidden="true" />
      <strong>{{ phone.t('Apps.agentride.unavailable') }}</strong>
      <p>{{ errorText(agentride.error) }}</p>
      <k-button rounded @click="agentride.bootstrap()">
        {{ phone.t('Apps.agentride.tryAgain') }}
      </k-button>
    </k-card>

    <template v-else>
      <div class="agentride-scroll">
        <div class="agentride-mode">
          <k-segmented v-if="agentride.driverEligible" strong rounded>
            <k-segmented-button
              :active="mode === 'rider'"
              :disabled="Boolean(agentride.activeRide)"
              @click="mode = 'rider'"
            >
              {{ phone.t('Apps.agentride.mode.rider') }}
            </k-segmented-button>
            <k-segmented-button
              :active="mode === 'driver'"
              :disabled="Boolean(agentride.activeRide)"
              @click="mode = 'driver'"
            >
              {{ phone.t('Apps.agentride.mode.driver') }}
            </k-segmented-button>
          </k-segmented>
        </div>

        <template v-if="activeTab === 'home'">
          <section v-if="mode === 'rider'" class="agentride-home-panel">
            <template v-if="!agentride.activeRide">
              <k-block-header inset component="header" class="agentride-heading">
                <div>
                  <span>{{ phone.t('Apps.agentride.riderEyebrow') }}</span>
                  <h1>{{ phone.t('Apps.agentride.whereTo') }}</h1>
                </div>
                <span class="agentride-heading__icon" aria-hidden="true">
                  <Navigation :size="20" aria-hidden="true" />
                </span>
              </k-block-header>

              <k-list inset strong class="agentride-location-list">
                <k-list-item
                  link
                  :title="phone.t('Apps.agentride.pickup')"
                  :subtitle="locationLabel(pickup)"
                  @click="openLocationPicker('pickup')"
                >
                  <template #media><span class="agentride-dot"></span></template>
                </k-list-item>
                <k-list-item
                  link
                  :title="phone.t('Apps.agentride.destination')"
                  :subtitle="locationLabel(destination)"
                  @click="openLocationPicker('destination')"
                >
                  <template #media><MapPin :size="19" /></template>
                </k-list-item>
              </k-list>

              <template v-if="!agentride.quote">
                <k-block-title class="agentride-custom-block-title">{{
                  phone.t('Apps.agentride.quickDestinations')
                }}</k-block-title>
                <k-list
                  inset
                  strong
                  density="compact"
                  class="agentride-quick-list"
                >
                  <k-list-item
                    v-for="location in agentride.quickLocations.slice(0, 4)"
                    :key="location.id ?? location.label"
                    link
                    :title="locationLabel(location)"
                    @click="chooseQuickDestination(location)"
                  >
                    <template #media>
                      <component
                        :is="location.id === 'work' ? BriefcaseBusiness : MapPin"
                        :size="19"
                        aria-hidden="true"
                      />
                    </template>
                  </k-list-item>
                </k-list>

                <k-button
                  large
                  rounded
                  class="agentride-primary"
                  :disabled="!pickup || !destination || agentride.isActionPending"
                  @click="createQuote()"
                >
                  <k-preloader v-if="agentride.isActionPending" />
                  <template v-else>
                    {{ phone.t('Apps.agentride.viewRides') }}
                    <ChevronRight :size="18" aria-hidden="true" />
                  </template>
                </k-button>
              </template>

              <template v-else>
                <div class="agentride-quote-summary">
                  <k-chip class="agentride-quote-chip">{{
                    formatQuoteDistance(
                      agentride.quote.distance,
                      agentride.quote.distanceUnit,
                    )
                  }}</k-chip>
                  <k-chip class="agentride-quote-chip">{{
                    formatDuration(agentride.quote.durationSeconds)
                  }}</k-chip>
                  <k-link @click="agentride.clearQuote()">
                    {{ phone.t('Apps.agentride.change') }}
                  </k-link>
                </div>
                <k-list inset strong class="agentride-service-list">
                  <k-list-item
                    v-for="option in agentride.quote.options"
                    :key="option.quoteId"
                    :link="option.available"
                    :aria-disabled="!option.available"
                    :class="{
                      'is-selected': selectedQuoteId === option.quoteId,
                      'is-unavailable': !option.available,
                    }"
                    :title="
                      phone.t(
                        `Apps.agentride.services.${option.serviceClass}.name`,
                      )
                    "
                    :subtitle="
                      phone.t('Apps.agentride.serviceMeta', {
                        eta: option.etaMinutes.toLocaleString(phone.lang),
                        seats: option.seats.toLocaleString(phone.lang),
                      })
                    "
                    @click="selectQuoteOption(option)"
                  >
                    <template #media>
                      <span class="agentride-service-icon">
                        <CarFront :size="22" aria-hidden="true" />
                      </span>
                    </template>
                    <template #after>
                      <strong>{{
                        formatMoney(option.price, option.currency)
                      }}</strong>
                      <Check
                        v-if="selectedQuoteId === option.quoteId"
                        :size="16"
                      />
                    </template>
                  </k-list-item>
                </k-list>
                <k-card
                  v-if="selectedQuote"
                  :content-wrap="false"
                  class="agentride-fare-card"
                >
                  <div class="agentride-fare-card__heading">
                    <span class="agentride-fare-card__icon">
                      <CircleDollarSign :size="19" aria-hidden="true" />
                    </span>
                    <div>
                      <small>{{ phone.t('Apps.agentride.fare') }}</small>
                      <strong>{{
                        formatMoney(selectedQuote.price, selectedQuote.currency)
                      }}</strong>
                    </div>
                    <span>{{ formatDistanceRate(selectedQuote) }}</span>
                  </div>
                  <k-segmented>
                    <k-segmented-button
                      :active="fareMode === 'calculated'"
                      @click="applyCalculatedFare"
                    >
                      {{ phone.t('Apps.agentride.calculatedFare') }}
                    </k-segmented-button>
                    <k-segmented-button
                      :active="fareMode === 'custom'"
                      @click="selectFareMode('custom')"
                    >
                      {{ phone.t('Apps.agentride.customFare') }}
                    </k-segmented-button>
                  </k-segmented>
                  <div
                    v-if="fareMode === 'calculated'"
                    class="agentride-fare-breakdown"
                  >
                    <span>{{
                      phone.t('Apps.agentride.calculatedFareBody')
                    }}</span>
                    <strong>{{
                      formatMoney(
                        selectedQuote.calculatedPrice,
                        selectedQuote.currency,
                      )
                    }}</strong>
                  </div>
                  <div v-else class="agentride-custom-fare">
                    <k-list inset strong>
                      <k-list-input
                        id="agentride-custom-fare"
                        outline
                        type="number"
                        inputmode="numeric"
                        step="1"
                        :label="phone.t('Apps.agentride.customFare')"
                        :min="selectedQuote.minimumCustomPrice"
                        :max="selectedQuote.maximumCustomPrice"
                        :value="customFareInput"
                        :help="
                          phone.t('Apps.agentride.customFareRange', {
                            maximum: formatMoney(
                              selectedQuote.maximumCustomPrice,
                              selectedQuote.currency,
                            ),
                            minimum: formatMoney(
                              selectedQuote.minimumCustomPrice,
                              selectedQuote.currency,
                            ),
                          })
                        "
                        @input="updateCustomFareInput"
                      />
                    </k-list>
                    <k-button
                      small
                      rounded
                      :disabled="agentride.isActionPending"
                      @click="applyCustomFare"
                    >
                      {{ phone.t('Apps.agentride.applyCustomFare') }}
                    </k-button>
                  </div>
                </k-card>
                <p class="agentride-player-driver-notice">
                  {{ phone.t('Apps.agentride.playerDriverNotice') }}
                </p>
                <k-button
                  large
                  rounded
                  class="agentride-primary"
                  :disabled="
                    !canRequestSelectedQuote || agentride.isActionPending
                  "
                  @click="requestRide(selectedQuote)"
                >
                  <k-preloader v-if="agentride.isActionPending" />
                  <template v-else>
                    {{ phone.t('Apps.agentride.requestRide') }}
                    <ChevronRight :size="18" aria-hidden="true" />
                  </template>
                </k-button>
              </template>
            </template>

            <template v-else>
              <k-card :content-wrap="false" class="agentride-ride-status-card">
                <span
                  class="agentride-status-icon"
                  :class="'is-' + agentride.activeRide.status"
                >
                  <k-preloader
                    v-if="agentride.activeRide.status === 'searching'"
                  />
                  <CheckCircle2 v-else :size="22" aria-hidden="true" />
                </span>
                <div>
                  <small>{{ phone.t('Apps.agentride.rideStatus') }}</small>
                  <h1>{{ statusLabel(agentride.activeRide.status) }}</h1>
                  <p>
                    {{
                      phone.t(
                        `Apps.agentride.statusBody.${agentride.activeRide.status}`,
                      )
                    }}
                  </p>
                </div>
              </k-card>

              <k-card
                v-if="agentride.activeRide.driver"
                :content-wrap="false"
                class="agentride-person-card"
              >
                <div class="agentride-avatar">
                  <img
                    v-if="agentride.activeRide.driver.avatarUrl"
                    :src="agentride.activeRide.driver.avatarUrl"
                    alt=""
                  />
                  <UserRound v-else :size="22" aria-hidden="true" />
                </div>
                <div class="agentride-person-card__body">
                  <strong>{{ agentride.activeRide.driver.name }}</strong>
                  <span>
                    <Star :size="13" fill="currentColor" aria-hidden="true" />
                    {{
                      agentride.activeRide.driver.rating.toLocaleString(
                        phone.lang,
                      )
                    }}
                    · {{ vehicleLabel(agentride.activeRide) }}
                  </span>
                  <b>{{ agentride.activeRide.driver.vehicle.plate }}</b>
                </div>
                <div class="agentride-contact-actions">
                  <k-button
                    small
                    rounded
                    outline
                    :disabled="!agentride.activeRide.driver.phoneNumber"
                    :aria-label="phone.t('Apps.agentride.call')"
                    @click="callActiveContact"
                  >
                    <Phone :size="17" aria-hidden="true" />
                  </k-button>
                  <k-button
                    small
                    rounded
                    outline
                    :aria-label="phone.t('Apps.agentride.message')"
                    @click="openMessages"
                  >
                    <MessageCircle :size="17" aria-hidden="true" />
                  </k-button>
                </div>
              </k-card>

              <k-card :content-wrap="false" class="agentride-trip-card">
                <div class="agentride-route-stop">
                  <span class="agentride-dot"></span>
                  <div>
                    <small>{{ phone.t('Apps.agentride.pickup') }}</small>
                    <strong>{{
                      locationLabel(agentride.activeRide.pickup)
                    }}</strong>
                  </div>
                </div>
                <i></i>
                <div class="agentride-route-stop">
                  <MapPin :size="18" aria-hidden="true" />
                  <div>
                    <small>{{ phone.t('Apps.agentride.destination') }}</small>
                    <strong>{{
                      locationLabel(agentride.activeRide.destination)
                    }}</strong>
                  </div>
                </div>
                <div class="agentride-trip-meta">
                  <span>{{
                    phone.t(
                      `Apps.agentride.services.${agentride.activeRide.serviceClass}.name`,
                    )
                  }}</span>
                  <strong>{{
                    formatMoney(
                      agentride.activeRide.price,
                      agentride.activeRide.currency,
                    )
                  }}</strong>
                </div>
              </k-card>

              <div class="agentride-active-actions">
                <k-button rounded outline @click="setRideWaypoint">
                  <Navigation :size="17" aria-hidden="true" />
                  {{ phone.t('Apps.agentride.navigate') }}
                </k-button>
                <k-button
                  v-if="canCancelRide"
                  rounded
                  variant="danger"
                  outline
                  @click="cancelDialogOpened = true"
                >
                  {{ phone.t('Apps.agentride.cancelRide') }}
                </k-button>
              </div>
              <k-block class="agentride-safety-note">
                <ShieldCheck :size="18" aria-hidden="true" />
                <span>{{ phone.t('Apps.agentride.safetyNote') }}</span>
              </k-block>
            </template>
          </section>

          <section v-else class="agentride-home-panel agentride-driver-home">
            <k-card :content-wrap="false" class="agentride-driver-status">
              <div
                class="agentride-driver-status__icon"
                :class="{ 'is-online': agentride.driverOnline }"
              >
                <Power :size="21" aria-hidden="true" />
              </div>
              <div>
                <strong>{{
                  phone.t(
                    `Apps.agentride.driver.${agentride.driverOnline ? 'online' : 'offline'}`,
                  )
                }}</strong>
                <span>{{
                  phone.t(
                    `Apps.agentride.driver.${agentride.driverOnline ? 'onlineBody' : 'offlineBody'}`,
                  )
                }}</span>
              </div>
              <k-toggle
                :checked="agentride.driverOnline"
                :disabled="
                  agentride.isActionPending || Boolean(agentride.activeRide)
                "
                :aria-label="phone.t('Apps.agentride.driver.toggleStatus')"
                @change="toggleDriverStatus"
              />
            </k-card>

            <template v-if="agentride.activeRide">
              <k-card :content-wrap="false" class="agentride-ride-status-card">
                <span class="agentride-status-icon"><CarFront :size="22" /></span>
                <div>
                  <small>{{ phone.t('Apps.agentride.rideStatus') }}</small>
                  <h1>{{ statusLabel(agentride.activeRide.status) }}</h1>
                  <p>
                    {{
                      phone.t(
                        `Apps.agentride.driver.statusBody.${agentride.activeRide.status}`,
                      )
                    }}
                  </p>
                </div>
              </k-card>
              <k-card
                v-if="agentride.activeRide.passenger"
                :content-wrap="false"
                class="agentride-person-card"
              >
                <div class="agentride-avatar">
                  <img
                    v-if="agentride.activeRide.passenger.avatarUrl"
                    :src="agentride.activeRide.passenger.avatarUrl"
                    alt=""
                  />
                  <UserRound v-else :size="22" aria-hidden="true" />
                </div>
                <div class="agentride-person-card__body">
                  <small>{{ phone.t('Apps.agentride.passenger') }}</small>
                  <strong>{{ agentride.activeRide.passenger.name }}</strong>
                  <span
                    ><Star :size="13" fill="currentColor" />
                    {{
                      agentride.activeRide.passenger.rating.toLocaleString(
                        phone.lang,
                      )
                    }}</span
                  >
                </div>
                <div class="agentride-contact-actions">
                  <k-button
                    small
                    rounded
                    outline
                    :disabled="!agentride.activeRide.passenger.phoneNumber"
                    @click="callActiveContact"
                  >
                    <Phone :size="17" aria-hidden="true" />
                  </k-button>
                  <k-button small rounded outline @click="openMessages">
                    <MessageCircle :size="17" aria-hidden="true" />
                  </k-button>
                </div>
              </k-card>
              <k-card :content-wrap="false" class="agentride-trip-card">
                <div class="agentride-route-stop">
                  <span class="agentride-dot"></span>
                  <div>
                    <small>{{ phone.t('Apps.agentride.pickup') }}</small
                    ><strong>{{
                      locationLabel(agentride.activeRide.pickup)
                    }}</strong>
                  </div>
                </div>
                <i></i>
                <div class="agentride-route-stop">
                  <MapPin :size="18" />
                  <div>
                    <small>{{ phone.t('Apps.agentride.destination') }}</small
                    ><strong>{{
                      locationLabel(agentride.activeRide.destination)
                    }}</strong>
                  </div>
                </div>
                <div class="agentride-trip-meta">
                  <span>{{
                    phone.t(
                      `Apps.agentride.services.${agentride.activeRide.serviceClass}.name`,
                    )
                  }}</span>
                  <strong>{{
                    formatMoney(
                      agentride.activeRide.price,
                      agentride.activeRide.currency,
                    )
                  }}</strong>
                </div>
              </k-card>
              <div class="agentride-driver-actions">
                <k-button rounded outline @click="setRideWaypoint">
                  <Navigation :size="17" />
                  {{ phone.t('Apps.agentride.navigate') }}
                </k-button>
                <k-button
                  v-if="driverAction"
                  rounded
                  :disabled="agentride.isActionPending"
                  @click="performDriverAction"
                >
                  <k-preloader v-if="agentride.isActionPending" />
                  <template v-else>{{
                    phone.t(`Apps.agentride.driver.actions.${driverAction}`)
                  }}</template>
                </k-button>
              </div>
            </template>

            <template v-else>
              <div class="agentride-driver-metrics">
                <k-card :content-wrap="false">
                  <CircleDollarSign :size="19" />
                  <strong>{{
                    formatMoney(
                      agentride.profile.earningsToday ?? 0,
                      agentride.profile.currency,
                    )
                  }}</strong>
                  <span>{{ phone.t('Apps.agentride.driver.today') }}</span>
                </k-card>
                <k-card :content-wrap="false">
                  <Star :size="19" />
                  <strong>{{
                    agentride.profile.rating.toLocaleString(phone.lang)
                  }}</strong>
                  <span>{{ phone.t('Apps.agentride.rating') }}</span>
                </k-card>
              </div>
              <k-block-title class="agentride-custom-block-title">{{
                phone.t('Apps.agentride.driver.requests')
              }}</k-block-title>
              <div
                v-if="agentride.driverOnline && agentride.availableRequests.length"
                class="agentride-request-list"
              >
                <k-card
                  v-for="request in agentride.availableRequests"
                  :key="request.id"
                  class="agentride-request-card"
                >
                  <div class="agentride-request-card__top">
                    <span class="agentride-service-icon"
                      ><CarFront :size="20"
                    /></span>
                    <div>
                      <strong>{{
                        phone.t(
                          `Apps.agentride.services.${request.serviceClass}.name`,
                        )
                      }}</strong>
                      <span>{{ formatDate(request.createdAt) }}</span>
                    </div>
                    <b>{{ formatMoney(request.price, request.currency) }}</b>
                  </div>
                  <div class="agentride-request-route">
                    <span>{{ locationLabel(request.pickup) }}</span>
                    <ChevronRight :size="15" />
                    <span>{{ locationLabel(request.destination) }}</span>
                  </div>
                  <k-button
                    rounded
                    :disabled="agentride.isActionPending"
                    @click="acceptRide(request)"
                  >
                    {{ phone.t('Apps.agentride.driver.accept') }}
                  </k-button>
                </k-card>
              </div>
              <k-card v-else :content-wrap="false" class="agentride-empty-card">
                <Power v-if="!agentride.driverOnline" :size="28" />
                <Clock3 v-else :size="28" />
                <strong>{{
                  phone.t(
                    `Apps.agentride.driver.${agentride.driverOnline ? 'noRequests' : 'goOnline'}`,
                  )
                }}</strong>
                <p>
                  {{
                    phone.t(
                      `Apps.agentride.driver.${agentride.driverOnline ? 'noRequestsBody' : 'goOnlineBody'}`,
                    )
                  }}
                </p>
              </k-card>
            </template>
          </section>
        </template>

        <template v-else-if="activeTab === 'rides'">
          <section class="agentride-section-screen">
            <k-block-header
              inset
              component="header"
              class="agentride-screen-title"
            >
              <History :size="25" aria-hidden="true" />
              <div>
                <h1>{{ phone.t('Apps.agentride.rides') }}</h1>
                <p>{{ phone.t('Apps.agentride.ridesBody') }}</p>
              </div>
            </k-block-header>
            <k-block v-if="agentride.history.length" class="agentride-history-list">
              <k-card
                v-for="ride in agentride.history"
                :key="ride.id"
                content-wrap-padding="px-4 py-2"
                class="agentride-history-card"
              >
                <template #header>
                  <div class="agentride-history-card__header">
                    <span class="agentride-service-icon"
                      ><CarFront :size="19"
                    /></span>
                    <div>
                      <strong>{{
                        phone.t(
                          `Apps.agentride.services.${ride.serviceClass}.name`,
                        )
                      }}</strong
                      ><span>{{ formatDate(ride.createdAt) }}</span>
                    </div>
                    <k-badge class="agentride-status-badge">{{
                      statusLabel(ride.status)
                    }}</k-badge>
                  </div>
                </template>
                <div class="agentride-history-route">
                  <span>{{ locationLabel(ride.pickup) }}</span
                  ><ChevronRight :size="15" /><span>{{
                    locationLabel(ride.destination)
                  }}</span>
                </div>
                <template #footer>
                  <div class="agentride-history-card__footer">
                    <div class="agentride-history-card__meta">
                      <span>{{
                        ride.driver?.name ??
                        ride.passenger?.name ??
                        phone.t('Apps.agentride.ride')
                      }}</span>
                      <span class="agentride-history-card__distance">
                        <Route :size="13" aria-hidden="true" />
                        {{ formatRideDistance(ride.distanceMeters) }}
                      </span>
                    </div>
                    <strong>{{
                      formatMoney(ride.finalPrice ?? ride.price, ride.currency)
                    }}</strong>
                  </div>
                </template>
              </k-card>
            </k-block>
            <k-card v-else :content-wrap="false" class="agentride-empty-card"
              ><History :size="29" /><strong>{{
                phone.t('Apps.agentride.noRides')
              }}</strong>
              <p>{{ phone.t('Apps.agentride.noRidesBody') }}</p></k-card
            >
          </section>
        </template>

        <template v-else-if="activeTab === 'activity'">
          <section class="agentride-section-screen">
            <k-block-header
              inset
              component="header"
              class="agentride-screen-title"
            >
              <Bell :size="25" />
              <div>
                <h1>{{ phone.t('Apps.agentride.activity') }}</h1>
                <p>{{ phone.t('Apps.agentride.activityBody') }}</p>
              </div>
            </k-block-header>
            <k-list
              v-if="agentride.history.length"
              inset
              strong
              class="agentride-activity-list"
            >
              <k-list-item
                v-for="ride in agentride.history"
                :key="ride.id"
                :title="statusLabel(ride.status)"
                :subtitle="`${locationLabel(ride.destination)} · ${formatDate(ride.updatedAt)}`"
                :after="
                  formatMoney(ride.finalPrice ?? ride.price, ride.currency)
                "
              >
                <template #media
                  ><span class="agentride-activity-icon"
                    ><CheckCircle2 :size="18" /></span
                ></template>
              </k-list-item>
            </k-list>
            <k-card v-else :content-wrap="false" class="agentride-empty-card"
              ><Bell :size="29" /><strong>{{
                phone.t('Apps.agentride.noActivity')
              }}</strong>
              <p>{{ phone.t('Apps.agentride.noActivityBody') }}</p></k-card
            >
          </section>
        </template>

        <template v-else-if="activeTab === 'messages'">
          <section class="agentride-section-screen">
            <k-block-header
              inset
              component="header"
              class="agentride-screen-title"
            >
              <MessageCircle :size="25" />
              <div>
                <h1>{{ phone.t('Apps.agentride.messages') }}</h1>
                <p>{{ phone.t('Apps.agentride.messagesBody') }}</p>
              </div>
            </k-block-header>
            <k-card
              v-if="activeContact"
              :content-wrap="false"
              class="agentride-message-contact"
            >
              <div class="agentride-avatar">
                <img
                  v-if="activeContact.avatarUrl"
                  :src="activeContact.avatarUrl"
                  alt=""
                /><UserRound v-else :size="22" />
              </div>
              <div>
                <strong>{{ activeContact.name }}</strong
                ><span
                  ><Star :size="13" fill="currentColor" />
                  {{ activeContact.rating.toLocaleString(phone.lang) }}</span
                >
              </div>
              <ChevronRight :size="18" />
            </k-card>
            <k-block v-if="activeContact" class="agentride-contact-buttons">
              <k-button
                rounded
                :disabled="!activeContact.phoneNumber"
                @click="callActiveContact"
                ><Phone :size="17" />
                {{ phone.t('Apps.agentride.call') }}</k-button
              >
              <k-button rounded @click="openMessages"
                ><MessageCircle :size="17" />
                {{ phone.t('Apps.agentride.openMessages') }}</k-button
              >
            </k-block>
            <k-card v-else :content-wrap="false" class="agentride-empty-card"
              ><MessageCircle :size="29" /><strong>{{
                phone.t('Apps.agentride.noMessages')
              }}</strong>
              <p>{{ phone.t('Apps.agentride.noMessagesBody') }}</p>
              <k-button rounded @click="openMessages">{{
                phone.t('Apps.agentride.openMessages')
              }}</k-button></k-card
            >
          </section>
        </template>

        <template v-else>
          <section class="agentride-section-screen agentride-profile">
            <div class="agentride-profile-hero">
              <button
                type="button"
                class="agentride-profile-avatar agentride-profile-avatar--editable"
                :aria-label="phone.t('Apps.agentride.editProfile')"
                @click="openProfileEditor"
              >
                <img
                  v-if="agentride.profile.avatarUrl"
                  :src="agentride.profile.avatarUrl"
                  alt=""
                /><UserRound v-else :size="32" />
                <span><Pencil :size="13" /></span>
              </button>
              <h1>{{ agentride.profile.name }}</h1>
              <span
                ><Star :size="15" fill="currentColor" />
                {{ agentride.profile.rating.toLocaleString(phone.lang) }}</span
              >
            </div>
            <k-card :content-wrap="false" class="agentride-profile-stats">
              <div>
                <strong>{{
                  agentride.profile.completedRides.toLocaleString(phone.lang)
                }}</strong
                ><span>{{ phone.t('Apps.agentride.completedRides') }}</span>
              </div>
              <div>
                <strong>{{
                  agentride.profile.cancelledRides.toLocaleString(phone.lang)
                }}</strong
                ><span>{{ phone.t('Apps.agentride.cancelledRides') }}</span>
              </div>
              <div>
                <strong>{{
                  agentride.profile.acceptanceRate === null
                    ? phone.t('Apps.agentride.notAvailable')
                    : `${agentride.profile.acceptanceRate}%`
                }}</strong
                ><span>{{ phone.t('Apps.agentride.acceptance') }}</span>
              </div>
            </k-card>
            <k-block-title>{{ phone.t('Apps.agentride.account') }}</k-block-title>
            <k-list inset strong>
              <k-list-item
                link
                :title="phone.t('Apps.agentride.editProfile')"
                :subtitle="phone.t('Apps.agentride.editProfileBody')"
                @click="openProfileEditor"
                ><template #media><Pencil :size="18" /></template
              ></k-list-item>
              <k-list-item
                :title="phone.t('Apps.agentride.paymentMethod')"
                :after="
                  paymentMethodLabel(agentride.profile.defaultPaymentMethod)
                "
                ><template #media><CircleDollarSign :size="18" /></template
              ></k-list-item>
              <k-list-item
                :title="phone.t('Apps.agentride.safety')"
                :subtitle="phone.t('Apps.agentride.safetyBody')"
                ><template #media><ShieldCheck :size="18" /></template
              ></k-list-item>
              <k-list-item
                v-if="agentride.driverEligible"
                :title="phone.t('Apps.agentride.driverMode')"
                :subtitle="phone.t('Apps.agentride.driverModeBody')"
                ><template #media><CarFront :size="18" /></template
                ><template #after
                  ><k-toggle
                    :checked="mode === 'driver'"
                    :disabled="Boolean(agentride.activeRide)"
                    :aria-label="phone.t('Apps.agentride.driverMode')"
                    @change="
                      mode = mode === 'driver' ? 'rider' : 'driver'
                    " /></template
              ></k-list-item>
            </k-list>
            <k-block class="agentride-member-note"
              ><Sparkles :size="17" /><span>{{
                phone.t('Apps.agentride.memberSince', {
                  date: formatDate(agentride.profile.memberSince),
                })
              }}</span></k-block
            >
          </section>
        </template>
      </div>

      <k-tabbar
        class="agentride-tabbar"
        floating
        :label="phone.t('Apps.agentride.navigation')"
      >
        <div class="agentride-tab-pane">
          <k-tabbar-link
            v-for="tab in tabs"
            :key="tab.id"
            :active="activeTab === tab.id"
            @click="selectTab(tab.id)"
          >
            <template #label>{{
              phone.t(`Apps.agentride.tabs.${tab.id}`)
            }}</template>
            <template #icon>
              <component :is="tab.icon" :size="23" :stroke-width="2" />
            </template>
          </k-tabbar-link>
        </div>
      </k-tabbar>
    </template>

    <SkySheet
      class="agentride-profile-sheet"
      :opened="profileEditorOpened"
      :aria-label="phone.t('Apps.agentride.editProfile')"
      swipe-to-close
      @backdropclick="closeProfileEditor"
      @escape="closeProfileEditor"
      @swipeclose="closeProfileEditor"
    >
      <section class="agentride-profile-editor">
        <div class="agentride-sheet__title">
          <div>
            <span>{{ phone.t('Apps.agentride.profile') }}</span>
            <h2>{{ phone.t('Apps.agentride.editProfile') }}</h2>
          </div>
          <SkyButton
            icon-only
            variant="plain"
            :aria-label="phone.t('Common.close')"
            @click="closeProfileEditor"
          >
            <X :size="20" />
          </SkyButton>
        </div>

        <div class="agentride-profile-editor__avatar">
          <div class="agentride-profile-avatar">
            <img v-if="profileAvatarUrl" :src="profileAvatarUrl" alt="" />
            <UserRound v-else :size="32" />
          </div>
          <strong>{{ phone.t('Apps.agentride.profilePhoto') }}</strong>
          <div>
            <SkyButton
              rounded
              class="agentride-profile-media-button"
              @click="openProfileMedia('photos')"
            >
              <Images :size="17" /> {{ phone.t('Apps.agentride.gallery') }}
            </SkyButton>
            <SkyButton
              rounded
              class="agentride-profile-media-button"
              @click="openProfileMedia('camera')"
            >
              <Camera :size="17" /> {{ phone.t('Apps.agentride.camera') }}
            </SkyButton>
          </div>
        </div>

        <SkySettingsGroup :title="phone.t('Apps.agentride.profileDetails')">
          <SkyField
            v-model="profileName"
            layout="inline"
            :label="phone.t('Apps.agentride.profileName')"
            :maxlength="50"
            :placeholder="phone.t('Apps.agentride.profileNamePlaceholder')"
            autocomplete="name"
          />
          <SkySettingsRow
            v-if="profileAvatarUrl"
            kind="action"
            tone="danger"
            :title="phone.t('Apps.agentride.removeProfilePhoto')"
            @activate="removeProfileAvatar"
          >
            <template #leading><Trash2 :size="18" /></template>
          </SkySettingsRow>
        </SkySettingsGroup>

        <div class="agentride-profile-editor__actions">
          <SkyButton
            block
            large
            rounded
            variant="secondary"
            @click="closeProfileEditor"
          >
            {{ phone.t('Common.cancel') }}
          </SkyButton>
          <SkyButton
            block
            large
            rounded
            :disabled="!canSaveProfile"
            @click="saveProfile"
          >
            <k-preloader v-if="agentride.isActionPending" />
            <template v-else>{{
              phone.t('Apps.agentride.saveProfile')
            }}</template>
          </SkyButton>
        </div>
      </section>
    </SkySheet>

    <k-sheet
      :opened="Boolean(locationTarget)"
      @backdropclick="locationTarget = null"
    >
      <section
        v-if="locationTarget"
        class="agentride-sheet__content"
        role="dialog"
        aria-modal="true"
        :aria-label="phone.t(`Apps.agentride.chooseLocation.${locationTarget}`)"
      >
        <div class="agentride-sheet__handle" aria-hidden="true"></div>
        <div class="agentride-sheet__title">
          <div>
            <span>{{ phone.t('Apps.agentride.location') }}</span>
            <h2>
              {{ phone.t(`Apps.agentride.chooseLocation.${locationTarget}`) }}
            </h2>
          </div>
          <k-link
            icon-only
            class="agentride-sheet__close"
            :aria-label="phone.t('Common.close')"
            @click="locationTarget = null"
            ><X :size="20"
          /></k-link>
        </div>
        <k-list inset strong class="agentride-sheet-list">
          <k-list-item
            link
            :title="phone.t('Apps.agentride.currentLocation')"
            :subtitle="phone.t('Apps.agentride.useGps')"
            @click="useCurrentLocation"
            ><template #media><Crosshair :size="19" /></template
          ></k-list-item>
        </k-list>
        <k-block-title class="agentride-sheet-section-title">{{
          phone.t('Apps.agentride.savedPlaces')
        }}</k-block-title>
        <k-list inset strong class="agentride-sheet-list agentride-saved-list">
          <k-list-item
            v-for="location in agentride.quickLocations"
            :key="location.id ?? location.label"
            link
            :title="locationLabel(location)"
            @click="chooseLocation(location)"
            ><template #media
              ><component
                :is="location.id === 'work' ? BriefcaseBusiness : MapPin"
                :size="18" /></template
          ></k-list-item>
        </k-list>
      </section>
    </k-sheet>

    <k-sheet :opened="Boolean(ratingRide)" @backdropclick="dismissRating">
      <section
        v-if="ratingRide"
        class="agentride-sheet__content agentride-rating"
        role="dialog"
        aria-modal="true"
        :aria-label="phone.t('Apps.agentride.rateRide')"
      >
        <div class="agentride-sheet__handle" aria-hidden="true"></div>
        <div class="agentride-rating__success"><CheckCircle2 :size="30" /></div>
        <h2>{{ phone.t('Apps.agentride.rideComplete') }}</h2>
        <p>{{ phone.t('Apps.agentride.rateRideBody') }}</p>
        <div
          class="agentride-rating-stars"
          :aria-label="phone.t('Apps.agentride.rating')"
        >
          <k-button
            v-for="value in 5"
            :key="value"
            small
            rounded
            variant="plain"
            class="agentride-rating-star"
            :class="{ 'is-active': value <= rating }"
            :aria-pressed="value <= rating"
            :aria-label="
              phone.t('Apps.agentride.ratingValue', { rating: value.toString() })
            "
            @click="rating = value"
          >
            <Star :size="28" fill="currentColor" />
          </k-button>
        </div>
        <span class="agentride-rating-label">{{
          phone.t('Apps.agentride.tip')
        }}</span>
        <div class="agentride-tip-options">
          <k-button
            v-for="value in [0, 5, 10, 20]"
            :key="value"
            small
            rounded
            :outline="tip !== value"
            @click="tip = value"
            >{{
              value === 0
                ? phone.t('Apps.agentride.noTip')
                : formatMoney(value, ratingRide.currency)
            }}</k-button
          >
        </div>
        <k-list inset strong
          ><k-list-input
            id="agentride-rating-comment"
            outline
            :label="phone.t('Apps.agentride.comment')"
            :placeholder="phone.t('Apps.agentride.commentPlaceholder')"
            :value="ratingComment"
            maxlength="180"
            @input="updateRatingComment"
        /></k-list>
        <k-button
          large
          rounded
          :disabled="rating < 1 || agentride.isActionPending"
          @click="submitRating"
          ><k-preloader v-if="agentride.isActionPending" /><template v-else>{{
            phone.t('Apps.agentride.submitRating')
          }}</template></k-button
        >
        <k-link @click="dismissRating">{{
          phone.t('Apps.agentride.notNow')
        }}</k-link>
      </section>
    </k-sheet>

    <k-dialog
      :opened="cancelDialogOpened"
      :title="phone.t('Apps.agentride.cancelTitle')"
      :content="phone.t('Apps.agentride.cancelBody')"
      role="alertdialog"
      @backdropclick="cancelDialogOpened = false"
      @escape="cancelDialogOpened = false"
    >
      <template #buttons
        ><k-dialog-button @click="cancelDialogOpened = false">{{
          phone.t('Common.cancel')
        }}</k-dialog-button
        ><k-dialog-button strong @click="confirmCancel">{{
          phone.t('Apps.agentride.cancelRide')
        }}</k-dialog-button></template
      >
    </k-dialog>

    <k-notification :opened="Boolean(toastText)" :text="toastText" />
  </k-page>
</template>

<style scoped>
.agentride-app {
  --ride-accent: #f5c518;
  --ride-accent-strong: #725600;
  --ride-bg-rgb: 244 244 247;
  --ride-bg: #f4f4f7;
  --ride-card: rgba(255, 255, 255, 0.88);
  --ride-card-strong: #fff;
  --ride-border: rgba(26, 26, 28, 0.09);
  --ride-text: #171719;
  --ride-muted: #707078;
  --ride-map: #07131f;
  --ride-profile-media-bg: #725600;
  --sky-bg: var(--ride-bg);
  --sky-surface: var(--ride-card-strong);
  --sky-surface-muted: #e6e6eb;
  --sky-text: var(--ride-text);
  --sky-muted: var(--ride-muted);
  --sky-hairline: var(--ride-border);
  --sky-danger: #d70015;
  position: relative;
  height: 100%;
  overflow: hidden;
  color: var(--ride-text);
  background: var(--ride-bg);
}

.agentride-app--dark {
  --ride-accent-strong: #f5c518;
  --ride-bg-rgb: 8 9 11;
  --ride-bg: #08090b;
  --ride-card: rgba(29, 30, 33, 0.9);
  --ride-card-strong: #1c1d20;
  --ride-border: rgba(255, 255, 255, 0.09);
  --ride-text: #f7f7f8;
  --ride-muted: #a2a2aa;
  --ride-map: #050a10;
  --ride-profile-media-bg: #9b7600;
  --sky-surface-muted: #2c2c2e;
  --sky-danger: #ff453a;
}

.agentride-ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 82% 10%,
      rgba(245, 197, 24, 0.16),
      transparent 28%
    ),
    linear-gradient(180deg, rgba(245, 197, 24, 0.04), transparent 32%);
}

.agentride-navbar {
  --k-safe-area-top: 56px;
  z-index: 22;
  position: relative;
  color: var(--ride-text);
}

.agentride-navbar :deep(.sky-navbar__blur),
.agentride-navbar :deep(.sky-navbar__background) {
  display: none;
}

.agentride-navbar :deep(.sky-navbar__title) {
  color: var(--ride-text);
  font-size: 18px;
  font-weight: 700;
  line-height: 20px;
  letter-spacing: -0.25px;
}

.agentride-navbar :deep(.sky-navbar__subtitle) {
  margin-top: 1px;
  color: var(--ride-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 14px;
  opacity: 1;
}

.agentride-mode {
  z-index: 21;
  position: relative;
  min-height: 9px;
  padding: 4px 16px 10px;
}

.agentride-mode > :deep(*) {
  width: 100%;
}

/* Variante « strong » du segment partage : piste neutre et pouce blanc
   glissant. L'or reste la couleur des actions plutot que celle d'un onglet, ou
   il ecrasait tout le haut de l'ecran. */
.agentride-mode :deep(.sky-segmented) {
  padding: 2px;
  background: var(--sky-surface-muted);
}

.agentride-mode :deep(button) {
  min-height: 34px;
  color: var(--ride-muted);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.agentride-mode :deep(button.sky-segmented-button--active) {
  color: var(--ride-text);
}

.agentride-mode :deep(.sky-segmented__highlight) {
  background: var(--ride-card-strong);
  box-shadow: 0 1px 3px rgb(0 0 0 / 14%);
}

.agentride-scroll {
  position: absolute;
  z-index: 2;
  box-sizing: border-box;
  inset: 114px 0 0;
  padding: 0 0 116px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}

.agentride-scroll::-webkit-scrollbar {
  display: none;
}

.agentride-loading,
.agentride-unavailable {
  position: absolute;
  z-index: 4;
  inset: 92px 24px 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  text-align: center;
}

.agentride-unavailable {
  padding: 24px;
  border: 1px solid var(--ride-border);
  border-radius: 22px;
  background: var(--ride-card);
}

.agentride-loading span,
.agentride-unavailable p {
  color: var(--ride-muted);
}

.agentride-unavailable strong {
  font-size: 20px;
}

.agentride-unavailable p {
  margin: 0;
  font-size: 13px;
}

.agentride-home-panel,
.agentride-section-screen {
  position: relative;
  z-index: 4;
  padding: 18px 14px 24px;
}

.agentride-home-panel {
  min-height: 320px;
  margin-top: 0;
  background: linear-gradient(
    180deg,
    rgb(var(--ride-bg-rgb) / 0) 0,
    rgb(var(--ride-bg-rgb) / 0.78) 54px,
    var(--ride-bg) 112px
  );
}

.agentride-heading,
.agentride-screen-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  padding: 0 4px 12px;
}

.agentride-heading span,
.agentride-screen-title p,
.agentride-ride-status-card p {
  margin: 0;
  color: var(--ride-muted);
  font-size: 13px;
  line-height: 18px;
}

.agentride-heading h1,
.agentride-ride-status-card h1,
.agentride-screen-title h1 {
  margin: 2px 0 0;
  color: var(--ride-text);
  font-size: 24px;
  font-weight: 700;
  line-height: 28px;
  letter-spacing: -0.55px;
}

/* Cette pastille est decorative : la remplir d'or plein la faisait passer pour
   un bouton. Fond teinte, glyphe accentue, elle redevient une illustration. */
.agentride-heading__icon,
.agentride-status-icon {
  display: grid;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 15px;
  color: var(--ride-accent-strong);
  background: rgb(245 197 24 / 18%);
  box-shadow: none;
}

.agentride-heading__icon > svg {
  display: block;
  width: 20px;
  height: 20px;
}

.agentride-status-icon.is-searching {
  color: var(--ride-accent-strong);
  background: rgba(245, 197, 24, 0.14);
  box-shadow: none;
}

.agentride-location-list,
.agentride-service-list,
.agentride-activity-list,
.agentride-sheet__content :deep(.sky-list),
.agentride-profile :deep(.sky-list) {
  margin-block: 0 14px;
}

.agentride-location-list,
.agentride-activity-list {
  margin-inline: 2px !important;
}

.agentride-location-list :deep(li),
.agentride-service-list :deep(li),
.agentride-activity-list :deep(li),
.agentride-profile :deep(li),
.agentride-sheet__content :deep(li) {
  background: var(--ride-card-strong);
}

.agentride-dot {
  display: block;
  width: 11px;
  height: 11px;
  border: 3px solid var(--ride-accent);
  border-radius: 50%;
  background: #171719;
}

/* Raccourcis en liste d'une colonne : en deux colonnes, « Los Santos Airport »
   et « Diamond Casino » etaient systematiquement tronques. */
.agentride-quick-list {
  margin: 0 2px 16px !important;
}

.agentride-quick-list :deep(li) {
  background: var(--ride-card-strong);
}

.agentride-quick-list :deep(.sky-list-item__media) {
  color: var(--ride-accent-strong);
}

.agentride-quick-list :deep(.sky-list-item__title) {
  font-size: 16px;
  font-weight: 550;
}

.agentride-driver-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  margin: 0 2px 16px;
  padding: 0;
}

.agentride-custom-block-title {
  height: auto !important;
  margin: 20px 4px 10px !important;
  padding: 0 !important;
  color: var(--ride-muted) !important;
  font-size: 15px !important;
  font-weight: 650 !important;
  line-height: 20px !important;
}

.agentride-quick-card,
.agentride-driver-metrics :deep(.sky-card),
.agentride-person-card,
.agentride-trip-card,
.agentride-driver-status,
.agentride-request-card,
.agentride-history-card,
.agentride-message-contact,
.agentride-empty-card,
.agentride-fare-card,
.agentride-ride-status-card {
  margin: 0;
  border: 1px solid var(--ride-border);
  color: var(--ride-text);
  background: var(--ride-card);
  box-shadow: 0 7px 23px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.agentride-ride-status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 15px;
  background:
    linear-gradient(135deg, rgba(245, 197, 24, 0.12), transparent 58%),
    var(--ride-card);
}

.agentride-ride-status-card > div {
  min-width: 0;
}

.agentride-ride-status-card small {
  color: var(--ride-accent-strong);
  font-size: 9px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.9px;
}

.agentride-ride-status-card h1 {
  margin: 2px 0;
  font-size: 20px;
  line-height: 1.05;
}

.agentride-ride-status-card p {
  line-height: 1.3;
}

/* Une seule ligne par raccourci : le clamp sur deux lignes donnait des cartes
   de hauteurs differentes des qu'un nom depassait. */
.agentride-quick-card {
  display: flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 10px 13px;
  color: inherit;
  text-align: left;
  transition: transform 160ms var(--sky-ease-out);
}

.agentride-quick-card:active {
  transform: scale(0.97);
}

.agentride-quick-card svg,
.agentride-driver-metrics svg {
  flex: none;
  color: var(--ride-accent-strong);
}

.agentride-quick-card span {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.2px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agentride-primary {
  width: calc(100% - 4px);
  min-height: 50px;
  margin: 4px 2px 0;
  gap: 5px;
  font-size: 16px;
  font-weight: 650;
  transition: transform 160ms var(--sky-ease-out);
}

.agentride-primary:active:not(:disabled) {
  transform: scale(0.985);
}

/* Desactive, le bouton restait or delave : il donnait l'impression d'un
   composant casse plutot que d'une action indisponible. */
.agentride-primary:disabled {
  color: var(--ride-muted) !important;
  background: var(--sky-surface-muted) !important;
  opacity: 1;
}

.agentride-player-driver-notice {
  margin: 2px 7px 8px;
  color: var(--ride-muted);
  font-size: 12px;
  line-height: 17px;
}

.agentride-primary :deep(svg) {
  margin-left: 4px;
}

.agentride-quote-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 5px 12px;
  color: var(--ride-muted);
  font-size: 12px;
}

.agentride-quote-chip {
  min-width: 0;
  padding-inline: 8px;
  color: var(--ride-muted);
  font-size: 10px;
}

.agentride-quote-summary :deep(button) {
  margin-left: auto;
}

.agentride-service-list :deep(li.is-selected) {
  box-shadow: inset 3px 0 var(--ride-accent);
}

.agentride-service-list :deep(li.is-unavailable) {
  cursor: default;
  opacity: 0.45;
}

.agentride-service-list :deep(.sky-list-item__after) {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ride-text);
}

.agentride-fare-card {
  margin: 0 0 13px;
  padding: 14px;
}

.agentride-fare-card__heading {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  margin-bottom: 11px;
}

.agentride-fare-card__icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 12px;
  color: #151515;
  background: var(--ride-accent);
}

.agentride-fare-card__heading > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.agentride-fare-card__heading small,
.agentride-fare-card__heading > span:last-child,
.agentride-fare-breakdown span {
  color: var(--ride-muted);
  font-size: 10px;
}

.agentride-fare-card__heading strong {
  font-size: 17px;
}

.agentride-fare-card__heading > span:last-child {
  max-width: 96px;
  text-align: right;
}

.agentride-fare-card > :deep(.sky-segmented) {
  width: 100%;
}

.agentride-fare-breakdown {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 11px;
  padding: 10px 11px;
  border-radius: 12px;
  background: var(--ride-border);
}

.agentride-custom-fare {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.agentride-custom-fare :deep(.sky-list) {
  margin: 0;
}

.agentride-custom-fare > :deep(button) {
  width: 100%;
}

.agentride-service-icon,
.agentride-activity-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 12px;
  color: #151515;
  background: var(--ride-accent);
}

.agentride-person-card,
.agentride-message-contact {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 16px;
}

.agentride-person-card {
  margin-bottom: 12px;
}

.agentride-avatar,
.agentride-profile-avatar {
  display: grid;
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  place-items: center;
  overflow: hidden;
  border: 2px solid var(--ride-accent);
  border-radius: 50%;
  color: var(--ride-muted);
  background: var(--ride-bg);
}

.agentride-avatar img,
.agentride-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.agentride-person-card__body,
.agentride-message-contact > div:nth-child(2) {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.agentride-person-card__body > span,
.agentride-message-contact > div:nth-child(2) span {
  display: flex;
  align-items: center;
  gap: 3px;
  color: var(--ride-muted);
  font-size: 12px;
}

.agentride-person-card__body b {
  width: fit-content;
  margin-top: 2px;
  padding: 2px 6px;
  border-radius: 5px;
  color: var(--ride-text);
  background: var(--ride-border);
  font-size: 10px;
  letter-spacing: 0.8px;
}

.agentride-contact-actions,
.agentride-active-actions,
.agentride-driver-actions,
.agentride-contact-buttons {
  display: flex;
  gap: 8px;
}

.agentride-contact-actions {
  flex: 0 0 auto;
  margin-left: auto;
}

.agentride-contact-actions :deep(button) {
  width: 36px;
  min-width: 36px;
  flex: 0 0 36px;
  padding-inline: 0;
}

.agentride-trip-card {
  margin-bottom: 12px;
  padding: 16px;
}

.agentride-route-stop {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  column-gap: 11px;
}

.agentride-route-stop > .agentride-dot {
  justify-self: center;
}

.agentride-route-stop > svg {
  width: 18px;
  height: 18px;
  color: var(--ride-accent-strong);
}

.agentride-route-stop > div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
}

.agentride-route-stop small,
.agentride-person-card small {
  color: var(--ride-muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.agentride-route-stop strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agentride-trip-card > i {
  display: block;
  width: 1px;
  height: 17px;
  margin: 1px 0 1px 8px;
  border-left: 1px dashed var(--ride-muted);
}

.agentride-trip-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 13px;
  padding-top: 11px;
  border-top: 1px solid var(--ride-border);
  color: var(--ride-muted);
  font-size: 12px;
}

.agentride-trip-meta strong {
  color: var(--ride-text);
  font-size: 14px;
}

.agentride-active-actions > *,
.agentride-driver-actions > *,
.agentride-contact-buttons > * {
  flex: 1;
}

.agentride-active-actions :deep(button),
.agentride-driver-actions :deep(button),
.agentride-contact-buttons :deep(button) {
  gap: 6px;
}

.agentride-safety-note,
.agentride-member-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 2px 0;
  color: var(--ride-muted);
  font-size: 11px;
  line-height: 1.35;
}

.agentride-safety-note svg,
.agentride-member-note svg {
  flex: 0 0 auto;
  color: var(--ride-accent-strong);
}

.agentride-driver-status {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 11px;
  margin-bottom: 14px;
  padding: 16px;
}

.agentride-driver-status__icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 14px;
  color: var(--ride-muted);
  background: var(--ride-border);
}

.agentride-driver-status__icon.is-online {
  color: #151515;
  background: var(--ride-accent);
}

.agentride-driver-status > div:nth-child(2) {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.agentride-driver-status span,
.agentride-driver-metrics span,
.agentride-request-card span,
.agentride-history-card span {
  color: var(--ride-muted);
  font-size: 12px;
  line-height: 16px;
}

.agentride-driver-metrics :deep(.sky-card) {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 16px;
}

.agentride-driver-metrics strong {
  margin-top: 3px;
  font-size: 19px;
}

.agentride-request-list,
.agentride-history-list {
  display: grid;
  gap: 10px;
}

.agentride-history-list {
  margin: 0;
  padding: 0;
}

.agentride-request-card__top,
.agentride-history-card__header {
  display: flex;
  align-items: center;
  gap: 9px;
}

.agentride-request-card__top > div,
.agentride-history-card__header > div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.agentride-request-card__top > div > span,
.agentride-history-card__header > div > span {
  font-size: 11px;
  line-height: 15px;
}

/* Le trajet etait enferme dans une pastille grise qui decoupait la carte en
   bandes ; il redevient une simple ligne, avec la fleche en couleur d'accent. */
.agentride-request-route,
.agentride-history-route {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  margin: 8px 0 10px;
  padding: 0;
  border-radius: 0;
  background: transparent;
}

.agentride-request-route > svg,
.agentride-history-route > svg {
  color: var(--ride-accent-strong);
}

.agentride-request-route span,
.agentride-history-route span {
  overflow: hidden;
  color: var(--ride-text);
  font-size: 13.5px;
  font-weight: 550;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Pastille d'etat teintee plutot qu'or plein : elle informe sans concurrencer
   le prix, seule valeur que la carte met en avant. */
.agentride-status-badge {
  padding: 3px 9px;
  border-radius: var(--sky-radius-pill);
  color: var(--ride-accent-strong) !important;
  background: rgb(245 197 24 / 20%) !important;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: -0.1px;
  text-transform: none;
}

.agentride-request-route span:last-child,
.agentride-history-route span:last-child {
  text-align: right;
}

.agentride-empty-card {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 7px;
  padding: 27px 16px;
  text-align: center;
}

.agentride-empty-card svg {
  color: var(--ride-accent-strong);
}

.agentride-empty-card p {
  max-width: 250px;
  margin: 0;
  color: var(--ride-muted);
  font-size: 12px;
  line-height: 1.45;
}

.agentride-screen-title {
  justify-content: flex-start;
  margin: 0 0 8px;
}

.agentride-screen-title > svg {
  color: var(--ride-accent-strong);
}

.agentride-history-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.agentride-history-card__meta {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.agentride-history-card__distance {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.agentride-history-card__distance > svg {
  flex: 0 0 auto;
  color: var(--ride-accent-strong);
}

.agentride-message-contact > svg {
  color: var(--ride-muted);
}

.agentride-contact-buttons {
  margin: 10px 0 0;
  padding: 0;
}

.agentride-profile-hero {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 8px 0 18px;
}

.agentride-profile-avatar {
  width: 78px;
  height: 78px;
  border-width: 3px;
  box-shadow: 0 0 0 5px rgba(245, 197, 24, 0.13);
}

button.agentride-profile-avatar--editable {
  position: relative;
  padding: 0;
  cursor: pointer;
  font: inherit;
}

.agentride-profile-avatar--editable:focus-visible {
  outline: 3px solid var(--ride-accent-strong);
  outline-offset: 5px;
}

.agentride-profile-avatar--editable > span {
  position: absolute;
  right: -1px;
  bottom: -1px;
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  border: 2px solid var(--ride-bg);
  border-radius: 50%;
  color: #171719;
  background: var(--ride-accent);
}

.agentride-profile-hero h1 {
  margin: 12px 0 3px;
  font-size: 22px;
}

.agentride-profile-hero > span {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ride-accent-strong);
  font-weight: 700;
}

.agentride-profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-bottom: 17px;
  padding: 13px 4px;
  border: 1px solid var(--ride-border);
  border-radius: 17px;
  background: var(--ride-card);
  box-shadow: 0 7px 23px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.agentride-profile-stats > div {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  gap: 2px;
  padding-inline: 4px;
  text-align: center;
}

.agentride-profile-stats > div + div {
  border-left: 1px solid var(--ride-border);
}

.agentride-profile-stats strong {
  font-size: 16px;
}

.agentride-profile-stats span {
  color: var(--ride-muted);
  font-size: 9px;
  line-height: 1.15;
}

.agentride-tabbar {
  z-index: 25;
  color: var(--ride-text);
}

.agentride-tabbar :deep(.sky-tabbar__inner),
.agentride-tabbar :deep(.sky-tabbar__pane) {
  width: 100% !important;
  max-width: none !important;
  gap: 0 !important;
}

.agentride-tabbar :deep(.sky-tabbar__blur),
.agentride-tabbar :deep(.sky-tabbar__background) {
  display: none;
}

.agentride-tab-pane {
  width: 100% !important;
  max-width: none !important;
  display: flex;
  align-items: stretch;
  gap: 0 !important;
}

.agentride-tab-pane :deep(> .sky-tab-button) {
  flex: 1 1 20%;
  min-width: 0 !important;
  padding-inline: 1px !important;
  outline: none;
}

.agentride-tab-pane :deep(> .sky-tab-button .sky-tab-button__label) {
  max-width: 100%;
  overflow: hidden;
  font-size: 10px;
  font-weight: 600;
  line-height: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agentride-tab-pane :deep(> .sky-tab-button .sky-tab-button__icon) {
  width: 24px;
  height: 24px;
}

.agentride-tab-pane :deep(> .sky-tab-button .sky-tab-button__icon > svg) {
  display: block;
  width: 23px;
  height: 23px;
}

.agentride-sheet__content {
  max-height: 74vh;
  overflow-y: auto;
  padding: 8px 14px calc(24px + env(safe-area-inset-bottom));
  color: var(--ride-text);
  background: var(--ride-bg);
  border-radius: 26px 26px 0 0;
}

.agentride-profile-editor {
  box-sizing: border-box;
  min-height: 0;
  padding: 4px 14px calc(var(--sky-safe-area-bottom) + 12px);
  color: var(--ride-text);
  background: var(--ride-bg);
  border-radius: 0 0 28px 28px;
}

.agentride-profile-sheet :deep(.sky-overlay-backdrop) {
  background: rgba(0, 0, 0, 0.38);
}

.agentride-profile-sheet :deep(.sky-sheet__panel) {
  top: auto;
  max-height: 78%;
  overflow-x: hidden;
  overflow-y: auto;
  border: 0;
  border-radius: 28px 28px 0 0;
  background: var(--ride-bg);
  box-shadow: none;
}

.agentride-profile-editor__avatar {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 11px;
  padding: 8px 0 18px;
}

.agentride-profile-editor__avatar > strong {
  font-size: 14px;
}

.agentride-profile-editor__avatar > div:last-child,
.agentride-profile-editor__actions {
  display: flex;
  width: 100%;
  gap: 9px;
}

.agentride-profile-editor__avatar > div:last-child {
  justify-content: center;
}

.agentride-profile-editor__avatar :deep(.sky-button) {
  gap: 6px;
}

.agentride-profile-editor__avatar :deep(.agentride-profile-media-button) {
  border-color: var(--ride-profile-media-bg);
  background: var(--ride-profile-media-bg);
  color: #fff !important;
}

.agentride-profile-editor__avatar
  :deep(.agentride-profile-media-button:active:not(:disabled)) {
  border-color: var(--ride-profile-media-bg);
  background: var(--ride-profile-media-bg);
  color: #fff !important;
  filter: brightness(0.9);
}

.agentride-profile-editor__actions {
  margin-top: 4px;
}

.agentride-profile-editor__actions :deep(.sky-button) {
  flex: 1 1 0;
}

.agentride-sheet__handle {
  width: 38px;
  height: 5px;
  margin: 0 auto 14px;
  border-radius: 9px;
  background: var(--ride-muted);
  opacity: 0.65;
}

.agentride-sheet__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 4px 13px;
}

.agentride-sheet__title span,
.agentride-rating-label {
  color: var(--ride-muted);
  font-size: 11px;
  font-weight: 650;
  line-height: 14px;
  text-transform: uppercase;
  letter-spacing: 0.65px;
}

.agentride-sheet__title h2,
.agentride-rating h2 {
  margin: 3px 0 0;
  color: var(--ride-text);
  font-size: 22px;
  font-weight: 700;
  line-height: 27px;
  letter-spacing: -0.35px;
}

.agentride-sheet__close {
  display: grid;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  margin-right: -8px;
  place-items: center;
  border-radius: 50%;
}

.agentride-sheet-list {
  margin-block: 0 !important;
}

.agentride-sheet-list :deep(.text-\[17px\]) {
  color: var(--ride-text);
  font-size: 16px;
  line-height: 21px;
}

.agentride-sheet-list :deep(.text-sm) {
  color: var(--ride-muted);
  font-size: 13px;
  line-height: 18px;
}

.agentride-sheet-section-title {
  height: auto !important;
  margin: 22px 4px 10px !important;
  padding: 0 !important;
  color: var(--ride-muted) !important;
  font-size: 15px !important;
  font-weight: 650 !important;
  line-height: 20px !important;
}

.agentride-saved-list {
  margin-bottom: 4px !important;
}

.agentride-rating {
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.agentride-rating__success {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border-radius: 20px;
  color: #151515;
  background: var(--ride-accent);
}

.agentride-rating p {
  max-width: 270px;
  margin: 4px 0 12px;
  color: var(--ride-muted);
  font-size: 12px;
}

.agentride-rating-stars {
  display: flex;
  gap: 5px;
  margin-bottom: 17px;
}

.agentride-rating-star {
  width: 34px;
  min-width: 34px;
  height: 34px;
  padding: 2px;
  color: var(--ride-border);
}

.agentride-rating-star.is-active {
  color: var(--ride-accent);
}

.agentride-tip-options {
  display: flex;
  gap: 6px;
  margin: 8px 0 12px;
}

.agentride-rating :deep(.sky-list) {
  width: 100%;
}

.agentride-rating > :deep(button) {
  width: 100%;
}

.agentride-rating > :deep(a),
.agentride-rating > :deep(.sky-link) {
  margin-top: 11px;
}

.agentride-dialog {
  padding: 20px 20px 8px;
  color: var(--ride-text);
  text-align: center;
}

.agentride-dialog h2 {
  margin: 0 0 7px;
  font-size: 18px;
}

.agentride-dialog p {
  margin: 0;
  color: var(--ride-muted);
  font-size: 13px;
  line-height: 1.4;
}

.agentride-app :deep(.bg-primary) {
  color: #141414;
  background-color: var(--ride-accent);
}

.agentride-app :deep(.sky-button--primary:not(.sky-button--outline)) {
  color: #171719;
}

.agentride-app :deep(.text-primary) {
  color: var(--ride-accent-strong);
}

.agentride-app--dark :deep(.text-primary) {
  color: var(--ride-accent);
}

@media (max-height: 730px) {
  .agentride-home-panel,
  .agentride-section-screen {
    padding-top: 14px;
  }
}
</style>
