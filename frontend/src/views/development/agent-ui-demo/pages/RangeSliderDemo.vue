<script setup lang="ts">
import { ref } from 'vue'

import {
  AgentBlockHeader,
  AgentBlockTitle,
  AgentList,
  AgentListItem,
  AgentRange,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const volume = ref(50)
const price = ref(150)
const red = ref(100)
const green = ref(50)
const blue = ref(75)
</script>

<template>
  <AgentUiDemoPage title="Range Slider">
    <AgentBlockTitle>Volume: {{ volume }}</AgentBlockTitle>
    <AgentBlockHeader>From 0 to 100 with step 10</AgentBlockHeader>
    <AgentList inset strong>
      <AgentListItem>
        <template #inner>
          <span class="range-slider-demo__row">
            <span>0</span>
            <AgentRange
              v-model="volume"
              aria-label="Volume"
              :max="100"
              :min="0"
              :step="10"
            />
            <span>100</span>
          </span>
        </template>
      </AgentListItem>
    </AgentList>

    <AgentBlockTitle>Price: ${{ price }}</AgentBlockTitle>
    <AgentBlockHeader>From 0 to 1000 with step 1</AgentBlockHeader>
    <AgentList inset strong>
      <AgentListItem>
        <template #inner>
          <span class="range-slider-demo__row">
            <span>$0</span>
            <AgentRange
              v-model="price"
              aria-label="Price"
              :max="1000"
              :min="0"
              :step="1"
            />
            <span>$1000</span>
          </span>
        </template>
      </AgentListItem>
    </AgentList>

    <AgentBlockTitle>
      Color: rgb({{ red }}, {{ green }}, {{ blue }})
    </AgentBlockTitle>
    <AgentList inset strong>
      <AgentListItem>
        <template #inner>
          <AgentRange
            v-model="red"
            aria-label="Red"
            class="agent-ui-demo-color-red"
            :max="255"
            :min="0"
            :step="1"
          />
        </template>
      </AgentListItem>
      <AgentListItem>
        <template #inner>
          <AgentRange
            v-model="green"
            aria-label="Green"
            class="agent-ui-demo-color-green"
            :max="255"
            :min="0"
            :step="1"
          />
        </template>
      </AgentListItem>
      <AgentListItem>
        <template #inner>
          <AgentRange
            v-model="blue"
            aria-label="Blue"
            class="range-slider-demo__blue"
            :max="255"
            :min="0"
            :step="1"
          />
        </template>
      </AgentListItem>
    </AgentList>
  </AgentUiDemoPage>
</template>

<style scoped>
.range-slider-demo__row {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--agent-space-4);
}

.range-slider-demo__row .agent-range {
  min-width: 0;
  flex: 1;
}

.range-slider-demo__blue {
  --agent-app-accent: #007aff;
  --agent-app-accent-soft: rgba(0, 122, 255, 0.16);
}
</style>
