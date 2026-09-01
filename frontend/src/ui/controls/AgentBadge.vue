<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    component?: string
    small?: boolean
    tone?: 'danger' | 'info' | 'neutral' | 'primary' | 'success' | 'warning'
  }>(),
  {
    component: 'span',
    small: false,
    tone: 'primary',
  },
)
</script>

<template>
  <component
    :is="component"
    v-bind="$attrs"
    class="agent-badge"
    :class="[`agent-badge--${tone}`, { 'agent-badge--small': small }]"
  >
    <slot />
  </component>
</template>
