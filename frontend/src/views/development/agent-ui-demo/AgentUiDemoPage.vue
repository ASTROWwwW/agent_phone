<script setup lang="ts">
import { AgentAppPage, AgentNavbar, AgentScrollArea } from '@/ui'

import { useAgentUiDemoContext } from './context'

withDefaults(
  defineProps<{
    padded?: boolean
    scrollClass?: string
    subtitle?: string
    title: string
    transparent?: boolean
    variant?: 'compact' | 'large' | 'medium'
    withTabbar?: boolean
  }>(),
  {
    padded: false,
    scrollClass: '',
    subtitle: '',
    transparent: false,
    variant: 'compact',
    withTabbar: false,
  },
)

const demo = useAgentUiDemoContext()
</script>

<template>
  <AgentAppPage
    class="agent-ui-demo-page"
    :accent="demo.accent.value"
    :accent-soft="demo.accentSoft.value"
    :dark="demo.dark.value"
    :label="title"
  >
    <AgentNavbar
      back-label="Back"
      show-back
      :subtitle="subtitle"
      :title="title"
      :transparent="transparent"
      :variant="variant"
      @back="demo.returnToCatalog"
    >
      <template v-if="$slots.navbarRight" #right>
        <slot name="navbarRight" />
      </template>
      <template v-if="$slots.subnavbar" #subnavbar>
        <slot name="subnavbar" />
      </template>
    </AgentNavbar>

    <AgentScrollArea
      class="agent-ui-demo-page__scroll"
      :class="scrollClass"
      :padded="padded"
      :with-tabbar="withTabbar"
    >
      <slot />
    </AgentScrollArea>

    <slot name="fixed" />
  </AgentAppPage>
</template>
