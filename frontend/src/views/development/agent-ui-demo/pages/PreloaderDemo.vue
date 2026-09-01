<script setup lang="ts">
import { AgentBlock, AgentBlockTitle, AgentSpinner } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'
</script>

<template>
  <AgentUiDemoPage title="Preloader">
    <AgentBlockTitle>Default</AgentBlockTitle>
    <AgentBlock class="preloader-single" inset strong>
      <AgentSpinner label="Loading" />
    </AgentBlock>

    <AgentBlockTitle>Colors</AgentBlockTitle>
    <AgentBlock class="preloader-grid" inset strong>
      <AgentSpinner class="agent-ui-demo-color-red" label="Red loader" />
      <AgentSpinner class="agent-ui-demo-color-green" label="Green loader" />
      <AgentSpinner class="agent-ui-demo-color-purple" label="Purple loader" />
      <AgentSpinner class="agent-ui-demo-color-yellow" label="Yellow loader" />
    </AgentBlock>

    <AgentBlockTitle>Sizes</AgentBlockTitle>
    <AgentBlock class="preloader-grid preloader-grid--sizes" outline strong>
      <AgentSpinner label="Small loader" :size="16" />
      <AgentSpinner label="Medium loader" :size="32" />
      <AgentSpinner label="Large loader" :size="48" />
      <AgentSpinner label="Extra large loader" :size="64" />
    </AgentBlock>
  </AgentUiDemoPage>
</template>

<style scoped>
.preloader-single {
  text-align: center;
}

.preloader-grid {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  justify-items: center;
}

.preloader-grid--sizes {
  min-height: 96px;
}

.preloader-grid :deep(.agent-ui-demo-color-red) {
  color: #ff3b30;
}

.preloader-grid :deep(.agent-ui-demo-color-green) {
  color: #4cd964;
}

.preloader-grid :deep(.agent-ui-demo-color-purple) {
  color: #9c27b0;
}

.preloader-grid :deep(.agent-ui-demo-color-yellow) {
  color: #ffcc00;
}
</style>
