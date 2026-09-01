<script setup lang="ts">
import { computed, provide } from 'vue'

import { agentListContextKey } from './list-context'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    component?: 'div' | 'ol' | 'ul'
    density?: 'compact' | 'regular'
    dividers?: boolean
    flush?: boolean
    inset?: boolean
    menu?: boolean
    nested?: boolean
    outline?: boolean
    strong?: boolean
  }>(),
  {
    component: 'div',
    density: 'regular',
    dividers: true,
    flush: false,
    inset: false,
    menu: false,
    nested: false,
    outline: false,
    strong: false,
  },
)

provide(
  agentListContextKey,
  computed(() => ({ dividers: props.dividers, nested: props.nested })),
)
</script>

<template>
  <component
    :is="component"
    v-bind="$attrs"
    class="agent-list"
    :class="{
      'agent-list--inset': inset,
      'agent-list--dividers': dividers,
      'agent-list--menu': menu,
      'agent-list--nested': nested,
      'agent-list--outline': outline,
      'agent-list--strong': strong,
      'agent-list--compact': density === 'compact',
      'agent-list--flush': flush,
    }"
  >
    <ul class="agent-list__items">
      <slot />
    </ul>
  </component>
</template>
