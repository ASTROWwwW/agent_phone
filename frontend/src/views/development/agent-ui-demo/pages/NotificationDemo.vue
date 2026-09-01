<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'

import {
  AgentBlock,
  AgentButton,
  AgentDialog,
  AgentDialogButton,
  AgentNotification,
} from '@/ui'

import demoIcon from '../assets/demo-icon.png'
import AgentUiDemoPage from '../AgentUiDemoPage.vue'

type NotificationId =
  | 'notificationCallbackOnClose'
  | 'notificationCloseOnClick'
  | 'notificationFull'
  | 'notificationWithButton'

const opened = reactive<Record<NotificationId, boolean>>({
  notificationCallbackOnClose: false,
  notificationCloseOnClick: false,
  notificationFull: false,
  notificationWithButton: false,
})
const alertOpened = ref(false)
let autoCloseTimer: number | null = null

function clearAutoCloseTimer(): void {
  if (autoCloseTimer === null) return
  window.clearTimeout(autoCloseTimer)
  autoCloseTimer = null
}

function closeAllNotifications(): void {
  opened.notificationCallbackOnClose = false
  opened.notificationCloseOnClick = false
  opened.notificationFull = false
  opened.notificationWithButton = false
}

function openNotification(id: NotificationId): void {
  clearAutoCloseTimer()
  closeAllNotifications()
  opened[id] = true

  if (id === 'notificationFull') {
    autoCloseTimer = window.setTimeout(() => {
      opened.notificationFull = false
      autoCloseTimer = null
    }, 3000)
  }
}

function closeWithCallback(): void {
  opened.notificationCallbackOnClose = false
  alertOpened.value = true
}

onBeforeUnmount(clearAutoCloseTimer)
</script>

<template>
  <AgentUiDemoPage title="Notification">
    <AgentBlock
      class="agent-ui-demo-stack agent-ui-demo-notification__stack"
      inset
      strong
    >
      <p class="agent-ui-demo-copy">
        Konsta UI comes with simple Notifications component that allows you to
        show some useful messages to user and request basic actions.
      </p>
      <AgentButton rounded @click="openNotification('notificationFull')">
        Full layout notification
      </AgentButton>
      <AgentButton rounded @click="openNotification('notificationWithButton')">
        With Close Button
      </AgentButton>
      <AgentButton rounded @click="openNotification('notificationCloseOnClick')">
        Click to Close
      </AgentButton>
      <AgentButton
        rounded
        @click="openNotification('notificationCallbackOnClose')"
      >
        Callback on Close
      </AgentButton>
    </AgentBlock>

    <template #fixed>
      <AgentNotification
        :opened="opened.notificationFull"
        role="alert"
        subtitle="This is a subtitle"
        text="This is a simple notification message"
        title="Konsta UI"
        title-right-text="now"
      >
        <template #icon>
          <img class="agent-ui-demo-notification__icon" :src="demoIcon" alt="" />
        </template>
      </AgentNotification>

      <AgentNotification
        close-label="Close notification"
        :opened="opened.notificationWithButton"
        subtitle="Notification with close button"
        text="Click (x) button to close me"
        title="Konsta UI"
        @click="opened.notificationWithButton = false"
        @close="opened.notificationWithButton = false"
      >
        <template #icon>
          <img class="agent-ui-demo-notification__icon" :src="demoIcon" alt="" />
        </template>
        <template #button />
      </AgentNotification>

      <AgentNotification
        :opened="opened.notificationCloseOnClick"
        subtitle="Notification with close on click"
        text="Click me to close"
        title="Konsta UI"
        title-right-text="now"
        @click="opened.notificationCloseOnClick = false"
      >
        <template #icon>
          <img class="agent-ui-demo-notification__icon" :src="demoIcon" alt="" />
        </template>
      </AgentNotification>

      <AgentNotification
        :opened="opened.notificationCallbackOnClose"
        subtitle="Notification with close on click"
        text="Click me to close"
        title="Konsta UI"
        title-right-text="now"
        @click="closeWithCallback"
      >
        <template #icon>
          <img class="agent-ui-demo-notification__icon" :src="demoIcon" alt="" />
        </template>
      </AgentNotification>

      <AgentDialog
        content="Notification closed"
        :opened="alertOpened"
        title="Konsta UI"
        @backdropclick="alertOpened = false"
        @escape="alertOpened = false"
      >
        <template #buttons>
          <AgentDialogButton @click="alertOpened = false">Ok</AgentDialogButton>
        </template>
      </AgentDialog>
    </template>
  </AgentUiDemoPage>
</template>

<style scoped>
.agent-ui-demo-notification__stack {
  gap: var(--agent-space-4);
}

.agent-ui-demo-notification__icon {
  width: 28px;
  height: 28px;
  display: block;
}
</style>
