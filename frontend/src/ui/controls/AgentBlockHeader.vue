<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    component?: 'div' | 'header' | 'p' | 'section'
    inset?: boolean
  }>(),
  {
    component: 'div',
    inset: false,
  },
)
</script>

<template>
  <component
    :is="component"
    v-bind="$attrs"
    class="agent-block-header"
    :class="{ 'agent-block-header--inset': inset }"
  >
    <slot />
  </component>
</template>
