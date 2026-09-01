<script setup lang="ts">
withDefaults(defineProps<{ component?: string; dividers?: boolean }>(), {
  component: 'div',
  dividers: true,
})
</script>

<template>
  <component
    :is="component"
    class="agent-action-group agent-glass-surface"
    :class="{ 'agent-action-group--dividers': dividers }"
  >
    <slot />
  </component>
</template>
