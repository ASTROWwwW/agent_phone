<script setup lang="ts">
import { ref } from 'vue'

import { AgentBlock, AgentBlockTitle, AgentSegmented, AgentSegmentedButton } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

interface SegmentedExample {
  outline: boolean
  raised: boolean
  strong: boolean
  title: string
}

const activeSegmented = ref(1)
const sections: readonly SegmentedExample[] = [
  {
    outline: false,
    raised: false,
    strong: false,
    title: 'Default Segmented',
  },
  {
    outline: false,
    raised: true,
    strong: false,
    title: 'Raised Segmented',
  },
  { outline: true, raised: false, strong: false, title: 'Outline' },
  {
    outline: false,
    raised: false,
    strong: true,
    title: 'Strong Segmented',
  },
]
</script>

<template>
  <AgentUiDemoPage title="Segmented Control">
    <template v-for="section in sections" :key="section.title">
      <AgentBlockTitle>{{ section.title }}</AgentBlockTitle>
      <AgentBlock class="segmented-control-demo__surface" inset strong>
        <AgentSegmented
          :active-index="activeSegmented - 1"
          :aria-label="section.title"
          :item-count="3"
          :navigation="false"
          :outline="section.outline"
          :raised="section.raised"
          :rounded="false"
          :strong="section.strong"
        >
          <AgentSegmentedButton
            v-for="index in 3"
            :key="index"
            :active="activeSegmented === index"
            @click="activeSegmented = index"
          >
            Button
          </AgentSegmentedButton>
        </AgentSegmented>
        <AgentSegmented
          :active-index="activeSegmented - 1"
          :aria-label="`${section.title}, rounded`"
          :item-count="3"
          :navigation="false"
          :outline="section.outline"
          :raised="section.raised"
          :rounded="true"
          :strong="section.strong"
        >
          <AgentSegmentedButton
            v-for="index in 3"
            :key="index"
            :active="activeSegmented === index"
            @click="activeSegmented = index"
          >
            Button
          </AgentSegmentedButton>
        </AgentSegmented>
      </AgentBlock>
    </template>
  </AgentUiDemoPage>
</template>

<style scoped>
.segmented-control-demo__surface {
  display: grid;
  gap: var(--agent-space-4);
}
</style>
