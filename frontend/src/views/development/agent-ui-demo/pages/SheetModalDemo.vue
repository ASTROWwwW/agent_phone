<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { ref } from 'vue'

import {
  AgentBlock,
  AgentButton,
  AgentIcon,
  AgentLink,
  AgentSheet,
  AgentToolbar,
  AgentToolbarPane,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const sheetOpened = ref(false)
</script>

<template>
  <AgentUiDemoPage title="Sheet Modal">
    <AgentBlock class="agent-ui-demo-stack" inset strong>
      <p class="agent-ui-demo-copy">
        Sheet Modals slide up from the bottom of the screen to reveal more
        content. Such modals allow to create custom overlays with custom
        content.
      </p>
      <AgentButton rounded @click="sheetOpened = true">Open Sheet</AgentButton>
    </AgentBlock>

    <template #fixed>
      <AgentSheet
        aria-label="Sheet modal"
        class="agent-ui-demo-sheet"
        :opened="sheetOpened"
        @backdropclick="sheetOpened = false"
        @escape="sheetOpened = false"
      >
        <AgentToolbar
          aria-label="Sheet actions"
          class="agent-ui-demo-sheet__toolbar"
          top
        >
          <AgentToolbarPane>
            <AgentLink
              aria-label="Close sheet"
              icon-only
              @click="sheetOpened = false"
            >
              <AgentIcon :size="24"><X /></AgentIcon>
            </AgentLink>
          </AgentToolbarPane>
        </AgentToolbar>
        <AgentBlock class="agent-ui-demo-stack agent-ui-demo-sheet__content">
          <p class="agent-ui-demo-copy">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Harum ad
            excepturi nesciunt nobis aliquam. Quibusdam ducimus neque
            necessitatibus, molestias cupiditate velit nihil alias incidunt,
            excepturi voluptatem dolore itaque sapiente dolores!
          </p>
          <AgentButton block large rounded @click="sheetOpened = false"
            >Action</AgentButton
          >
        </AgentBlock>
      </AgentSheet>
    </template>
  </AgentUiDemoPage>
</template>

<style scoped>
.agent-ui-demo-sheet__toolbar {
  justify-content: flex-end;
}

.agent-ui-demo-sheet__content {
  gap: var(--agent-space-4);
  padding-right: calc(var(--agent-page-gutter) + var(--agent-safe-area-right, 0px));
  padding-left: calc(var(--agent-page-gutter) + var(--agent-safe-area-left, 0px));
}

.agent-ui-demo-sheet :deep(.agent-sheet__panel) {
  padding-bottom: var(--agent-safe-area-bottom);
}
</style>
