<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    sticky?: boolean
  }>(),
  {
    sticky: false,
  },
)
</script>

<template>
  <thead
    v-bind="$attrs"
    class="agent-table-head"
    :class="{ 'agent-table-head--sticky': sticky }"
  >
    <slot />
  </thead>
</template>
