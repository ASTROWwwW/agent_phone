<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    showLabel?: boolean
    size: 'small' | 'medium' | 'large'
  }>(),
  {
    showLabel: true,
  },
)
</script>

<template>
  <div
    class="agent-widget-frame"
    :class="[
      `agent-widget-frame--${size}`,
      { 'agent-widget-frame--unlabelled': !showLabel },
    ]"
  >
    <div class="agent-widget-frame__surface">
      <slot />
    </div>
    <span v-if="showLabel" class="agent-widget-frame__label" aria-hidden="true">
      {{ label }}
    </span>
  </div>
</template>
