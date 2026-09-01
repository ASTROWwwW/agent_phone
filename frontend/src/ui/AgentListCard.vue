<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    inset?: boolean
    strong?: boolean
  }>(),
  {
    inset: true,
    strong: true,
  },
)
</script>

<template>
  <ul
    v-bind="$attrs"
    class="agent-list-card"
    :class="{
      'agent-list-card--inset': inset,
      'agent-list-card--strong': strong,
    }"
  >
    <slot />
  </ul>
</template>
