<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    header?: boolean
    selected?: boolean
  }>(),
  {
    header: false,
    selected: false,
  },
)
</script>

<template>
  <tr
    v-bind="$attrs"
    class="agent-table-row"
    :class="{
      'agent-table-row--header': header,
      'agent-table-row--selected': selected,
    }"
    :aria-selected="selected || undefined"
  >
    <slot />
  </tr>
</template>
