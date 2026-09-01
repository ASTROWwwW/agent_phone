<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    align?: 'center' | 'end' | 'start'
    label: string
    layout?: 'compact' | 'full' | 'split'
  }>(),
  {
    align: 'center',
    layout: 'full',
  },
)
</script>

<template>
  <nav
    v-bind="$attrs"
    class="agent-pill-navigation"
    :class="[
      `agent-pill-navigation--${layout}`,
      `agent-pill-navigation--align-${align}`,
    ]"
    :aria-label="label"
  >
    <div class="agent-pill-navigation__inner">
      <div
        v-if="$slots.default"
        class="agent-pill-navigation__group agent-pill-navigation__group--primary"
      >
        <slot />
      </div>
      <div
        v-if="layout === 'split' && $slots.end"
        class="agent-pill-navigation__group agent-pill-navigation__group--end"
      >
        <slot name="end" />
      </div>
    </div>
  </nav>
</template>
