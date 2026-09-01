<script setup lang="ts">
import { computed, type CSSProperties, useSlots } from 'vue'

import AgentBadge from './AgentBadge.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    badge?: number | string
    badgeColors?: {
      bg?: string
      text?: string
    }
    component?: string
    label?: string
    size?: number | string
  }>(),
  {
    badge: undefined,
    badgeColors: undefined,
    component: 'i',
    label: '',
    size: undefined,
  },
)

const slots = useSlots()

const iconStyle = computed<CSSProperties | undefined>(() => {
  if (props.size === undefined) return undefined
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  return { height: size, width: size }
})

const badgeStyle = computed<CSSProperties | undefined>(() => {
  if (!props.badgeColors?.bg && !props.badgeColors?.text) return undefined
  return {
    background: props.badgeColors.bg,
    color: props.badgeColors.text,
  }
})

const hasBadge = computed(
  () =>
    (props.badge !== undefined && props.badge !== null) || Boolean(slots.badge),
)
</script>

<template>
  <component
    :is="component"
    v-bind="$attrs"
    class="agent-icon"
    :style="iconStyle"
    :aria-hidden="label ? undefined : true"
    :aria-label="label || undefined"
    :role="label ? 'img' : undefined"
  >
    <slot />
    <AgentBadge v-if="hasBadge" class="agent-icon__badge" small :style="badgeStyle">
      {{ badge }}<slot name="badge" />
    </AgentBadge>
  </component>
</template>

<style scoped>
.agent-icon {
  position: relative;
  font-style: normal;
}

.agent-icon__badge {
  position: absolute;
  inset-block-start: -2px;
  inset-inline-end: -6px;
}
</style>
