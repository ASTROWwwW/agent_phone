<script setup lang="ts">
import { ref } from 'vue'

import {
  AgentBlock,
  AgentBlockTitle,
  AgentProgress,
  AgentSegmented,
  AgentSegmentedButton,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const progress = ref(0.1)
const values = [0.1, 0.3, 0.5, 1]
</script>

<template>
  <AgentUiDemoPage title="Progressbar">
    <AgentBlockTitle>Determinate Progress Bar</AgentBlockTitle>
    <AgentBlock class="progress-examples" inset strong>
      <AgentProgress
        class="progress-examples__selected"
        label="Selected progress"
        :progress="progress"
      />
      <AgentSegmented
        :active-index="values.indexOf(progress)"
        :item-count="4"
        rounded
        strong
      >
        <AgentSegmentedButton
          v-for="value in values"
          :key="value"
          :active="progress === value"
          @click="progress = value"
        >
          {{ value * 100 }}%
        </AgentSegmentedButton>
      </AgentSegmented>
    </AgentBlock>

    <AgentBlockTitle>Colors</AgentBlockTitle>
    <AgentBlock class="progress-colors" inset strong>
      <AgentProgress
        class="agent-ui-demo-color-red"
        label="Red progress"
        :progress="0.25"
      />
      <AgentProgress
        class="agent-ui-demo-color-green"
        label="Green progress"
        :progress="0.5"
      />
      <AgentProgress
        class="agent-ui-demo-color-yellow"
        label="Yellow progress"
        :progress="0.75"
      />
      <AgentProgress
        class="agent-ui-demo-color-purple"
        label="Purple progress"
        :progress="1"
      />
    </AgentBlock>
  </AgentUiDemoPage>
</template>

<style scoped>
.progress-examples__selected {
  margin-block: var(--agent-space-4, 16px);
}

.progress-colors {
  display: grid;
  gap: var(--agent-space-4, 16px);
}
</style>
