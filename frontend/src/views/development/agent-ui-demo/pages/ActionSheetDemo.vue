<script setup lang="ts">
import { ref } from 'vue'

import {
  AgentActionButton,
  AgentActionGroup,
  AgentActionSheet,
  AgentActionsLabel,
  AgentBlock,
  AgentBlockTitle,
  AgentButton,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const actionsOneOpened = ref(false)
const actionsTwoOpened = ref(false)
</script>

<template>
  <AgentUiDemoPage class="action-sheet-demo" title="Action Sheet">
    <AgentBlock inset strong>
      Action Sheet is a slide-up pane for presenting the user with a set of
      alternatives for how to proceed with a given task.
    </AgentBlock>

    <AgentBlockTitle>Open Action Sheet</AgentBlockTitle>
    <AgentBlock class="agent-ui-demo-row" inset strong>
      <AgentButton
        class="action-sheet-demo__trigger"
        rounded
        @click="actionsOneOpened = true"
      >
        One group
      </AgentButton>
      <AgentButton
        class="action-sheet-demo__trigger"
        rounded
        @click="actionsTwoOpened = true"
      >
        Two groups
      </AgentButton>
    </AgentBlock>

    <template #fixed>
      <AgentActionSheet
        aria-label="Do something"
        :opened="actionsOneOpened"
        @backdropclick="actionsOneOpened = false"
        @escape="actionsOneOpened = false"
      >
        <AgentActionGroup>
          <AgentActionsLabel>Do something</AgentActionsLabel>
          <AgentActionButton bold @click="actionsOneOpened = false">
            Button 1
          </AgentActionButton>
          <AgentActionButton @click="actionsOneOpened = false">
            Button 2
          </AgentActionButton>
          <AgentActionButton @click="actionsOneOpened = false">
            Cancel
          </AgentActionButton>
        </AgentActionGroup>
      </AgentActionSheet>

      <AgentActionSheet
        aria-label="Do something"
        :opened="actionsTwoOpened"
        @backdropclick="actionsTwoOpened = false"
        @escape="actionsTwoOpened = false"
      >
        <AgentActionGroup>
          <AgentActionsLabel>Do something</AgentActionsLabel>
          <AgentActionButton bold @click="actionsTwoOpened = false">
            Button 1
          </AgentActionButton>
          <AgentActionButton @click="actionsTwoOpened = false">
            Button 2
          </AgentActionButton>
        </AgentActionGroup>
        <AgentActionGroup>
          <AgentActionButton @click="actionsTwoOpened = false">
            Cancel
          </AgentActionButton>
        </AgentActionGroup>
      </AgentActionSheet>
    </template>
  </AgentUiDemoPage>
</template>

<style scoped>
.action-sheet-demo__trigger {
  min-width: 0;
  flex: 1 1 0;
}
</style>
