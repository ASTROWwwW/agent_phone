<script setup lang="ts">
import { reactive } from 'vue'

import { AgentBlock, AgentButton, AgentToast } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

type ToastPosition = 'center' | 'left' | 'right'

const opened = reactive<Record<ToastPosition, boolean>>({
  center: false,
  left: false,
  right: false,
})

function openToast(position: ToastPosition): void {
  opened.left = false
  opened.center = false
  opened.right = false
  opened[position] = true
}
</script>

<template>
  <AgentUiDemoPage title="Toast">
    <AgentBlock class="agent-ui-demo-stack toast-demo__controls" inset strong>
      <p class="agent-ui-demo-copy">
        Toasts provide brief feedback about an operation through a message on
        the screen.
      </p>
      <AgentButton class="toast-demo__button" rounded @click="openToast('left')"
        >Toast on Left</AgentButton
      >
      <AgentButton class="toast-demo__button" rounded @click="openToast('center')"
        >Toast on Center</AgentButton
      >
      <AgentButton class="toast-demo__button" rounded @click="openToast('right')"
        >Toast on Right</AgentButton
      >
    </AgentBlock>

    <template #fixed>
      <AgentToast
        v-for="position in ['left', 'center', 'right'] as const"
        :key="position"
        :opened="opened[position]"
        :position="position"
      >
        Hello this is {{ position }} toast!
        <template #button>
          <AgentButton clear inline rounded @click="opened[position] = false">
            Close
          </AgentButton>
        </template>
      </AgentToast>
    </template>
  </AgentUiDemoPage>
</template>

<style scoped>
.toast-demo__controls {
  gap: 16px;
}

.toast-demo__button {
  height: 34px;
  min-height: 34px;
  position: relative;
}

.toast-demo__button::before {
  position: absolute;
  inset: -5px 0;
  content: '';
}
</style>
