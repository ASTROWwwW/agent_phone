<script setup lang="ts">
defineOptions({ inheritAttrs: false })
</script>

<template>
  <tbody v-bind="$attrs" class="agent-table-body">
    <slot />
  </tbody>
</template>
