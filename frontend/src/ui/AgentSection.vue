<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  title: string
}>()
</script>

<template>
  <section v-bind="$attrs" class="agent-section">
    <h2 class="agent-section__title">{{ title }}</h2>
    <slot />
  </section>
</template>
