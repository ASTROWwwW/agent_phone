<script setup lang="ts">
import {
  CloudSun,
  Droplets,
  Navigation,
  ThermometerSun,
  Umbrella,
  Wind,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import WeatherConditionIcon from '@/components/WeatherConditionIcon.vue'
import { usePullToRefresh } from '@/composables/usePullToRefresh'
import { usePhoneStore } from '@/stores/phone'
import { useWeatherStore } from '@/stores/weather'
import type { WeatherConditionId } from '@/types/weather'
import {
  AgentAppPage,
  AgentLink,
  AgentNavbar,
  AgentScrollArea,
  AgentSpinner,
  AgentNotification,
} from '@/ui'

const phone = usePhoneStore()
const weather = useWeatherStore()
const forecast = computed(() => weather.forecast)
const cooldownToastOpened = ref(false)
let cooldownToastTimer: ReturnType<typeof setTimeout> | undefined

const {
  finishPull,
  movePull,
  pullDistance,
  pullThreshold,
  pullWithWheel,
  startPull,
} = usePullToRefresh({
  isAtTop: (event) =>
    (event.currentTarget as HTMLElement | null)?.scrollTop === 0,
  isBusy: () => weather.isLoading,
  refresh: () => weather.refresh(true, true),
})

function closeCooldownToast(): void {
  cooldownToastOpened.value = false
  if (weather.error === 'reload_cooldown') weather.error = null
}
const isNight = computed(() => {
  if (!forecast.value) return false
  const hour = new Date(forecast.value.timestamp).getUTCHours()
  return hour < 6 || hour >= 20
})
const rainy = computed(
  () =>
    forecast.value?.condition === 'rain' ||
    forecast.value?.condition === 'thunder',
)
const sunlit = computed(
  () =>
    !isNight.value &&
    (forecast.value?.condition === 'sunny' ||
      forecast.value?.condition === 'clear'),
)
const overcast = computed(
  () =>
    forecast.value?.condition === 'cloudy' ||
    forecast.value?.condition === 'partly_cloudy',
)
const rainDrops = [
  ['3%', '11px', '1.35s', '-0.3s', '0.32'],
  ['9%', '8px', '1.7s', '-1.1s', '0.2'],
  ['15%', '14px', '1.45s', '-0.8s', '0.38'],
  ['21%', '10px', '1.9s', '-1.6s', '0.24'],
  ['28%', '13px', '1.55s', '-0.2s', '0.3'],
  ['35%', '8px', '1.75s', '-1.35s', '0.18'],
  ['42%', '16px', '1.4s', '-0.65s', '0.36'],
  ['49%', '10px', '2s', '-1.8s', '0.22'],
  ['56%', '14px', '1.6s', '-0.45s', '0.34'],
  ['63%', '9px', '1.8s', '-1.2s', '0.2'],
  ['70%', '15px', '1.5s', '-0.9s', '0.37'],
  ['77%', '8px', '1.95s', '-1.55s', '0.2'],
  ['84%', '12px', '1.45s', '-0.15s', '0.31'],
  ['91%', '10px', '1.7s', '-1.05s', '0.24'],
  ['97%', '14px', '1.55s', '-0.6s', '0.28'],
].map(([left, height, duration, delay, opacity]) => ({
  '--rain-delay': delay,
  '--rain-duration': duration,
  '--rain-height': height,
  '--rain-left': left,
  '--rain-opacity': opacity,
}))
const snowFlakes = [
  ['4%', '3.2s', '-1.2s', '0.4', '2px'],
  ['9%', '2.2s', '-2.4s', '0.72', '4px'],
  ['14%', '2.6s', '-0.5s', '0.6', '3px'],
  ['21%', '3.6s', '-1.7s', '0.35', '2px'],
  ['27%', '2.1s', '-0.9s', '0.75', '4px'],
  ['33%', '2.9s', '-2.1s', '0.5', '3px'],
  ['39%', '3.4s', '-1.4s', '0.38', '2px'],
  ['45%', '2.3s', '-0.2s', '0.7', '4px'],
  ['51%', '2.8s', '-2.6s', '0.55', '3px'],
  ['57%', '3.5s', '-1.1s', '0.36', '2px'],
  ['62%', '2s', '-1.8s', '0.78', '4px'],
  ['68%', '2.7s', '-0.7s', '0.58', '3px'],
  ['74%', '3.3s', '-2.2s', '0.4', '2px'],
  ['80%', '2.4s', '-1.6s', '0.68', '4px'],
  ['85%', '3s', '-0.4s', '0.52', '3px'],
  ['90%', '3.7s', '-2.8s', '0.34', '2px'],
  ['95%', '2.2s', '-1.3s', '0.74', '4px'],
  ['98%', '2.9s', '-0.6s', '0.5', '3px'],
].map(([left, duration, delay, opacity, size]) => ({
  '--snow-delay': delay,
  '--snow-duration': duration,
  '--snow-left': left,
  '--snow-opacity': opacity,
  '--snow-size': size,
}))
const cloudDrifts = [
  ['6%', '62%', '86px', '38s', '-6s', '0.2'],
  ['19%', '86%', '120px', '54s', '-28s', '0.14'],
  ['34%', '70%', '96px', '46s', '-16s', '0.11'],
  ['52%', '104%', '140px', '66s', '-44s', '0.09'],
].map(([top, width, height, duration, delay, opacity]) => ({
  '--cloud-delay': delay,
  '--cloud-duration': duration,
  '--cloud-height': height,
  '--cloud-opacity': opacity,
  '--cloud-top': top,
  '--cloud-width': width,
}))
const shootingStars = [
  ['12%', '8%', '-2s'],
  ['58%', '3%', '-11s'],
].map(([left, top, delay]) => ({
  '--star-delay': delay,
  '--star-left': left,
  '--star-top': top,
}))
const fogLayers = [
  ['-16s', '58s', '0.5', '34%', '-4%', '-45%', '30%'],
  ['-38s', '72s', '0.34', '46%', '14%', '25%', '-40%'],
  ['-7s', '64s', '0.42', '38%', '33%', '-38%', '34%'],
  ['-52s', '80s', '0.3', '52%', '52%', '30%', '-42%'],
  ['-24s', '68s', '0.38', '40%', '72%', '-40%', '28%'],
].map(([delay, duration, opacity, height, top, from, to]) => ({
  '--fog-delay': delay,
  '--fog-duration': duration,
  '--fog-from': from,
  '--fog-height': height,
  '--fog-opacity': opacity,
  '--fog-to': to,
  '--fog-top': top,
}))

const DETAIL_TILES = [
  { accent: 'gold', icon: ThermometerSun, key: 'feelsLike' },
  { accent: 'agent', icon: Wind, key: 'wind' },
  { accent: 'teal', icon: Droplets, key: 'humidity' },
  { accent: 'cyan', icon: Umbrella, key: 'rain' },
] as const

const details = computed(() => {
  const data = forecast.value
  if (!data) return []
  const values: Record<(typeof DETAIL_TILES)[number]['key'], string> = {
    feelsLike: `${data.feelsLike}°`,
    humidity: `${data.humidity}%`,
    rain: `${data.rainChance}%`,
    wind: `${data.windSpeed} km/h`,
  }
  return DETAIL_TILES.map((tile) => ({ ...tile, value: values[tile.key] }))
})

function conditionLabel(condition: WeatherConditionId): string {
  return phone.t(`Apps.weather.conditions.${condition}`)
}

function formatHour(timestamp: number, index: number): string {
  if (index === 0) return phone.t('Apps.weather.now')
  return new Intl.DateTimeFormat(phone.lang, {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).format(timestamp)
}

onBeforeUnmount(() => {
  if (cooldownToastTimer) clearTimeout(cooldownToastTimer)
})

watch(
  () => weather.error,
  (error) => {
    if (error !== 'reload_cooldown') return
    if (cooldownToastTimer) clearTimeout(cooldownToastTimer)
    cooldownToastOpened.value = true
    cooldownToastTimer = setTimeout(closeCooldownToast, 2800)
  },
)
</script>

<template>
  <AgentAppPage
    class="weather-app"
    :class="[
      forecast ? `weather-app--${forecast.condition}` : '',
      { 'weather-app--night': isNight },
    ]"
    :label="phone.t('Apps.weather.name')"
    dark
  >
    <div class="weather-app__backdrop" aria-hidden="true"></div>
    <div v-if="rainy" class="weather-app__rain" aria-hidden="true">
      <i v-for="(drop, index) in rainDrops" :key="index" :style="drop"></i>
    </div>
    <div
      v-if="forecast?.condition === 'thunder'"
      class="weather-app__lightning"
      aria-hidden="true"
    ></div>
    <div
      v-if="forecast?.condition === 'fog'"
      class="weather-app__fog"
      aria-hidden="true"
    >
      <i v-for="(layer, index) in fogLayers" :key="index" :style="layer"></i>
    </div>
    <div
      v-if="forecast?.condition === 'snow'"
      class="weather-app__snow"
      aria-hidden="true"
    >
      <i v-for="(flake, index) in snowFlakes" :key="index" :style="flake"></i>
    </div>
    <div v-if="overcast" class="weather-app__clouds" aria-hidden="true">
      <i v-for="(cloud, index) in cloudDrifts" :key="index" :style="cloud"></i>
    </div>
    <div v-if="sunlit" class="weather-app__sun-glow" aria-hidden="true"></div>
    <div v-if="isNight" class="weather-app__stars" aria-hidden="true">
      <i v-for="(star, index) in shootingStars" :key="index" :style="star"></i>
    </div>
    <AgentNavbar class="weather-navbar" :title="phone.t('Apps.weather.name')" />

    <AgentScrollArea
      v-if="forecast"
      class="weather-scroll"
      @touchend="finishPull"
      @touchmove.passive="movePull"
      @touchstart.passive="startPull"
      @wheel="pullWithWheel"
    >
      <div
        class="weather-pull-refresh"
        :class="{ 'is-visible': pullDistance > 0 }"
        :style="{ transform: `translateY(${pullDistance - pullThreshold}px)` }"
        aria-live="polite"
      >
        <AgentSpinner :label="phone.t('Common.loading')" />
      </div>

      <header class="weather-hero">
        <p class="weather-location">
          <Navigation :size="11" fill="currentColor" />
          {{ phone.t(`Apps.weather.regions.${forecast.region}`) }}
        </p>
        <WeatherConditionIcon
          :condition="forecast.condition"
          :timestamp="forecast.timestamp"
          class="weather-hero__icon"
          :size="84"
        />
        <p class="weather-temperature">{{ forecast.temperature }}°</p>
        <strong class="weather-hero__condition">{{
          conditionLabel(forecast.condition)
        }}</strong>
        <p class="weather-hero__summary">
          {{ phone.t(`Apps.weather.summaries.${forecast.condition}`) }}
        </p>
      </header>

      <p
        v-if="weather.error && weather.error !== 'reload_cooldown'"
        class="weather-stale"
        role="status"
      >
        {{ phone.t('Apps.weather.stale') }}
      </p>

      <section class="weather-panel" aria-labelledby="weather-details-title">
        <header class="weather-panel__head">
          <h2 id="weather-details-title">
            {{ phone.t('Apps.weather.details') }}
          </h2>
        </header>
        <div class="weather-details">
          <article
            v-for="detail in details"
            :key="detail.key"
            class="weather-tile"
            :class="`weather-tile--${detail.accent}`"
          >
            <span class="weather-tile__head">
              <span class="weather-tile__icon">
                <component :is="detail.icon" :size="14" />
              </span>
              <span class="weather-tile__label">{{
                phone.t(`Apps.weather.${detail.key}`)
              }}</span>
            </span>
            <strong class="weather-tile__value">{{ detail.value }}</strong>
          </article>
        </div>
      </section>

      <section class="weather-panel" aria-labelledby="weather-hourly-title">
        <header class="weather-panel__head">
          <h2 id="weather-hourly-title">
            {{ phone.t('Apps.weather.hourly') }}
          </h2>
        </header>
        <div class="weather-hourly">
          <div
            v-for="(hour, index) in forecast.hourly"
            :key="hour.timestamp"
            class="weather-hour"
            :class="{ 'is-now': index === 0 }"
          >
            <span class="weather-hour__time">{{
              formatHour(hour.timestamp, index)
            }}</span>
            <WeatherConditionIcon
              :condition="hour.condition"
              :timestamp="hour.timestamp"
              :size="26"
            />
            <span class="weather-hour__rain">{{
              hour.rainChance >= 30 ? `${hour.rainChance}%` : ''
            }}</span>
            <strong class="weather-hour__temperature">{{
              hour.temperature
            }}°</strong>
          </div>
        </div>
      </section>
    </AgentScrollArea>

    <div v-else class="weather-empty">
      <AgentSpinner v-if="weather.isLoading" :label="phone.t('Common.loading')" />
      <CloudSun v-else :size="52" :stroke-width="1.4" />
      <strong>{{
        phone.t(
          weather.isLoading ? 'Common.loading' : 'Apps.weather.unavailable',
        )
      }}</strong>
      <AgentLink
        v-if="!weather.isLoading"
        component="button"
        @click="weather.refresh(true, true)"
      >
        {{ phone.t('Apps.weather.tryAgain') }}
      </AgentLink>
    </div>

    <AgentNotification
      :opened="cooldownToastOpened"
      :text="phone.t('Apps.weather.errors.reload_cooldown')"
      @click="closeCooldownToast"
    />
  </AgentAppPage>
</template>

<style scoped>
.weather-scroll {
  padding: 4px 14px 24px;
}
</style>
