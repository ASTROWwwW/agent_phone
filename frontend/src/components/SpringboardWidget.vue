<script setup lang="ts">
import {
  Banknote,
  MessageCircle,
  Music2,
  Pause,
  Phone,
  Play,
  SkipForward,
  WalletCards,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

import WeatherConditionIcon from '@/components/WeatherConditionIcon.vue'
import { WIDGET_REGISTRY_BY_KIND } from '@/config/widgets'
import {
  useBankService,
  useCalendarService,
  useClockService,
  useContactsService,
  useMusicService,
  useWeatherService,
} from '@/services/widgetServices'
import { useCallsStore } from '@/stores/calls'
import { useMessagesStore } from '@/stores/messages'
import { usePhoneStore } from '@/stores/phone'
import type { WidgetInstance } from '@/types/widgets'
import { SkyWidgetFrame } from '@/ui'
import {
  reorderDirectionFromKeyboard,
  type ReorderDirection,
} from '@/utils/keyboard'
import {
  readSpringboardDragMetrics,
  springboardPageDragCompensation,
  springboardSwipeIntent,
  springboardViewportDeltaToLocal,
  type SpringboardDragMetrics,
} from '@/utils/springboardDrag'
import { WIDGET_SPANS } from '@/utils/widgetLayout'

const props = withDefaults(
  defineProps<{
    editMode?: boolean
    instance: WidgetInstance
    interactive?: boolean
    preview?: boolean
  }>(),
  { editMode: false, interactive: true, preview: false },
)
const emit = defineEmits<{
  dragcancel: []
  dragend: [event: PointerEvent]
  dragmove: [event: PointerEvent]
  dragstart: [event: PointerEvent]
  menu: []
  remove: []
  reorder: [direction: ReorderDirection]
}>()

const phone = usePhoneStore()
const calls = useCallsStore()
const messages = useMessagesStore()
const router = useRouter()
const usesClock = computed(() =>
  ['clock', 'date'].includes(props.instance.kind),
)
const usesBank = computed(() =>
  ['transactions', 'wallet'].includes(props.instance.kind),
)
const usesContacts = computed(() => props.instance.kind === 'contacts')
const usesCalendar = computed(() => props.instance.kind === 'date')
const clock = useClockService(usesClock)
const weather = useWeatherService()
const music = useMusicService()
const bank = useBankService(usesBank)
const contactsService = useContactsService(usesContacts)
const calendarService = useCalendarService(usesCalendar)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const suppressClick = ref(false)
let holdTimer: number | undefined
let pointerStart = { x: 0, y: 0 }
let dragStartPage = 0
let dragPageWidth = 0
let dragMetrics: SpringboardDragMetrics | null = null
let pointerTarget: HTMLElement | null = null
let pointerId: number | null = null

const span = computed(() => WIDGET_SPANS[props.instance.size])
const placementStyle = computed(() =>
  props.preview
    ? undefined
    : {
        gridColumn: `${props.instance.column + 1} / span ${span.value.columns}`,
        gridRow: `${props.instance.row + 1} / span ${span.value.rows}`,
        transform: isDragging.value
          ? `translate3d(${springboardPageDragCompensation(dragStartPage, phone.currentPage, dragPageWidth)}px, 0, 0)`
          : undefined,
      },
)
const dragPointerStyle = computed(() =>
  isDragging.value
    ? {
        transform: `translate3d(${dragOffset.value.x}px, ${dragOffset.value.y}px, 0) scale(1.035)`,
      }
    : undefined,
)
const forecastHigh = computed(() =>
  weather.forecast.value?.hourly.length
    ? Math.max(
        ...weather.forecast.value.hourly.map((entry) => entry.temperature),
      )
    : null,
)
const forecastLow = computed(() =>
  weather.forecast.value?.hourly.length
    ? Math.min(
        ...weather.forecast.value.hourly.map((entry) => entry.temperature),
      )
    : null,
)
const weatherConditionId = computed(
  () => weather.forecast.value?.condition ?? 'partly_cloudy',
)
const weatherDayPhase = computed(() => {
  const timestamp = weather.forecast.value?.timestamp
  if (timestamp === undefined) return 'day'
  const hour = new Date(timestamp).getUTCHours()
  return hour >= 7 && hour < 20 ? 'day' : 'night'
})
const weatherRainy = computed(
  () =>
    weatherConditionId.value === 'rain' ||
    weatherConditionId.value === 'thunder',
)
// Colonne, longueur, duree de chute, retard. Une trame repetee ne convenait
// pas : des traits verticaux que l'on translate verticalement paraissent
// immobiles. Huit gouttes reelles suffisent a lire l'averse.
const widgetRainDrops = [
  ['8%', '9px', '1.6s', '-0.2s'],
  ['17%', '7px', '2s', '-1.1s'],
  ['27%', '12px', '1.7s', '-0.7s'],
  ['36%', '8px', '2.2s', '-1.6s'],
  ['45%', '10px', '1.8s', '-0.4s'],
  ['54%', '7px', '2.1s', '-1.3s'],
  ['63%', '13px', '1.65s', '-0.9s'],
  ['72%', '8px', '1.95s', '-0.6s'],
  ['81%', '11px', '1.75s', '-1.45s'],
  ['89%', '9px', '2.05s', '-0.35s'],
  ['97%', '7px', '1.85s', '-1.2s'],
].map(([left, height, duration, delay]) => ({
  '--widget-rain-delay': delay,
  '--widget-rain-duration': duration,
  '--widget-rain-height': height,
  '--widget-rain-left': left,
}))
const visibleHourlyWeather = computed(
  () =>
    weather.forecast.value?.hourly.slice(
      0,
      props.instance.size === 'large' ? 5 : 3,
    ) ?? [],
)
const widgetLabel = computed(() => {
  const definition = WIDGET_REGISTRY_BY_KIND.get(props.instance.kind)
  return phone.t(definition?.homeLabelKey ?? definition?.labelKey ?? '')
})
const balance = computed(() =>
  props.instance.settings.balanceSource === 'cash'
    ? bank.overview.value.cash
    : bank.overview.value.bank,
)
const favoriteContacts = computed(() => {
  const selected = props.instance.settings.contactIds ?? []
  const ordered = selected.length
    ? selected
        .map((id) =>
          contactsService.contacts.value.find((contact) => contact.id === id),
        )
        .filter((contact) => contact !== undefined)
    : contactsService.contacts.value
  return ordered.slice(0, props.instance.size === 'large' ? 6 : 4)
})
const visibleTransactions = computed(() =>
  bank.overview.value.transactions.slice(
    0,
    props.instance.size === 'large' ? 5 : 2,
  ),
)
function formatMoney(value: number): string {
  return `${bank.overview.value.currency}${new Intl.NumberFormat(phone.lang, {
    maximumFractionDigits: 0,
  }).format(value)}`
}

function avatar(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase(phone.lang) || '?'
}

// Teinte de la pastille derivee du nom plutot que du rang dans la grille : un
// contact garde sa couleur meme si l'ordre des favoris change.
const AVATAR_HUE_BASE = 210
const AVATAR_HUE_SPREAD = 88

function contactHue(name: string): number {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 100003
  }
  return AVATAR_HUE_BASE + (hash % AVATAR_HUE_SPREAD)
}

// La reference interne d'un mouvement n'apprend rien au joueur : on affiche
// le moment ou il a eu lieu, comme la liste de l'application Banking.
function formatTransactionMoment(createdAt: number): string {
  return new Intl.DateTimeFormat(phone.lang, {
    day: 'numeric',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: 'short',
  }).format(createdAt)
}

// Trois rendez-vous au plus dans un widget moyen : au-dela la colonne se
// tasse et rien n'est lisible.
const visibleEvents = computed(() =>
  calendarService.events.value.slice(0, props.instance.size === 'large' ? 5 : 3),
)

function formatEventHour(timestamp: number): string {
  return new Intl.DateTimeFormat(phone.lang, {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
  }).format(timestamp)
}

function formatForecastHour(timestamp: number): string {
  return new Intl.DateTimeFormat(phone.lang, {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
  }).format(timestamp)
}

function clearHold(): void {
  if (holdTimer !== undefined) window.clearTimeout(holdTimer)
  holdTimer = undefined
}

function onPointerDown(event: PointerEvent): void {
  if (
    !props.interactive ||
    props.preview ||
    event.button !== 0 ||
    (event.target as HTMLElement).closest('[data-widget-control]')
  ) {
    return
  }
  suppressClick.value = false
  pointerTarget = event.currentTarget as HTMLElement
  pointerId = event.pointerId
  pointerTarget.setPointerCapture(pointerId)
  pointerStart = { x: event.clientX, y: event.clientY }
  clearHold()
  if (props.editMode) {
    beginDrag(event)
    return
  }
  holdTimer = window.setTimeout(() => {
    suppressClick.value = true
    emit('menu')
    holdTimer = undefined
  }, 520)
}

function onPointerMove(event: PointerEvent): void {
  if (isDragging.value) {
    const deltaX = event.clientX - pointerStart.x
    const deltaY = event.clientY - pointerStart.y
    dragOffset.value = dragMetrics
      ? springboardViewportDeltaToLocal(
          deltaX,
          deltaY,
          dragMetrics.viewportWidth,
          dragMetrics.viewportHeight,
          dragMetrics.layoutWidth,
          dragMetrics.layoutHeight,
        )
      : { x: deltaX, y: deltaY }
    emit('dragmove', event)
    return
  }
  if (
    springboardSwipeIntent(
      event.clientX - pointerStart.x,
      event.clientY - pointerStart.y,
    ) !== 'pending'
  ) {
    suppressClick.value = true
    clearHold()
  }
}

function beginDrag(event: PointerEvent): void {
  dragStartPage = phone.currentPage
  const element =
    event.currentTarget instanceof Element
      ? event.currentTarget
      : event.target instanceof Element
        ? event.target
        : null
  dragMetrics = readSpringboardDragMetrics(element)
  dragPageWidth = dragMetrics?.layoutWidth ?? 0
  isDragging.value = true
  emit('dragstart', event)
}

function onPointerUp(event: PointerEvent): void {
  clearHold()
  if (isDragging.value) {
    suppressClick.value = true
    emit('dragend', event)
    isDragging.value = false
    dragOffset.value = { x: 0, y: 0 }
  }
  releasePointerCapture()
}

function cancelDrag(): void {
  clearHold()
  const wasDragging = isDragging.value
  isDragging.value = false
  dragOffset.value = { x: 0, y: 0 }
  releasePointerCapture()
  if (wasDragging) emit('dragcancel')
}

function releasePointerCapture(): void {
  if (
    pointerTarget &&
    pointerId !== null &&
    pointerTarget.hasPointerCapture(pointerId)
  ) {
    pointerTarget.releasePointerCapture(pointerId)
  }
  pointerTarget = null
  pointerId = null
  dragMetrics = null
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.editMode) return
  const direction = reorderDirectionFromKeyboard(event)
  if (!direction) return
  event.preventDefault()
  event.stopPropagation()
  emit('reorder', direction)
}

function openWidget(): void {
  if (props.editMode || suppressClick.value || !props.interactive) {
    suppressClick.value = false
    return
  }
  const routes: Partial<Record<WidgetInstance['kind'], string>> = {
    clock: '/apps/clock',
    contacts: '/apps/phone',
    date: '/apps/calendar',
    music: '/apps/music',
    transactions: '/apps/banking',
    wallet: '/apps/banking',
    weather: '/apps/weather',
  }
  const route = routes[props.instance.kind]
  if (route) {
    phone.setLaunchOrigin(null)
    void router.push(route)
  }
}

async function callContact(phoneNumber: string): Promise<void> {
  await calls.dial(phoneNumber)
  phone.setLaunchOrigin(null)
  void router.push('/apps/phone')
}

async function messageContact(phoneNumber: string): Promise<void> {
  await messages.openThread(phoneNumber)
  phone.setLaunchOrigin(null)
  void router.push('/apps/messages')
}

onBeforeUnmount(() => {
  clearHold()
  releasePointerCapture()
})
</script>

<template>
  <div
    class="home-widget-shell"
    :class="[
      `home-widget-shell--${instance.size}`,
      {
        'home-widget-shell--dragging': isDragging,
        'home-widget-shell--editing': editMode,
        'home-widget-shell--preview': preview,
      },
    ]"
    :style="placementStyle"
    :data-widget-id="instance.id"
  >
    <SkyWidgetFrame
      class="home-widget-drag-surface"
      :label="widgetLabel"
      :show-label="!preview"
      :size="instance.size"
      :style="dragPointerStyle"
    >
      <article
        class="home-widget"
        :class="[
          `home-widget--${instance.kind}`,
          {
            'phone-effect--solid-surface': instance.kind !== 'weather',
            'home-widget--music-empty':
              instance.kind === 'music' && !music.current.value,
          },
        ]"
        :data-weather-condition="
          instance.kind === 'weather' ? weatherConditionId : undefined
        "
        :data-weather-period="
          instance.kind === 'weather' ? weatherDayPhase : undefined
        "
        @click="openWidget"
        @contextmenu.prevent
        @lostpointercapture="cancelDrag"
        @pointercancel="cancelDrag"
        @pointerdown="onPointerDown"
        @pointerleave="isDragging || clearHold()"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
      >
        <button
          v-if="interactive"
          class="home-widget-open"
          type="button"
          :aria-label="widgetLabel"
          :aria-keyshortcuts="
            editMode ? 'ArrowLeft ArrowRight ArrowUp ArrowDown' : undefined
          "
          @click.stop="openWidget"
          @keydown="onKeydown"
        />
        <template v-if="instance.kind === 'clock'">
          <span class="widget-eyebrow">{{ clock.weekday.value }}</span>
          <strong class="widget-clock">{{ clock.time.value }}</strong>
          <small v-if="instance.settings.showDate !== false">{{
            clock.date.value
          }}</small>
        </template>

        <template v-else-if="instance.kind === 'date'">
          <div class="widget-date-header">
            <span class="widget-date-weekday">{{ clock.weekday.value }}</span>
            <time class="widget-date-time">{{ clock.time.value }}</time>
          </div>
          <div class="widget-date-body">
            <div class="widget-date-mark">
              <strong class="widget-date-day">{{ clock.day.value }}</strong>
              <small>{{ clock.month.value }}</small>
            </div>
            <ul
              v-if="visibleEvents.length"
              class="widget-date-events"
              :aria-label="phone.t('Apps.calendar.name')"
            >
              <li v-for="event in visibleEvents" :key="event.id">
                <time>{{ formatEventHour(event.startsAt) }}</time>
                <span>{{ event.title }}</span>
              </li>
            </ul>
            <p v-else class="widget-date-empty">
              {{ phone.t('Apps.calendar.noEvents') }}
            </p>
          </div>
        </template>

        <template v-else-if="instance.kind === 'weather'">
          <span
            class="widget-weather-sky phone-effect--decorative"
            aria-hidden="true"
          >
            <template v-if="weatherRainy">
              <i
                v-for="(drop, index) in widgetRainDrops"
                :key="index"
                :style="drop"
              ></i>
            </template>
          </span>
          <div v-if="weather.forecast.value" class="widget-weather-summary">
            <span class="widget-weather-location">{{
              weather.location.value
            }}</span>
            <strong class="widget-weather-temperature"
              >{{ weather.forecast.value?.temperature ?? '--' }}°</strong
            >
            <div class="widget-weather-current">
              <WeatherConditionIcon
                :condition="weather.forecast.value.condition"
                :timestamp="weather.forecast.value.timestamp"
                :size="23"
              />
              <div>
                <small>{{ weather.condition.value }}</small>
                <small class="widget-weather-range">
                  {{
                    phone.t('Home.widgetSystem.weather.range', {
                      high: String(forecastHigh ?? '--'),
                      low: String(forecastLow ?? '--'),
                    })
                  }}
                </small>
              </div>
            </div>
          </div>
          <div v-else class="widget-weather-unavailable">
            {{
              phone.t(
                weather.loading.value
                  ? 'Common.loading'
                  : 'Apps.weather.unavailable',
              )
            }}
          </div>
          <div
            v-if="weather.forecast.value && instance.size !== 'small'"
            class="widget-weather-hourly"
          >
            <div v-for="hour in visibleHourlyWeather" :key="hour.timestamp">
              <time>{{ formatForecastHour(hour.timestamp) }}</time>
              <WeatherConditionIcon
                :condition="hour.condition"
                :timestamp="hour.timestamp"
                :size="21"
              />
              <strong>{{ hour.temperature }}°</strong>
            </div>
          </div>
        </template>

        <template v-else-if="instance.kind === 'music'">
          <div class="widget-album" aria-hidden="true">
            <img
              v-if="music.current.value?.artwork"
              :src="music.current.value.artwork"
              alt=""
              draggable="false"
            />
            <Music2 v-else :size="36" />
          </div>
          <div class="widget-music-body">
            <Music2 class="widget-music-mark" :size="22" aria-hidden="true" />
            <div v-if="music.current.value" class="widget-music-copy">
              <strong>{{ music.current.value.title }}</strong>
              <small>{{ music.current.value.artist }}</small>
              <span class="widget-music-progress" aria-hidden="true">
                <i :style="{ width: `${music.progress.value}%` }" />
              </span>
            </div>
            <div v-else class="widget-music-placeholder" aria-hidden="true">
              <span />
              <span />
            </div>
            <div
              v-if="music.current.value"
              class="widget-music-controls"
              data-widget-control
            >
              <button
                type="button"
                :aria-label="
                  phone.t(
                    music.playing.value
                      ? 'Home.widgets.media.pause'
                      : 'Home.widgets.media.play',
                  )
                "
                @click.stop="music.toggle"
              >
                <Pause
                  v-if="music.playing.value"
                  :size="20"
                  fill="currentColor"
                  aria-hidden="true"
                />
                <Play
                  v-else
                  :size="20"
                  fill="currentColor"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                :aria-label="phone.t('ControlCenter.next')"
                @click.stop="music.next"
              >
                <SkipForward
                  :size="19"
                  fill="currentColor"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          <p v-if="!music.current.value" class="widget-music-empty">
            {{ phone.t('Home.widgetSystem.music.empty') }}
          </p>
        </template>

        <template v-else-if="instance.kind === 'wallet'">
          <div class="widget-wallet-icon"><WalletCards :size="22" /></div>
          <span class="widget-eyebrow">{{
            phone.t(
              instance.settings.balanceSource === 'cash'
                ? 'Home.widgetSystem.wallet.cash'
                : 'Home.widgetSystem.wallet.bank',
            )
          }}</span>
          <strong class="widget-balance">{{ formatMoney(balance) }}</strong>
          <small>{{ bank.overview.value.playerName }}</small>
        </template>

        <template v-else-if="instance.kind === 'transactions'">
          <header class="widget-list-header">
            <span>{{ phone.t('Home.widgetSystem.transactions.name') }}</span>
            <Banknote :size="19" />
          </header>
          <button
            v-for="transaction in visibleTransactions"
            :key="transaction.id"
            type="button"
            class="widget-transaction"
            data-widget-control
            @click.stop="openWidget"
          >
            <span>
              <strong>{{ transaction.label }}</strong>
              <small>{{ formatTransactionMoment(transaction.createdAt) }}</small>
            </span>
            <b
              :class="{
                positive:
                  transaction.kind === 'deposit' ||
                  transaction.kind === 'transfer_in',
              }"
              >{{
                transaction.kind === 'deposit' ||
                transaction.kind === 'transfer_in'
                  ? '+'
                  : '−'
              }}{{ formatMoney(transaction.amount) }}</b
            >
          </button>
        </template>

        <template v-else-if="instance.kind === 'contacts'">
          <header class="widget-list-header">
            <span>{{ phone.t('Home.widgetSystem.contacts.name') }}</span>
          </header>
          <div class="widget-contacts">
            <article v-for="contact in favoriteContacts" :key="contact.id">
              <span class="widget-contact-mark" data-widget-control>
                <button
                  type="button"
                  class="widget-contact-avatar"
                  :style="{ '--widget-avatar-hue': contactHue(contact.name) }"
                  :aria-label="phone.t('Apps.messages.call')"
                  @click.stop="callContact(contact.phone_number)"
                >
                  {{ avatar(contact.name) }}
                </button>
                <button
                  type="button"
                  class="widget-contact-message"
                  :aria-label="phone.t('Apps.messages.messageAction')"
                  @click.stop="messageContact(contact.phone_number)"
                >
                  <MessageCircle :size="12" fill="currentColor" />
                </button>
              </span>
              <strong>{{ contact.name }}</strong>
            </article>
          </div>
        </template>
      </article>
    </SkyWidgetFrame>

    <button
      v-if="editMode && !preview"
      class="home-widget-remove"
      type="button"
      :aria-label="phone.t('Home.widgetSystem.remove')"
      :style="dragPointerStyle"
      @click.stop="emit('remove')"
      @pointerdown.stop
    >
      <span aria-hidden="true">−</span>
    </button>
  </div>
</template>

<style scoped>
.home-widget-shell {
  position: relative;
  z-index: 2;
  min-width: 0;
  min-height: 0;
  transition:
    transform 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.2s ease;
}

.home-widget-shell--dragging {
  z-index: 40;
  opacity: 0.86;
  transition:
    transform var(--springboard-page-duration) var(--springboard-page-easing),
    opacity 0.2s ease;
  pointer-events: none;
}

.home-widget-shell--editing:not(.home-widget-shell--dragging) {
  animation: widget-wobble 0.17s ease-in-out infinite alternate;
}

.home-widget-shell--preview {
  width: 100%;
  aspect-ratio: 2 / 1;
}

.home-widget-shell--preview.home-widget-shell--small {
  max-width: 150px;
  aspect-ratio: 1;
}

.home-widget-shell--preview.home-widget-shell--large {
  aspect-ratio: 1;
}

.home-widget {
  --phone-effect-solid-background: #19191b;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 15px;
  overflow: hidden;
  border: 0.75px solid rgb(255 255 255 / 17%);
  border-radius: var(--sky-widget-radius-medium);
  outline: none;
  color: #fff;
  background: rgb(25 25 27 / 91%);
  box-shadow:
    0 10px 25px rgb(0 0 0 / 28%),
    inset 0 0.75px rgb(255 255 255 / 15%);
  backdrop-filter: blur(26px) saturate(125%);
  -webkit-backdrop-filter: blur(26px) saturate(125%);
  cursor: pointer;
  font-family: var(--sky-font-family);
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.home-widget-shell--small .home-widget {
  padding: 13px;
  border-radius: var(--sky-widget-radius-small);
}

.home-widget-shell--large .home-widget {
  padding: 18px;
  border-radius: var(--sky-widget-radius-large);
}

.home-widget:active {
  filter: brightness(1.08);
}

.home-widget-open {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: inherit;
  outline: none;
  color: transparent;
  background: transparent;
  box-shadow: none;
  appearance: none;
  cursor: pointer;
}

.home-widget-open:focus-visible {
  box-shadow: inset 0 0 0 2px var(--sky-app-accent, #0a84ff);
}

.home-widget [data-widget-control] {
  position: relative;
  z-index: 2;
}

.home-widget small,
.widget-eyebrow {
  color: rgb(255 255 255 / 62%);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.25;
}

.home-widget--clock,
.home-widget--date,
.home-widget--wallet {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: flex-end;
}

.home-widget--clock {
  background: rgb(12 12 13 / 94%);
}

.widget-clock {
  margin: 2px 0;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -1.8px;
  line-height: 1;
  white-space: nowrap;
}

.home-widget-shell--medium .widget-clock {
  font-size: 48px;
}

.home-widget--date {
  justify-content: flex-start;
  background:
    radial-gradient(
      120% 70% at 50% -14%,
      rgb(255 69 58 / 16%),
      transparent 62%
    ),
    linear-gradient(180deg, rgb(30 24 26 / 95%), rgb(18 17 19 / 96%));
  color: #fff;
}

.home-widget--date small {
  color: rgb(255 255 255 / 55%);
  font-size: 12px;
  font-weight: 500;
}

/* Le chiffre du jour a gauche, les rendez-vous a droite : c'est la
   composition de la vraie tuile Calendrier d'iOS. */
.widget-date-body {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: flex-start;
  gap: 14px;
  margin-top: 26px;
}

.widget-date-mark {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
}

.widget-date-events {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 7px;
  margin: 1px 0 0;
  padding: 0;
  list-style: none;
}

.widget-date-events li {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
  padding-left: 9px;
  border-left: 2px solid #ff453a;
}

.widget-date-events time {
  color: rgb(255 255 255 / 52%);
  font-size: 9.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.widget-date-events span {
  overflow: hidden;
  font-size: 11.5px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.widget-date-empty {
  flex: 1 1 auto;
  margin: 3px 0 0;
  color: rgb(255 255 255 / 40%);
  font-size: 11.5px;
  font-weight: 500;
}

.widget-date-header {
  position: absolute;
  top: 15px;
  right: 15px;
  left: 15px;
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.widget-date-weekday,
.widget-date-time {
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1;
}

.widget-date-weekday {
  color: #ff453a;
}

/* L'heure est une indication secondaire : en rouge elle rivalisait avec le
   jour de la semaine et la carte semblait porter deux titres. */
.widget-date-time {
  color: rgb(255 255 255 / 45%);
  font-weight: 600;
}

.widget-date-weekday {
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.widget-date-time {
  flex: none;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.1px;
}

.widget-date-day {
  font-size: 46px;
  font-weight: 320;
  letter-spacing: -2.6px;
  line-height: 0.92;
}

.home-widget--weather {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(120% 72% at 50% -12%, rgb(122 166 250 / 44%), transparent 64%),
    radial-gradient(78% 44% at 92% 6%, rgb(255 206 132 / 24%), transparent 58%),
    linear-gradient(180deg, #2c3566 0%, #1e2650 34%, #11162e 72%, #0a0b16 100%);
  transition: background 0.35s ease;
}

.home-widget--weather[data-weather-condition='sunny'],
.home-widget--weather[data-weather-condition='clear'][data-weather-period='day'] {
  background:
    radial-gradient(120% 70% at 50% -14%, rgb(255 172 58 / 46%), transparent 62%),
    radial-gradient(76% 42% at 88% 4%, rgb(255 216 128 / 32%), transparent 56%),
    linear-gradient(180deg, #472a58 0%, #32204a 34%, #191530 70%, #0c0a16 100%);
}

.home-widget--weather[data-weather-condition='clear'] {
  background:
    radial-gradient(124% 72% at 50% -12%, rgb(92 132 255 / 44%), transparent 64%),
    radial-gradient(74% 40% at 90% 6%, rgb(150 116 255 / 28%), transparent 58%),
    linear-gradient(180deg, #1f2358 0%, #171b46 34%, #0e1028 70%, #07080f 100%);
}

.home-widget--weather[data-weather-condition='partly_cloudy'] {
  background:
    radial-gradient(120% 72% at 50% -12%, rgb(122 166 250 / 44%), transparent 64%),
    radial-gradient(78% 44% at 92% 6%, rgb(255 206 132 / 24%), transparent 58%),
    linear-gradient(180deg, #2c3566 0%, #1e2650 34%, #11162e 72%, #0a0b16 100%);
}

.home-widget--weather[data-weather-condition='cloudy'] {
  background:
    radial-gradient(122% 72% at 50% -12%, rgb(150 170 205 / 38%), transparent 64%),
    radial-gradient(80% 44% at 92% 8%, rgb(126 148 188 / 24%), transparent 58%),
    linear-gradient(180deg, #363e5a 0%, #262d46 34%, #161b2c 72%, #0a0b12 100%);
}

.home-widget--weather[data-weather-condition='rain'] {
  background:
    radial-gradient(124% 74% at 50% -12%, rgb(78 146 214 / 44%), transparent 64%),
    radial-gradient(78% 42% at 12% 8%, rgb(126 200 240 / 22%), transparent 56%),
    linear-gradient(180deg, #24395c 0%, #1a2a48 34%, #0f172c 72%, #070a12 100%);
}

.home-widget--weather[data-weather-condition='thunder'] {
  background:
    radial-gradient(126% 76% at 50% -12%, rgb(152 118 255 / 46%), transparent 64%),
    radial-gradient(74% 40% at 86% 6%, rgb(202 182 255 / 26%), transparent 56%),
    linear-gradient(180deg, #2e2760 0%, #201c46 34%, #12102a 72%, #08070f 100%);
}

.home-widget--weather[data-weather-condition='fog'] {
  background:
    radial-gradient(128% 78% at 50% -16%, rgb(188 200 212 / 34%), transparent 66%),
    radial-gradient(90% 46% at 50% 48%, rgb(158 174 190 / 20%), transparent 62%),
    linear-gradient(180deg, #414a55 0%, #2c343f 34%, #191f26 72%, #0b0d10 100%);
}

.home-widget--weather[data-weather-condition='snow'] {
  background:
    radial-gradient(124% 74% at 50% -12%, rgb(154 200 255 / 42%), transparent 64%),
    radial-gradient(78% 42% at 88% 6%, rgb(212 234 255 / 28%), transparent 56%),
    linear-gradient(180deg, #31446e 0%, #223052 34%, #141c2e 72%, #080b12 100%);
}

/* -------------------------------------------------------------------------
   Ciel anime. Une seule couche par widget : les gouttes, les flocons et les
   nappes sont des degrades repetes que l'on fait defiler, pas des elements.
   ------------------------------------------------------------------------- */

/* phone-effect--decorative retire cette couche en mode performance : un
   springboard peut porter plusieurs widgets a la fois. */
.widget-weather-sky {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}

.home-widget--weather > *:not(.widget-weather-sky) {
  position: relative;
  z-index: 1;
}

/* Le masque s'applique a l'element et a ses enfants : les gouttes s'effacent
   en descendant vers le releve, au lieu de le traverser. mask-image sans
   prefixe n'arrive qu'avec Chrome 120, c'est la version -webkit- qui compte
   pour le CEF vise. */
[data-weather-condition='rain'] .widget-weather-sky,
[data-weather-condition='thunder'] .widget-weather-sky {
  mask-image: radial-gradient(
    152% 132% at 80% -10%,
    #000 0%,
    rgb(0 0 0 / 70%) 54%,
    transparent 94%
  );
  -webkit-mask-image: radial-gradient(
    152% 132% at 80% -10%,
    #000 0%,
    rgb(0 0 0 / 70%) 54%,
    transparent 94%
  );
}

.widget-weather-sky i {
  position: absolute;
  top: -16px;
  left: var(--widget-rain-left);
  width: 1.2px;
  height: var(--widget-rain-height);
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    transparent,
    rgb(210 242 255 / 85%) 42%,
    transparent
  );
  opacity: 0;
  animation: widget-weather-drop var(--widget-rain-duration) linear
    var(--widget-rain-delay) infinite;
}

[data-weather-condition='thunder'] .widget-weather-sky::after {
  position: absolute;
  inset: 0;
  background: rgb(220 233 255 / 100%);
  mix-blend-mode: screen;
  opacity: 0;
  content: '';
  animation: widget-weather-flash 9s steps(1, end) infinite;
}

[data-weather-condition='snow'] .widget-weather-sky {
  background-image:
    radial-gradient(circle at 18% 12%, #fff 0 1.6px, transparent 2.3px),
    radial-gradient(circle at 62% 30%, #fff 0 1.3px, transparent 2px),
    radial-gradient(circle at 88% 14%, #fff 0 1.5px, transparent 2.2px),
    radial-gradient(circle at 36% 62%, #fff 0 1.3px, transparent 1.9px),
    radial-gradient(circle at 8% 80%, #fff 0 1.6px, transparent 2.3px),
    radial-gradient(circle at 74% 86%, #fff 0 1.4px, transparent 2.1px);
  opacity: 0.34;
  animation: widget-weather-snow 10s linear infinite;
}

[data-weather-condition='partly_cloudy'] .widget-weather-sky,
[data-weather-condition='cloudy'] .widget-weather-sky {
  background-image:
    radial-gradient(
      ellipse 56% 34% at 22% 28%,
      rgb(255 255 255 / 11%),
      transparent 72%
    ),
    radial-gradient(
      ellipse 44% 28% at 72% 64%,
      rgb(255 255 255 / 7%),
      transparent 74%
    );
  background-size: 190% 100%;
  animation: widget-weather-clouds 46s linear infinite;
}

[data-weather-condition='fog'] .widget-weather-sky {
  background-image: linear-gradient(
    180deg,
    transparent 0%,
    rgb(228 236 244 / 12%) 46%,
    transparent 100%
  );
  background-size: 100% 58%;
  animation: widget-weather-fog 24s ease-in-out infinite alternate;
}

[data-weather-condition='sunny'] .widget-weather-sky,
[data-weather-condition='clear'][data-weather-period='day']
  .widget-weather-sky {
  background: radial-gradient(
    circle at 78% 14%,
    rgb(255 226 150 / 22%) 0 7%,
    rgb(255 198 96 / 8%) 22%,
    transparent 48%
  );
  animation: widget-weather-sun 9s ease-in-out infinite alternate;
}

[data-weather-period='night'] .widget-weather-sky::before {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 14% 16%, #fff 0 1px, transparent 1.6px),
    radial-gradient(circle at 44% 9%, rgb(220 236 255 / 100%) 0 1px, transparent 1.5px),
    radial-gradient(circle at 82% 22%, #fff 0 1px, transparent 1.6px),
    radial-gradient(circle at 66% 46%, rgb(220 236 255 / 100%) 0 1px, transparent 1.5px);
  opacity: 0.32;
  content: '';
  animation: widget-weather-twinkle 6s ease-in-out infinite alternate;
}

/* La chute depasse volontairement la hauteur du widget : le conteneur rogne,
   et la meme animation sert aux trois tailles de widget. */
@keyframes widget-weather-drop {
  0% {
    opacity: 0;
    transform: translate(0, 0) rotate(9deg);
  }
  16%,
  78% {
    opacity: 0.52;
  }
  100% {
    opacity: 0;
    transform: translate(22px, 230px) rotate(9deg);
  }
}

@keyframes widget-weather-snow {
  to {
    background-position: -14px 100%;
  }
}

@keyframes widget-weather-clouds {
  to {
    background-position: 190% 0;
  }
}

@keyframes widget-weather-fog {
  from {
    background-position: -30% 22%;
  }
  to {
    background-position: 30% 62%;
  }
}

@keyframes widget-weather-sun {
  to {
    opacity: 0.74;
    transform: scale(1.035);
  }
}

@keyframes widget-weather-twinkle {
  to {
    opacity: 0.16;
  }
}

@keyframes widget-weather-flash {
  0%,
  93%,
  95%,
  100% {
    opacity: 0;
  }
  94% {
    opacity: 0.06;
  }
  94.5% {
    opacity: 0.018;
  }
}

@media (prefers-reduced-motion: reduce) {
  .widget-weather-sky,
  .widget-weather-sky i,
  .widget-weather-sky::before,
  .widget-weather-sky::after {
    animation: none;
  }
  .widget-weather-sky i {
    display: none;
  }
}

.widget-weather-summary {
  display: flex;
  min-width: 0;
  min-height: 0;
  align-items: flex-start;
  flex-direction: column;
}

.widget-weather-location {
  max-width: 100%;
  overflow: hidden;
  font-size: 13px;
  font-weight: 650;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.widget-weather-temperature {
  margin-top: 1px;
  font-size: 46px;
  font-weight: 400;
  letter-spacing: -2.2px;
  line-height: 1;
}

.widget-weather-current {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin-top: auto;
  align-items: flex-start;
  flex-direction: column;
}

.widget-weather-current > div {
  display: flex;
  min-width: 0;
  overflow: hidden;
  flex: 1;
  flex-direction: column;
}

.widget-weather-current :deep(.weather-condition-icon) {
  flex: none;
}

.widget-weather-current small {
  overflow: hidden;
  color: #fff;
  font-size: 12px;
  font-weight: 650;
  line-height: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.widget-weather-range {
  color: rgb(255 255 255 / 82%) !important;
  font-size: 10px !important;
  font-weight: 550 !important;
  line-height: 13px !important;
}

.widget-weather-unavailable {
  display: grid;
  min-width: 0;
  min-height: 0;
  place-items: center;
  color: rgb(255 255 255 / 72%);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.widget-weather-hourly {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-left: 0.5px solid rgb(255 255 255 / 20%);
}

.widget-weather-hourly > div {
  display: grid;
  min-width: 0;
  align-content: center;
  justify-items: center;
  gap: 7px;
}

.widget-weather-hourly time {
  color: rgb(255 255 255 / 58%);
  font-size: 9px;
  font-weight: 600;
}

.widget-weather-hourly strong {
  font-size: 12px;
  font-weight: 650;
}

.home-widget-shell--medium .home-widget--weather {
  padding: 13px 15px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);
  gap: 12px;
}

.home-widget-shell--medium .widget-weather-temperature {
  font-size: 42px;
}

.home-widget-shell--medium .widget-weather-hourly {
  padding-left: 10px;
}

.home-widget-shell--medium .widget-weather-hourly svg {
  width: 18px;
  height: 18px;
}

.home-widget-shell--medium .widget-weather-hourly time {
  font-size: 8px;
}

.home-widget-shell--medium .widget-weather-hourly strong {
  font-size: 11px;
}

.home-widget-shell--large .home-widget--weather {
  display: flex;
  flex-direction: column;
}

.home-widget-shell--large .widget-weather-temperature {
  font-size: 62px;
}

.home-widget-shell--large .widget-weather-current {
  margin-top: 16px;
}

.home-widget-shell--large .widget-weather-hourly {
  margin-top: auto;
  padding-top: 16px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-top: 0.5px solid rgb(255 255 255 / 20%);
  border-left: 0;
}

.home-widget--music {
  display: grid;
  position: relative;
  align-items: center;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 14px;
  background: rgb(39 39 42 / 95%);
}

.home-widget--music-empty::after {
  position: absolute;
  z-index: 1;
  inset: 0;
  content: '';
  border-radius: inherit;
  background: linear-gradient(
    to bottom,
    transparent 34%,
    rgb(20 20 22 / 18%) 62%,
    rgb(16 16 18 / 82%) 100%
  );
  pointer-events: none;
}

.home-widget--music-empty .widget-album,
.home-widget--music-empty .widget-music-placeholder {
  -webkit-mask-image: linear-gradient(
    to bottom,
    #000 0%,
    #000 42%,
    rgb(0 0 0 / 42%) 72%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    #000 0%,
    #000 42%,
    rgb(0 0 0 / 42%) 72%,
    transparent 100%
  );
}

.home-widget-shell--large .home-widget--music {
  align-content: start;
  grid-template-columns: 1fr;
  grid-template-rows: 172px minmax(0, 1fr);
  gap: 16px;
}

.widget-album {
  display: grid;
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  place-items: center;
  align-self: center;
  aspect-ratio: 1;
  border: 0.5px solid rgb(255 255 255 / 14%);
  border-radius: 16px;
  color: rgb(255 255 255 / 48%);
  background: rgb(255 255 255 / 8%);
  box-shadow:
    inset 0 0 0 0.5px rgb(255 255 255 / 5%),
    0 5px 13px rgb(0 0 0 / 18%);
}

.widget-album img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-widget-shell--large .widget-album {
  width: 172px;
  height: 172px;
  margin: 0 auto;
  border-radius: 25px;
}

.widget-music-body {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
}

.widget-music-mark {
  align-self: flex-end;
  flex: none;
  color: #ff375f;
}

.widget-music-copy {
  display: flex;
  min-width: 0;
  margin-top: auto;
  flex-direction: column;
}

.widget-music-copy strong,
.widget-music-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.widget-music-copy strong {
  font-size: 14px;
  line-height: 18px;
}

.widget-music-progress {
  width: 100%;
  height: 3px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 3px;
  background: rgb(255 255 255 / 12%);
}

.widget-music-progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #ff375f;
}

.widget-music-empty {
  position: absolute;
  right: 15px;
  bottom: 14px;
  left: 15px;
  z-index: 2;
  margin: 0;
  color: rgb(255 255 255 / 72%);
  font-size: 14px;
  font-weight: 650;
  line-height: 17px;
  text-align: center;
}

.widget-music-placeholder {
  display: grid;
  margin: auto 0;
  gap: 10px;
}

.widget-music-placeholder span {
  display: block;
  height: 7px;
  border-radius: 7px;
  background: rgb(255 255 255 / 8%);
}

.widget-music-placeholder span:first-child {
  width: 54%;
  background: rgb(255 55 95 / 14%);
}

.widget-music-controls {
  display: flex;
  margin-top: auto;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

/* Regle des seules commandes de lecture : elle imposait aussi sa taille et
   son fond gris aux pastilles de contact, qui sont devenues des boutons. */
.widget-music-controls button {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: rgb(255 255 255 / 11%);
}

.home-widget-shell--large .widget-music-body {
  text-align: center;
}

.home-widget-shell--large .widget-music-mark {
  position: absolute;
  top: 18px;
  right: 18px;
}

.home-widget-shell--large .widget-music-copy,
.home-widget-shell--large .widget-music-empty {
  margin-right: auto;
  margin-left: auto;
}

.home-widget-shell--large .widget-music-controls {
  justify-content: center;
}

.home-widget--wallet {
  background: rgb(25 26 29 / 94%);
}

.home-widget--wallet {
  background:
    linear-gradient(
      135deg,
      rgb(255 255 255 / 9%) 0%,
      rgb(255 255 255 / 0%) 58%
    ),
    linear-gradient(180deg, rgb(42 42 46 / 94%), rgb(15 15 17 / 96%));
}

/* Le halo d'angle de la carte de debit de Banking, repris en plus discret. */
.home-widget--wallet::after {
  position: absolute;
  right: -48px;
  bottom: -48px;
  width: 116px;
  height: 116px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgb(255 255 255 / 9%),
    rgb(255 255 255 / 0%) 70%
  );
  content: '';
  pointer-events: none;
}

.widget-wallet-icon {
  position: absolute;
  top: 13px;
  right: 13px;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 11px;
  color: #fff;
  background: linear-gradient(
    180deg,
    rgb(255 255 255 / 12%),
    rgb(255 255 255 / 2%)
  );
}

.home-widget--wallet .widget-eyebrow {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 1.1px;
  text-transform: uppercase;
}

.widget-balance {
  margin: 3px 0 1px;
  font-size: 30px;
  font-weight: 650;
  letter-spacing: -1.1px;
}

.home-widget--wallet small {
  font-size: 11.5px;
  letter-spacing: 0.3px;
}

.home-widget--transactions,
.home-widget--contacts {
  display: flex;
  flex-direction: column;
}

.home-widget--transactions,
.home-widget--contacts {
  background: linear-gradient(
    180deg,
    rgb(30 30 33 / 94%),
    rgb(18 18 20 / 95%)
  );
}

/* L'en-tete d'un widget n'est pas un titre colore : il nomme la source, en
   blanc, et seule l'icone porte la teinte de l'application. */
.widget-list-header {
  display: flex;
  margin-bottom: 9px;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: -0.2px;
}

.widget-list-header svg {
  color: #6fbf8a;
  opacity: 0.9;
}

.widget-transaction {
  display: flex;
  min-height: 43px;
  gap: 10px;
  padding: 7px 0;
  align-items: center;
  justify-content: space-between;
  border: 0;
  border-top: 0.5px solid rgb(255 255 255 / 9%);
  color: #fff;
  background: transparent;
  text-align: left;
}

.widget-transaction:first-of-type {
  border-top: 0;
  padding-top: 0;
}

.widget-transaction > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.widget-transaction strong {
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 650;
  letter-spacing: -0.1px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.widget-transaction small {
  margin-top: 2px;
  color: rgb(255 255 255 / 45%);
  font-size: 9.5px;
  font-weight: 500;
}

.widget-transaction b {
  flex: 0 0 auto;
  color: rgb(255 255 255 / 78%);
  font-size: 12.5px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.2px;
  white-space: nowrap;
}

.widget-transaction b.positive {
  color: #6fbf8a;
}

.widget-contacts {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;
}

.home-widget-shell--large .widget-contacts {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, 1fr);
}

.widget-contacts article {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
}

.widget-contact-mark {
  position: relative;
  display: block;
  width: 46px;
  height: 46px;
}

.widget-contact-avatar {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(
    160deg,
    hsl(var(--widget-avatar-hue, 210) 68% 60%),
    hsl(var(--widget-avatar-hue, 210) 46% 36%)
  );
  box-shadow: inset 0 1px rgb(255 255 255 / 24%);
  font-size: 17px;
  font-weight: 650;
}

/* Le message se loge dans l'angle de la pastille : dans une tuile de 46 px il
   n'y a pas la place pour deux boutons cote a cote sous le nom. */
.widget-contact-message {
  position: absolute;
  right: -3px;
  bottom: -3px;
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  padding: 0;
  border: 1.5px solid rgb(20 20 22 / 95%);
  border-radius: 50%;
  color: #fff;
  background: #2f80ed;
}

.widget-contacts strong {
  max-width: 100%;
  overflow: hidden;
  font-size: 10px;
  font-weight: 550;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-widget-remove {
  position: absolute;
  z-index: 8;
  top: -18px;
  left: -18px;
  display: grid;
  width: 44px;
  height: 44px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
}

.home-widget-remove > span {
  display: grid;
  width: 23px;
  height: 23px;
  min-width: 23px;
  padding: 0;
  place-items: center;
  border: 0.5px solid rgb(255 255 255 / 55%);
  border-radius: 50%;
  color: #111;
  background: #d1d1d6;
  box-shadow: 0 1px 5px rgb(0 0 0 / 55%);
  font-size: 20px;
  font-weight: 400;
  line-height: 1;
}

@keyframes widget-wobble {
  from {
    transform: rotate(-0.7deg) translateY(-0.5px);
  }
  to {
    transform: rotate(0.7deg) translateY(0.5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-widget-shell--editing {
    animation: none;
  }
}
</style>
