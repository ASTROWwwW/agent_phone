<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

import { useAgentPageScroll } from './page-scroll-context'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    as?: string
    padded?: boolean
    withTabbar?: boolean
  }>(),
  {
    as: 'section',
    padded: false,
    withTabbar: false,
  },
)

const root = ref<HTMLElement | null>(null)
const pageScroll = useAgentPageScroll()
let unregister: (() => void) | undefined

watch(
  root,
  (element) => {
    unregister?.()
    unregister = element ? pageScroll?.register(element) : undefined
  },
  { flush: 'post' },
)

onBeforeUnmount(() => unregister?.())
</script>

<template>
  <component
    :is="as"
    ref="root"
    v-bind="$attrs"
    class="agent-scroll-area"
    :class="{
      'agent-scroll-area--padded': padded,
      'agent-scroll-area--tabbar': withTabbar,
    }"
  >
    <slot />
  </component>
</template>
