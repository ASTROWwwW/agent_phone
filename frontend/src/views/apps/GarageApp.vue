<script setup lang="ts">
import {
  Bike,
  CarFront,
  CheckCircle2,
  Clock3,
  CircleDollarSign,
  Briefcase,
  Fuel,
  Gauge,
  MapPin,
  Navigation,
  Plane,
  Route,
  Sparkles,
  Sailboat,
  ShieldAlert,
  Warehouse,
  Wrench,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { useGarageStore } from '@/stores/garage'
import { usePhoneStore } from '@/stores/phone'
import type {
  GarageVehicle,
  GarageVehicleKind,
  GarageVehicleStatus,
  GarageValetState,
} from '@/types/garage'
import { isTrustedRootMessageSource } from '@/utils/windowMessages'
import {
  AgentAppPage,
  AgentButton,
  AgentDialog,
  AgentDialogButton,
  AgentEmptyState,
  AgentGlass,
  AgentNavbar,
  AgentScrollArea,
  AgentSearchbar,
  AgentSegmented,
  AgentSegmentedButton,
  AgentSheet,
  AgentSpinner,
  AgentNotification,
} from '@/ui'

type GarageFilter = 'all' | GarageVehicleStatus

const phone = usePhoneStore()
const garage = useGarageStore()
const activeFilter = ref<GarageFilter>('all')
const query = ref('')
const selectedVehicle = ref<GarageVehicle | null>(null)
const valetCandidate = ref<GarageVehicle | null>(null)
const toastOpened = ref(false)
const toastText = ref('')
const failedVehicleImages = ref<Record<string, true>>({})

const kindIcons: Record<GarageVehicleKind, typeof CarFront> = {
  bike: Bike,
  boat: Sailboat,
  car: CarFront,
  helicopter: Plane,
  plane: Plane,
}

const vehicles = computed(() => garage.overview?.vehicles ?? [])
const counts = computed(() => ({
  all: vehicles.value.length,
  garaged: vehicles.value.filter((vehicle) => vehicle.status === 'garaged')
    .length,
  impounded: vehicles.value.filter((vehicle) => vehicle.status === 'impounded')
    .length,
  out: vehicles.value.filter((vehicle) => vehicle.status === 'out').length,
}))
const filters = computed(() =>
  (['all', 'garaged', 'out', 'impounded'] as const).map((id) => ({
    count: counts.value[id],
    id,
    label: phone.t(`Apps.garage.filters.${id}`),
  })),
)
const filteredVehicles = computed(() => {
  const search = query.value.trim().toLocaleLowerCase(phone.lang)
  return vehicles.value.filter((vehicle) => {
    if (activeFilter.value !== 'all' && vehicle.status !== activeFilter.value) {
      return false
    }
    if (!search) return true
    return [
      displayName(vehicle),
      vehicle.model,
      vehicle.plate,
      vehicle.location,
      vehicle.nickname,
      vehicle.vin,
    ].some((value) =>
      String(value ?? '')
        .toLocaleLowerCase(phone.lang)
        .includes(search),
    )
  })
})

function displayName(vehicle: GarageVehicle): string {
  if (vehicle.nickname) return vehicle.nickname
  if (vehicle.name) return vehicle.name
  if (typeof vehicle.model === 'string' && vehicle.model) return vehicle.model
  return phone.t('Apps.garage.unknownVehicle')
}

function modelName(vehicle: GarageVehicle): string {
  if (vehicle.name && vehicle.nickname) return vehicle.name
  if (typeof vehicle.model === 'string' && vehicle.model) return vehicle.model
  return phone.t(`Apps.garage.kinds.${vehicle.kind}`)
}

function vehicleImageUrl(vehicle: GarageVehicle): string {
  if (failedVehicleImages.value[vehicle.id]) return ''
  return vehicle.imageUrl ?? ''
}

function useVehicleIcon(vehicle: GarageVehicle): void {
  failedVehicleImages.value = {
    ...failedVehicleImages.value,
    [vehicle.id]: true,
  }
}

function conditionValue(vehicle: GarageVehicle): number | null {
  const values = [vehicle.engine, vehicle.body].filter(
    (value): value is number => value !== null,
  )
  if (!values.length) return null
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  )
}

function metricLabel(value: number | null): string {
  return value === null ? phone.t('Apps.garage.notAvailable') : `${value}%`
}

function translatedError(error: string): string {
  const key = `Apps.garage.errors.${error}`
  const translated = phone.t(key)
  return translated === key ? phone.t('Apps.garage.errors.default') : translated
}

function errorMessage(): string {
  return translatedError(garage.error)
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat(phone.lang, {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function canRequestValet(vehicle: GarageVehicle): boolean {
  return (
    Boolean(garage.overview?.valet.enabled) &&
    vehicle.status === 'garaged' &&
    Boolean(garage.overview?.valet.vehicleTypes[vehicle.kind]) &&
    !garage.valet
  )
}

function valetAvailability(vehicle: GarageVehicle): string {
  if (vehicle.status !== 'garaged') {
    return phone.t('Apps.garage.valet.unavailableStatus')
  }
  if (!garage.overview?.valet.vehicleTypes[vehicle.kind]) {
    return phone.t('Apps.garage.valet.unsupported')
  }
  if (garage.valet) return phone.t('Apps.garage.valet.activeOrder')
  return phone.t('Apps.garage.valet.body')
}

function statusDistance(): string {
  if (!garage.valet) return ''
  if (garage.valet.status === 'arriving') {
    return phone.t('Apps.garage.valet.arriving')
  }
  if (garage.valet.etaSeconds !== null) {
    return phone.t('Apps.garage.valet.eta', {
      seconds: String(Math.max(1, Math.round(garage.valet.etaSeconds))),
    })
  }
  if (garage.valet.distance !== null) {
    return phone.t('Apps.garage.valet.distance', {
      distance: String(Math.round(garage.valet.distance)),
    })
  }
  return phone.t('Apps.garage.valet.connecting')
}

async function confirmValet(): Promise<void> {
  const candidate = valetCandidate.value
  if (!candidate) return
  if (await garage.requestValet(candidate.plate)) {
    valetCandidate.value = null
    selectedVehicle.value = null
    return
  }
  toastText.value = translatedError(garage.valetError)
  toastOpened.value = true
}

async function cancelValet(): Promise<void> {
  if (await garage.cancelValet()) return
  toastText.value = translatedError(garage.valetError)
  toastOpened.value = true
}

function handleValetStatus(event: MessageEvent): void {
  if (!isTrustedRootMessageSource(event.source, window)) return
  if (event.data?.type !== 'garage:valet-status') return
  garage.setValetState((event.data.data as GarageValetState | null) ?? null)
}

onMounted(() => {
  void garage.load()
  void garage.syncValet()
  window.addEventListener('message', handleValetStatus)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleValetStatus)
})
</script>

<template>
  <AgentAppPage
    class="garage-page"
    :label="phone.t('Apps.garage.name')"
    :dark="phone.isDarkMode"
    accent="#0a84ff"
    accent-soft="rgba(10, 132, 255, 0.15)"
  >
    <AgentNavbar
      class="garage-navbar"
      variant="large"
      :subtitle="phone.t('Apps.garage.subtitle')"
      :title="phone.t('Apps.garage.name')"
    />

    <div v-if="garage.isLoading && !garage.overview" class="garage-state">
      <AgentSpinner />
      <span>{{ phone.t('Common.loading') }}</span>
    </div>

    <AgentEmptyState
      v-else-if="!garage.overview"
      class="garage-state"
      tone="danger"
      :title="phone.t('Apps.garage.unavailable')"
      :body="errorMessage()"
    >
      <template #icon><Wrench :size="31" /></template>
      <template #actions>
        <AgentButton rounded @click="garage.load()">
          {{ phone.t('Apps.garage.tryAgain') }}
        </AgentButton>
      </template>
    </AgentEmptyState>

    <AgentScrollArea v-else padded class="garage-scroll">
      <article class="garage-summary">
        <header class="garage-summary__heading">
          <span>
            <small class="agent-type-eyebrow">{{
              phone.t('Apps.garage.myVehicles')
            }}</small>
            <strong class="agent-type-display">{{ counts.all }}</strong>
          </span>
        </header>
        <div class="garage-summary__stats">
          <span>
            <i class="is-garaged" />
            <b>{{ counts.garaged }}</b>
            <em>{{ phone.t('Apps.garage.filters.garaged') }}</em>
          </span>
          <span>
            <i class="is-out" />
            <b>{{ counts.out }}</b>
            <em>{{ phone.t('Apps.garage.filters.out') }}</em>
          </span>
          <span>
            <i class="is-impounded" />
            <b>{{ counts.impounded }}</b>
            <em>{{ phone.t('Apps.garage.filters.impounded') }}</em>
          </span>
        </div>
      </article>

      <AgentGlass v-if="garage.valet" class="garage-valet-live">
        <div class="garage-valet-live__icon">
          <Navigation v-if="garage.valet.status !== 'delivered'" :size="24" />
          <CheckCircle2 v-else :size="24" />
        </div>
        <div class="garage-valet-live__body">
          <small>{{ phone.t('Apps.garage.valet.liveEyebrow') }}</small>
          <strong>{{ garage.valet.vehicleName }}</strong>
          <span>
            {{ phone.t(`Apps.garage.valet.status.${garage.valet.status}`) }}
            · {{ statusDistance() }}
          </span>
          <div class="garage-valet-live__track"><i /></div>
        </div>
        <AgentButton
          v-if="garage.valet.canCancel"
          clear
          rounded
          small
          :disabled="garage.isValetRequesting"
          @click="cancelValet"
        >
          {{ phone.t('Apps.garage.valet.cancel') }}
        </AgentButton>
      </AgentGlass>
      <AgentSearchbar
        v-model="query"
        class="garage-search"
        :clear-label="phone.t('Common.clear')"
        :placeholder="phone.t('Apps.garage.searchPlaceholder')"
      />

      <AgentSegmented
        strong
        rounded
        class="garage-filters"
        :aria-label="phone.t('Apps.garage.filtersLabel')"
      >
        <AgentSegmentedButton
          v-for="filter in filters"
          :key="filter.id"
          :active="activeFilter === filter.id"
          @click="activeFilter = filter.id"
        >
          <span>{{ filter.label }}</span>
          <small>{{ filter.count }}</small>
        </AgentSegmentedButton>
      </AgentSegmented>

      <section v-if="filteredVehicles.length" class="garage-vehicles">
        <header class="garage-vehicles__head">
          <h2 class="agent-type-display">{{ phone.t('Apps.garage.fleet') }}</h2>
          <span>{{ filteredVehicles.length }}</span>
        </header>

        <AgentGlass
          v-for="vehicle in filteredVehicles"
          :key="vehicle.id"
          component="button"
          type="button"
          class="garage-vehicle"
          @click="selectedVehicle = vehicle"
        >
          <span class="garage-vehicle__visual" :class="`is-${vehicle.kind}`">
            <img
              v-if="vehicleImageUrl(vehicle)"
              :src="vehicleImageUrl(vehicle)"
              :alt="displayName(vehicle)"
              loading="lazy"
              @error="useVehicleIcon(vehicle)"
            />
            <component v-else :is="kindIcons[vehicle.kind]" :size="26" />
          </span>
          <span class="garage-vehicle__content">
            <span class="garage-vehicle__title">
              <strong class="agent-type-display">{{
                displayName(vehicle)
              }}</strong>
              <i class="garage-vehicle__status" :class="`is-${vehicle.status}`">
                {{ phone.t(`Apps.garage.status.${vehicle.status}`) }}
              </i>
            </span>
            <span class="garage-vehicle__model">
              {{ modelName(vehicle) }}
              <b>{{ vehicle.plate }}</b>
            </span>
            <span class="garage-vehicle__meta">
              <span>
                <MapPin :size="12" aria-hidden="true" />
                {{ vehicle.location || phone.t('Apps.garage.unknownLocation') }}
              </span>
              <span v-if="vehicle.ownership && vehicle.ownership !== 'personal'">
                <Briefcase :size="12" aria-hidden="true" />
                {{ vehicle.ownerLabel || phone.t('Apps.garage.serviceVehicle') }}
              </span>
              <span v-if="conditionValue(vehicle) !== null">
                <Gauge :size="12" aria-hidden="true" />
                {{ conditionValue(vehicle) }}%
              </span>
            </span>
          </span>
        </AgentGlass>
      </section>

      <AgentEmptyState
        v-else
        compact
        class="garage-empty"
        :title="
          query
            ? phone.t('Apps.garage.noResults')
            : phone.t('Apps.garage.noVehicles')
        "
        :body="
          query
            ? phone.t('Apps.garage.noResultsBody')
            : phone.t('Apps.garage.noVehiclesBody')
        "
      >
        <template #icon><Warehouse :size="37" /></template>
      </AgentEmptyState>
    </AgentScrollArea>

    <div class="garage-sheet">
      <AgentSheet
        :opened="Boolean(selectedVehicle)"
        :aria-label="selectedVehicle ? displayName(selectedVehicle) : undefined"
        swipe-to-close
        grabber-clickable
        :grabber-label="phone.t('Common.close')"
        @backdropclick="selectedVehicle = null"
        @escape="selectedVehicle = null"
        @grabberclick="selectedVehicle = null"
        @swipeclose="selectedVehicle = null"
      >
        <section v-if="selectedVehicle" class="garage-detail">
          <span
            class="garage-detail__visual"
            :class="`is-${selectedVehicle.kind}`"
          >
            <img
              v-if="vehicleImageUrl(selectedVehicle)"
              :src="vehicleImageUrl(selectedVehicle)"
              :alt="displayName(selectedVehicle)"
              @error="useVehicleIcon(selectedVehicle)"
            />
            <component
              v-else
              :is="kindIcons[selectedVehicle.kind]"
              :size="62"
            />
          </span>
          <span
            class="garage-detail__status"
            :class="`is-${selectedVehicle.status}`"
          >
            {{ phone.t(`Apps.garage.status.${selectedVehicle.status}`) }}
          </span>
          <h2>{{ displayName(selectedVehicle) }}</h2>
          <p>{{ modelName(selectedVehicle) }} · {{ selectedVehicle.plate }}</p>

          <div class="garage-detail__location">
            <i class="garage-detail__location-icon">
              <MapPin :size="17" />
            </i>
            <span>
              <small>{{ phone.t('Apps.garage.location') }}</small>
              <strong>{{
                selectedVehicle.location ||
                phone.t('Apps.garage.unknownLocation')
              }}</strong>
            </span>
          </div>

          <div class="garage-metrics">
            <article>
              <span><Fuel :size="17" />{{ phone.t('Apps.garage.fuel') }}</span>
              <strong>{{ metricLabel(selectedVehicle.fuel) }}</strong>
              <i><b :style="{ width: `${selectedVehicle.fuel ?? 0}%` }" /></i>
            </article>
            <article>
              <span
                ><Gauge :size="17" />{{ phone.t('Apps.garage.engine') }}</span
              >
              <strong>{{ metricLabel(selectedVehicle.engine) }}</strong>
              <i><b :style="{ width: `${selectedVehicle.engine ?? 0}%` }" /></i>
            </article>
            <article>
              <span
                ><ShieldAlert :size="17" />{{
                  phone.t('Apps.garage.body')
                }}</span
              >
              <strong>{{ metricLabel(selectedVehicle.body) }}</strong>
              <i><b :style="{ width: `${selectedVehicle.body ?? 0}%` }" /></i>
            </article>
          </div>

          <AgentGlass
            v-if="garage.overview?.valet.enabled"
            class="garage-valet-offer"
          >
            <div class="garage-valet-offer__top">
              <span><Sparkles :size="22" /></span>
              <div>
                <small>{{ phone.t('Apps.garage.valet.eyebrow') }}</small>
                <strong>{{ phone.t('Apps.garage.valet.title') }}</strong>
              </div>
              <b>{{ formatPrice(garage.overview?.valet.price ?? 0) }}</b>
            </div>
            <p>{{ valetAvailability(selectedVehicle) }}</p>
            <div class="garage-valet-offer__facts">
              <span
                ><Route :size="15" />{{
                  phone.t('Apps.garage.valet.tracked')
                }}</span
              >
              <span
                ><Clock3 :size="15" />{{
                  phone.t('Apps.garage.valet.onDemand')
                }}</span
              >
            </div>
            <AgentButton
              large
              rounded
              :disabled="!canRequestValet(selectedVehicle)"
              @click="valetCandidate = selectedVehicle"
            >
              <CircleDollarSign :size="18" />
              {{ phone.t('Apps.garage.valet.deliver') }}
            </AgentButton>
          </AgentGlass>
          <div v-if="selectedVehicle.vin" class="garage-detail__vin">
            <small>{{ phone.t('Apps.garage.vin') }}</small>
            <strong>{{ selectedVehicle.vin }}</strong>
          </div>
        </section>
      </AgentSheet>
    </div>
    <AgentDialog
      :opened="Boolean(valetCandidate)"
      class="garage-valet-confirm"
      @backdropclick="valetCandidate = null"
      @escape="valetCandidate = null"
    >
      <template #title>{{
        phone.t('Apps.garage.valet.confirmTitle')
      }}</template>
      <div v-if="valetCandidate" class="garage-valet-dialog">
        <span><Sparkles :size="24" /></span>
        <p>
          {{
            phone.t('Apps.garage.valet.confirmBody', {
              price: formatPrice(garage.overview?.valet.price ?? 0),
              vehicle: displayName(valetCandidate),
            })
          }}
        </p>
        <small>
          {{
            phone.t('Apps.garage.valet.account', {
              account: garage.overview?.valet.account ?? 'bank',
            })
          }}
        </small>
      </div>
      <template #buttons>
        <AgentDialogButton @click="valetCandidate = null">
          {{ phone.t('Common.cancel') }}
        </AgentDialogButton>
        <AgentDialogButton
          strong
          :disabled="garage.isValetRequesting"
          @click="confirmValet"
        >
          {{
            garage.isValetRequesting
              ? phone.t('Apps.garage.valet.ordering')
              : phone.t('Apps.garage.valet.confirm')
          }}
        </AgentDialogButton>
      </template>
    </AgentDialog>

    <AgentNotification
      :opened="toastOpened"
      :text="toastText"
      @click="toastOpened = false"
    />
  </AgentAppPage>
</template>

<style scoped>
.garage-page {
  --garage-blue: var(--agent-app-accent);
  --garage-surface-muted: var(--agent-surface-muted);
  --garage-text: var(--agent-text);
  --garage-secondary: var(--agent-muted);
  --garage-separator: var(--agent-hairline);
  background:
    radial-gradient(
      120% 58% at 50% -10%,
      rgb(10 132 255 / 16%),
      transparent 62%
    ),
    radial-gradient(90% 40% at 96% 12%, rgb(88 86 214 / 10%), transparent 58%),
    linear-gradient(180deg, #f4f7fd 0%, #eef0f6 50%, #e9ebf1 100%);
}

.garage-page :deep(.agent-app-page__backdrop) {
  background: transparent;
}
.garage-page.agent-app-page--dark {
  background:
    radial-gradient(
      124% 62% at 50% -10%,
      rgb(10 132 255 / 26%),
      transparent 62%
    ),
    radial-gradient(90% 42% at 96% 12%, rgb(88 86 214 / 18%), transparent 58%),
    linear-gradient(180deg, #101724 0%, #0b1018 54%, #06090e 100%);
}
.garage-navbar :deep(.agent-navbar__title-container > div) {
  transform: translateY(-30px);
}
.garage-scroll {
  padding-top: 0;
}
.garage-summary {
  position: relative;
  overflow: hidden;
  padding: 17px 18px 15px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: var(--agent-radius-card);
  color: #fff;
  background:
    linear-gradient(
      135deg,
      rgb(255 255 255 / 10%) 0%,
      rgb(255 255 255 / 0%) 58%
    ),
    linear-gradient(180deg, rgb(38 44 58 / 96%), rgb(12 15 21 / 98%));
  box-shadow:
    0 12px 30px rgb(8 16 32 / 32%),
    inset 0 1px 0 rgb(255 255 255 / 8%);
}
.garage-summary::after {
  position: absolute;
  right: -54px;
  bottom: -54px;
  width: 128px;
  height: 128px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgb(90 160 255 / 20%),
    rgb(255 255 255 / 0%) 70%
  );
  content: '';
  pointer-events: none;
}
.garage-summary__heading {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.garage-summary__heading > span {
  display: flex;
  flex-direction: column;
}
.garage-summary__heading small {
  color: rgb(255 255 255 / 58%);
}
.garage-summary__heading strong {
  margin-top: 3px;
  font-size: 38px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.garage-summary__stats {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  margin-top: 16px;
}
.garage-summary__stats span {
  min-width: 0;
  display: grid;
  grid-template-columns: 7px auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 6px;
  padding: 9px 10px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: var(--agent-radius-control);
  background: rgb(255 255 255 / 6%);
}
.garage-summary__stats i {
  width: 7px;
  height: 7px;
  grid-row: 1 / 3;
  border-radius: 50%;
  background: #34c759;
}
.garage-summary__stats i.is-out {
  background: #ff9f0a;
}
.garage-summary__stats i.is-impounded {
  background: #ff453a;
}
.garage-summary__stats b {
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}
.garage-summary__stats em {
  overflow: hidden;
  color: rgb(255 255 255 / 56%);
  font-size: 11px;
  font-style: normal;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.garage-search {
  margin: 13px 0 10px;
}
.garage-filters {
  height: 40px;
  min-height: 40px;
  margin-bottom: 13px;
  padding: 2px;
}
.garage-filters :deep(button) {
  min-width: 0;
  height: 36px;
  min-height: 36px;
  padding-right: 4px;
  padding-left: 4px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}
.garage-filters :deep(.agent-segmented__highlight) {
  top: 2px;
  bottom: 2px;
}
.garage-filters span,
.garage-filters small {
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.garage-filters small {
  min-width: 17px;
  padding: 0 4px;
  border-radius: var(--agent-radius-pill);
  background: rgb(36 120 255 / 13%);
  font-size: 10px;
  font-weight: 700;
}
.garage-vehicles {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.garage-vehicles__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 4px 2px 0;
}
.garage-vehicles__head h2 {
  margin: 0;
  color: var(--garage-text);
  font-size: 18px;
  font-weight: 700;
}
.garage-vehicles__head span {
  color: var(--garage-secondary);
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.garage-vehicle {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 18px;
  color: var(--garage-text);
  text-align: left;
  transition:
    transform 0.16s ease,
    opacity 0.16s ease;
}
.garage-vehicle:active {
  transform: scale(0.985);
  opacity: 0.86;
}
.garage-vehicle__visual {
  position: relative;
  display: grid;
  width: 52px;
  height: 52px;
  flex: none;
  overflow: hidden;
  border-radius: 15px;
  color: var(--garage-blue);
  background: var(--agent-app-accent-soft);
  place-items: center;
}
.garage-vehicle__visual.is-bike {
  color: #57368e;
  background: #f2eaff;
}
.garage-vehicle__visual.is-boat {
  color: #11546b;
  background: #e3f8fb;
}
.garage-vehicle__visual.is-plane,
.garage-vehicle__visual.is-helicopter {
  color: #744914;
  background: #fff4dd;
}
.garage-vehicle__visual > img {
  width: 100%;
  height: 100%;
  display: block;
  box-sizing: border-box;
  padding: 5px;
  object-fit: contain;
}
.garage-vehicle__content {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.garage-vehicle__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 9px;
}
.garage-vehicle__title strong {
  min-width: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.garage-vehicle__status {
  flex: none;
  padding: 3px 9px;
  border-radius: var(--agent-radius-pill);
  color: #1a7a37;
  background: rgb(52 199 89 / 16%);
  font-size: 11px;
  font-style: normal;
  font-weight: 650;
  letter-spacing: -0.1px;
}
.garage-vehicle__status.is-out {
  color: #9a5b00;
  background: rgb(255 159 10 / 18%);
}
.garage-vehicle__status.is-impounded {
  color: #b3241a;
  background: rgb(255 69 58 / 16%);
}
.agent-app-page--dark .garage-vehicle__status {
  color: #4cd97a;
  background: rgb(52 199 89 / 20%);
}
.agent-app-page--dark .garage-vehicle__status.is-out {
  color: #ffb340;
  background: rgb(255 159 10 / 20%);
}
.agent-app-page--dark .garage-vehicle__status.is-impounded {
  color: #ff6961;
  background: rgb(255 69 58 / 20%);
}
.agent-app-page--dark .garage-detail__status {
  color: #4cd97a;
  background: rgb(52 199 89 / 20%);
}
.agent-app-page--dark .garage-detail__status.is-out {
  color: #ffb340;
  background: rgb(255 159 10 / 20%);
}
.agent-app-page--dark .garage-detail__status.is-impounded {
  color: #ff6961;
  background: rgb(255 69 58 / 20%);
}
.agent-app-page--dark .garage-vehicle__visual.is-bike {
  color: #c3a6f5;
  background: rgb(124 77 255 / 18%);
}
.agent-app-page--dark .garage-vehicle__visual.is-boat {
  color: #7fd6ea;
  background: rgb(48 176 199 / 18%);
}
.agent-app-page--dark .garage-vehicle__visual.is-plane,
.agent-app-page--dark .garage-vehicle__visual.is-helicopter {
  color: #f0c07a;
  background: rgb(255 159 10 / 16%);
}
.garage-vehicle__model {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  overflow: hidden;
  color: var(--garage-secondary);
  font-size: 12.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.garage-vehicle__model b {
  flex: none;
  padding: 1px 5px;
  border: 1px solid var(--garage-separator);
  border-radius: 5px;
  color: var(--garage-text);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.03em;
}
.garage-vehicle__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 2px;
  color: var(--garage-secondary);
  font-size: 12px;
  font-weight: 500;
}
.garage-vehicle__meta span {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.garage-vehicle__meta span:last-child {
  flex: none;
}

.garage-empty {
  margin: var(--agent-space-5) 0;
}
.garage-state {
  min-height: 0;
  margin: 0 var(--agent-page-gutter) var(--agent-space-3);
  padding: var(--agent-space-6);
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 9px;
  color: var(--garage-secondary);
  text-align: center;
}
.garage-detail {
  position: relative;
  padding: 6px 18px 28px;
  background: var(--agent-surface);
  color: var(--garage-text);
  text-align: center;
}
.garage-detail__visual {
  width: 104px;
  height: 82px;
  margin: 4px auto 9px;
  display: grid;
  place-items: center;
  border-radius: var(--agent-radius-card);
  background: var(--agent-app-accent-soft);
  color: var(--garage-blue);
}
.garage-detail__visual > img {
  padding: 7px;
  box-sizing: border-box;
}
.garage-detail__visual.is-bike {
  background: #f2eaff;
  color: #57368e;
}
.garage-detail__visual.is-boat {
  background: #e3f8fb;
  color: #11546b;
}
.garage-detail__visual.is-plane,
.garage-detail__visual.is-helicopter {
  background: #fff4dd;
  color: #744914;
}
.garage-detail__status {
  min-height: 24px;
  padding: 1px 10px 0;
  display: inline-grid;
  place-items: center;
  box-sizing: border-box;
  border-radius: var(--agent-radius-pill);
  background: rgb(52 199 89 / 16%);
  color: #1a7a37;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: -0.1px;
  line-height: normal;
}
.garage-detail__status.is-out {
  background: rgb(255 159 10 / 18%);
  color: #9a5b00;
}
.garage-detail__status.is-impounded {
  background: rgb(255 69 58 / 16%);
  color: #b3241a;
}
.garage-detail h2 {
  margin: 8px 0 1px;
  font-size: 22px;
  line-height: 1.1;
  letter-spacing: -0.03em;
}
.garage-detail > p {
  margin: 0;
  color: var(--garage-secondary);
  font-size: 14px;
  font-weight: 520;
}
.garage-detail__location {
  margin: 17px 0 11px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--agent-radius-card);
  border: 1px solid var(--agent-hairline);
  background: var(--agent-app-accent-soft);
  text-align: left;
}
.garage-detail__location-icon {
  width: 31px;
  height: 31px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: var(--agent-radius-control);
  background: var(--garage-blue);
  color: #fff;
  font-style: normal;
}
.garage-detail__location span {
  display: flex;
  flex-direction: column;
}
.garage-detail__location small {
  color: var(--garage-secondary);
  font-size: 12px;
  font-weight: 560;
}
.garage-detail__location strong {
  color: var(--garage-text);
  font-size: 15px;
}
.garage-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
}
.garage-metrics article {
  padding: 10px 8px;
  border-radius: var(--agent-radius-control);
  border: 1px solid var(--garage-separator);
  background: var(--garage-surface-muted);
  text-align: left;
}
.garage-metrics article > span {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--garage-secondary);
  font-size: 12px;
  font-weight: 600;
}
.garage-metrics article > strong {
  margin: 5px 0 7px;
  display: block;
  font-size: 17px;
}
.garage-metrics article > i {
  height: 4px;
  display: block;
  overflow: hidden;
  border-radius: var(--agent-radius-pill);
  background: rgb(118 118 128 / 16%);
}
.garage-metrics article > i b {
  height: 100%;
  display: block;
  border-radius: inherit;
  background: var(--garage-blue);
}
.garage-detail__vin {
  margin-top: 11px;
  padding: 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgb(60 60 67 / 10%);
  color: var(--garage-secondary);
  font-size: 12px;
  font-weight: 560;
}
.garage-detail__vin strong {
  color: var(--garage-text);
  font-size: 12px;
  letter-spacing: 0.04em;
}
.garage-valet-live {
  margin: 11px 0 13px;
  padding: 13px;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-radius: var(--agent-radius-card);
}
.garage-valet-live__icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: var(--agent-radius-control);
  background: var(--garage-blue);
  color: white;
}
.garage-valet-live__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.garage-valet-live__body small,
.garage-valet-offer__top small {
  color: var(--garage-blue);
  font-size: 12px;
  font-weight: 760;
  letter-spacing: 0.01em;
}
.garage-valet-live__body strong {
  overflow: hidden;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.garage-valet-live__body span {
  color: var(--garage-secondary);
  font-size: 11px;
}
.garage-valet-live__track {
  height: 3px;
  margin-top: 7px;
  overflow: hidden;
  border-radius: var(--agent-radius-pill);
  background: rgb(10 132 255 / 13%);
}
.garage-valet-live__track i {
  width: 42%;
  height: 100%;
  display: block;
  border-radius: inherit;
  background: var(--garage-blue);
  animation: garage-valet-track 1.4s ease-in-out infinite alternate;
}
.garage-valet-live :deep(button) {
  min-width: 0;
  padding: 5px 8px;
  font-size: 11px;
}
.garage-valet-offer {
  margin-top: 13px;
  padding: 14px;
  border-radius: var(--agent-radius-card);
  text-align: left;
}
.garage-valet-offer__top {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
}
.garage-valet-offer__top > span {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: var(--agent-radius-control);
  background: var(--garage-blue);
  color: #fff;
}
.garage-valet-offer__top > div {
  display: flex;
  flex-direction: column;
}
.garage-valet-offer__top strong {
  font-size: 16px;
}
.garage-valet-offer__top > b {
  color: var(--garage-blue);
  font-size: 16px;
}
.garage-valet-offer > p {
  margin: 10px 0;
  color: var(--garage-secondary);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.45;
}
.garage-valet-offer__facts {
  margin-bottom: 11px;
  display: flex;
  gap: 12px;
  color: var(--garage-secondary);
  font-size: 12px;
  font-weight: 560;
}
.garage-valet-offer__facts span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.garage-valet-offer :deep(button) {
  width: 100%;
  min-height: 44px;
  gap: 7px;
  background: var(--garage-blue);
  font-size: 14px;
  font-weight: 650;
}
.garage-valet-offer :deep(button:disabled) {
  opacity: 0.65;
}
.garage-valet-dialog {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: var(--garage-secondary);
  text-align: center;
}
.garage-valet-dialog > span {
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  display: grid;
  place-items: center;
  border-radius: var(--agent-radius-card);
  background: var(--garage-blue);
  color: #fff;
}
.garage-valet-dialog p {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
}
.garage-valet-dialog small {
  margin-top: 7px;
  color: var(--garage-blue);
  font-size: 11px;
}
@keyframes garage-valet-track {
  from {
    transform: translateX(-18%);
  }
  to {
    transform: translateX(155%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .garage-valet-live__track i {
    animation: none;
    transform: none;
  }
}
.garage-page.agent-app-page--dark .garage-vehicle__visual {
  border-color: rgb(10 132 255 / 18%);
  background: #17263a;
  color: #64aaff;
}
.garage-page.agent-app-page--dark .garage-vehicle__visual.is-bike {
  background: #352445;
  color: #d3a4ff;
}
.garage-page.agent-app-page--dark .garage-vehicle__visual.is-boat {
  background: #153740;
  color: #70e5f4;
}
.garage-page.agent-app-page--dark .garage-vehicle__visual.is-plane,
.garage-page.agent-app-page--dark .garage-vehicle__visual.is-helicopter {
  background: #3d2d17;
  color: #ffd37a;
}
</style>