<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    component?: 'div' | 'section'
    highlight?: boolean
  }>(),
  {
    component: 'div',
    highlight: false,
  },
)
</script>

<template>
  <component
    :is="component"
    v-bind="$attrs"
    class="agent-surface"
    :class="{ 'agent-surface--highlight': highlight }"
  >
    <slot />
  </component>
</template>
