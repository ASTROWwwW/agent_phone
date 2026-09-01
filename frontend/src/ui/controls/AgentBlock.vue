<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    component?: 'article' | 'aside' | 'div' | 'section'
    inset?: boolean
    nested?: boolean
    outline?: boolean
    strong?: boolean
  }>(),
  {
    component: 'div',
    inset: false,
    nested: false,
    outline: false,
    strong: false,
  },
)
</script>

<template>
  <component
    :is="component"
    v-bind="$attrs"
    class="agent-block"
    :class="{
      'agent-block--inset': inset,
      'agent-block--nested': nested,
      'agent-block--outline': outline,
      'agent-block--strong': strong,
    }"
  >
    <slot />
  </component>
</template>
