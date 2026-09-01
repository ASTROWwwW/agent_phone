<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    ariaLabel?: string
    caption?: string
    compact?: boolean
    striped?: boolean
  }>(),
  {
    ariaLabel: '',
    caption: '',
    compact: false,
    striped: false,
  },
)
</script>

<template>
  <table
    v-bind="$attrs"
    class="agent-table"
    :class="{
      'agent-table--compact': compact,
      'agent-table--striped': striped,
    }"
    :aria-label="ariaLabel || undefined"
  >
    <caption v-if="caption || $slots.caption" class="agent-table__caption">
      <slot name="caption">{{ caption }}</slot>
    </caption>
    <slot />
  </table>
</template>
