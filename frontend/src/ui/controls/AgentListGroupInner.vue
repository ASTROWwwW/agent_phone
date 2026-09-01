<script setup lang="ts">
import { computed, inject, provide } from 'vue'

import { agentListContextKey } from './list-context'

const parent = inject(agentListContextKey, undefined)

provide(
  agentListContextKey,
  computed(() => ({
    dividers: parent?.value.dividers ?? false,
    nested: false,
  })),
)
</script>

<template>
  <slot />
</template>
