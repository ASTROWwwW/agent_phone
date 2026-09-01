<script setup lang="ts">
import { ref } from 'vue'

import { AgentList, AgentListItem, AgentToggle } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const values = ref([true, true, true, true])
const colorClasses = [
  '',
  'agent-ui-demo-color-red',
  'agent-ui-demo-color-green',
  'agent-ui-demo-color-yellow',
]
</script>

<template>
  <AgentUiDemoPage title="Toggle">
    <AgentList inset strong>
      <AgentListItem
        v-for="(_, index) in values"
        :key="index"
        label
        :title="`Item ${index + 1}`"
      >
        <template #after>
          <AgentToggle
            v-model="values[index]"
            :aria-label="`Item ${index + 1}`"
            :class="colorClasses[index]"
            component="div"
            :name="`demo-toggle-${index + 1}`"
          />
        </template>
      </AgentListItem>
    </AgentList>
  </AgentUiDemoPage>
</template>
