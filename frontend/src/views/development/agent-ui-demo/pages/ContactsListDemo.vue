<script setup lang="ts">
import { AgentList, AgentListGroup, AgentListItem } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const contacts = [
  {
    letter: 'A',
    names: [
      'Aaron',
      'Abbie',
      'Adam',
      'Adele',
      'Agatha',
      'Agnes',
      'Albert',
      'Alexander',
    ],
  },
  {
    letter: 'B',
    names: ['Bailey', 'Barclay', 'Bartolo', 'Bellamy', 'Belle', 'Benjamin'],
  },
  {
    letter: 'C',
    names: [
      'Caiden',
      'Calvin',
      'Candy',
      'Carl',
      'Cherilyn',
      'Chester',
      'Chloe',
    ],
  },
  { letter: 'V', names: ['Vladimir'] },
]
</script>

<template>
  <AgentUiDemoPage title="Contacts List">
    <AgentList class="contacts-list-demo__list" flush strong>
      <AgentListGroup
        v-for="group in contacts"
        :key="group.letter"
        :dividers="false"
      >
        <AgentListItem contacts group-title :title="group.letter" />
        <AgentListItem
          v-for="name in group.names"
          :key="name"
          contacts
          :title="name"
        />
      </AgentListGroup>
    </AgentList>
  </AgentUiDemoPage>
</template>

<style scoped>
.contacts-list-demo__list :deep(.agent-list-item--group-title) {
  min-height: 32px;
  padding: 0 var(--agent-space-4);
  align-items: center;
  background: var(--agent-surface-muted);
  color: var(--agent-text);
  font-size: 14px;
}
</style>
