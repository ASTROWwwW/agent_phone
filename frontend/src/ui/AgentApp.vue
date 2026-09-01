<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

import { provideAgentTheme } from './theme'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    accent?: string
    accentSoft?: string
    component?: string
    dark?: boolean
    safeAreas?: boolean
  }>(),
  {
    accent: '',
    accentSoft: '',
    component: 'div',
    dark: false,
    safeAreas: true,
  },
)

provideAgentTheme({
  accent: () => props.accent,
  accentSoft: () => props.accentSoft,
  dark: () => props.dark,
  safeAreas: () => props.safeAreas,
})

const themeStyle = computed<CSSProperties | undefined>(() => {
  if (!props.accent && !props.accentSoft) return undefined

  return {
    ...(props.accent ? { '--agent-app-accent': props.accent } : {}),
    ...(props.accentSoft ? { '--agent-app-accent-soft': props.accentSoft } : {}),
  }
})
</script>

<template>
  <component
    :is="component"
    v-bind="$attrs"
    class="agent-app"
    :class="{
      'agent-app--dark': dark,
      'agent-app--no-safe-areas': !safeAreas,
      'agent-safe-areas': safeAreas,
    }"
    :style="themeStyle"
  >
    <slot />
  </component>
</template>
