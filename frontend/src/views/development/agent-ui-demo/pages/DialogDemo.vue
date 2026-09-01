<script setup lang="ts">
import { ref } from 'vue'

import {
  AgentBlock,
  AgentButton,
  AgentDialog,
  AgentDialogButton,
  AgentList,
  AgentListItem,
  AgentRadio,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const basicOpened = ref(false)
const alertOpened = ref(false)
const confirmOpened = ref(false)
const listOpened = ref(false)
const radioValue = ref('batman')

function handleHeroRowClick(event: MouseEvent, value: string): void {
  const target = event.target
  if (target instanceof Element && target.closest('.agent-radio')) return
  radioValue.value = value
}
</script>

<template>
  <AgentUiDemoPage title="Dialog">
    <AgentBlock inset strong>
      Dialog is a type of modal window that appears in front of app content to
      provide critical information, or prompt for a decision to be made.
    </AgentBlock>

    <AgentBlock class="dialog-demo__buttons" inset strong>
      <AgentButton rounded @click="basicOpened = true">Basic</AgentButton>
      <AgentButton rounded @click="alertOpened = true">Alert</AgentButton>
      <AgentButton rounded @click="confirmOpened = true">Confirm</AgentButton>
      <AgentButton rounded @click="listOpened = true">List</AgentButton>
    </AgentBlock>

    <template #fixed>
      <AgentDialog
        :opened="basicOpened"
        @backdropclick="basicOpened = false"
        @escape="basicOpened = false"
      >
        <template #title>Dialog Title</template>
        Dialog is a type of modal window that appears in front of app content to
        provide critical information, or prompt for a decision to be made.
        <template #buttons>
          <AgentDialogButton @click="basicOpened = false">
            Action 2
          </AgentDialogButton>
          <AgentDialogButton strong @click="basicOpened = false">
            Action 1
          </AgentDialogButton>
        </template>
      </AgentDialog>

      <AgentDialog
        :opened="alertOpened"
        role="alertdialog"
        @backdropclick="alertOpened = false"
        @escape="alertOpened = false"
      >
        <template #title>Konsta UI</template>
        Hello world!
        <template #buttons>
          <AgentDialogButton strong @click="alertOpened = false">
            Ok
          </AgentDialogButton>
        </template>
      </AgentDialog>

      <AgentDialog
        :opened="confirmOpened"
        role="alertdialog"
        @backdropclick="confirmOpened = false"
        @escape="confirmOpened = false"
      >
        <template #title>Konsta UI</template>
        All good today?
        <template #buttons>
          <AgentDialogButton @click="confirmOpened = false">No</AgentDialogButton>
          <AgentDialogButton strong @click="confirmOpened = false">
            Yes
          </AgentDialogButton>
        </template>
      </AgentDialog>

      <AgentDialog
        :opened="listOpened"
        @backdropclick="listOpened = false"
        @escape="listOpened = false"
      >
        <template #title>Your super hero</template>
        <AgentList class="dialog-demo__list" nested>
          <AgentListItem
            v-for="hero in [
              { label: 'Batman', value: 'batman' },
              { label: 'Spider-man', value: 'spiderman' },
              { label: 'Hulk', value: 'hulk' },
            ]"
            :key="hero.value"
            :title="hero.label"
            @click="handleHeroRowClick($event, hero.value)"
          >
            <template #after>
              <AgentRadio
                v-model="radioValue"
                :aria-label="hero.label"
                name="super-hero"
                :value="hero.value"
              />
            </template>
          </AgentListItem>
        </AgentList>
        <template #buttons>
          <AgentDialogButton strong @click="listOpened = false">
            Confirm
          </AgentDialogButton>
        </template>
      </AgentDialog>
    </template>
  </AgentUiDemoPage>
</template>

<style scoped>
.dialog-demo__buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--agent-space-3);
}

.dialog-demo__list {
  margin: 0 calc(var(--agent-space-4) * -1) calc(var(--agent-space-4) * -1);
}

.dialog-demo__list :deep(.agent-list-item__row) {
  cursor: pointer;
}
</style>
