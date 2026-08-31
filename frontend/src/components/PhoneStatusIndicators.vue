<script setup lang="ts">
import { computed } from 'vue'
import { Plane } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    airplaneMode?: boolean
    batteryLevel?: number
    cellularEnabled?: boolean
    wifiEnabled?: boolean
  }>(),
  {
    airplaneMode: false,
    batteryLevel: 100,
    cellularEnabled: true,
    wifiEnabled: true,
  },
)

// Piste interieure de la batterie, en unites du viewBox : de x = 2 a x = 23.
const TRACK_X = 2
const TRACK_WIDTH = 21
const FILL_RADIUS = 2.3

const clampedLevel = computed(() =>
  Math.min(100, Math.max(0, Math.round(props.batteryLevel))),
)

const fillWidth = computed(() => {
  if (clampedLevel.value === 0) return 0
  // Sous un diametre de coin, un rectangle arrondi degenere en trait
  // illisible : on garde une pastille minimale pour que 1 % reste visible.
  return Math.max(FILL_RADIUS * 2, (TRACK_WIDTH * clampedLevel.value) / 100)
})

const isLow = computed(() => clampedLevel.value <= 20)
</script>

<template>
  <span class="phone-status-indicators" aria-hidden="true">
    <Plane
      v-if="airplaneMode"
      :size="18"
      :stroke-width="2.6"
      fill="currentColor"
    />
    <svg
      v-else-if="cellularEnabled"
      class="phone-status-indicators__signal"
      viewBox="0 0 20 16"
    >
      <rect x="0" y="11" width="3.5" height="5" rx="1.75" />
      <rect x="5.5" y="8" width="3.5" height="8" rx="1.75" />
      <rect x="11" y="4" width="3.5" height="12" rx="1.75" />
      <rect x="16.5" width="3.5" height="16" rx="1.75" opacity="0.42" />
    </svg>
    <svg
      v-if="wifiEnabled && !airplaneMode"
      class="phone-status-indicators__wifi"
      viewBox="0 0 22 17"
      fill="none"
    >
      <path d="M1.5 5.4a14.2 14.2 0 0 1 19 0" />
      <path d="M5 9.2a9 9 0 0 1 12 0" />
      <path d="M8.5 13a3.8 3.8 0 0 1 5 0" />
      <circle cx="11" cy="15.3" r="1.45" />
    </svg>
    <svg
      class="phone-status-indicators__battery"
      :class="{ 'phone-status-indicators__battery--low': isLow }"
      viewBox="0 0 27.4 13"
    >
      <rect x="0.5" y="0.5" width="24" height="12" rx="4.2" />
      <rect
        class="phone-status-indicators__battery-cap"
        x="25.5"
        y="4.35"
        width="1.9"
        height="4.3"
        rx="0.95"
      />
      <rect
        v-if="fillWidth > 0"
        class="phone-status-indicators__battery-level"
        :x="TRACK_X"
        y="2"
        :width="fillWidth"
        height="9"
        :rx="FILL_RADIUS"
      />
    </svg>
  </span>
</template>

<style scoped>
.phone-status-indicators {
  display: flex;
  align-items: center;
  gap: 5px;
  line-height: 0;
}

.phone-status-indicators > svg {
  display: block;
  flex: 0 0 auto;
  overflow: visible;
}

.phone-status-indicators__signal {
  width: 18px;
  height: 14px;
  fill: currentColor;
}

.phone-status-indicators__wifi {
  width: 19px;
  height: 15px;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
}

.phone-status-indicators__wifi circle {
  fill: currentColor;
  stroke: none;
}

.phone-status-indicators__battery {
  width: 27px;
  height: 13px;
  fill: currentColor;
}

/* Coque et embout restent en retrait : seul le niveau est a pleine opacite,
   comme dans la barre d'etat d'iOS. */
.phone-status-indicators__battery rect:first-child {
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
  opacity: 0.38;
}

.phone-status-indicators__battery-cap {
  opacity: 0.42;
}

.phone-status-indicators__battery--low .phone-status-indicators__battery-level {
  fill: #ff453a;
}
</style>
