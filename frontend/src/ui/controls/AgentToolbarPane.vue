<script setup lang="ts">
import AgentGlass from './AgentGlass.vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    component?: 'div' | 'nav'
  }>(),
  {
    component: 'div',
  },
)
</script>

<template>
  <AgentGlass :component="component" v-bind="$attrs" class="agent-toolbar-pane">
    <slot />
  </AgentGlass>
</template>
