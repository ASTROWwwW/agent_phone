<script setup lang="ts">
import { computed, ref } from 'vue'

import { AgentList, AgentListItem, AgentSearchbar } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const items = [
  'FC Ajax',
  'FC Arsenal',
  'FC Athletic',
  'FC Barcelona',
  'FC Bayern München',
  'FC Bordeaux',
  'FC Borussia Dortmund',
  'FC Chelsea',
  'FC Galatasaray',
  'FC Juventus',
  'FC Liverpool',
  'FC Manchester City',
  'FC Manchester United',
  'FC Paris Saint-Germain',
  'FC Real Madrid',
  'FC Tottenham Hotspur',
  'FC Valencia',
  'FC West Ham United',
]

const searchQuery = ref('')
const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('en-US')
  return query
    ? items.filter((item) => item.toLocaleLowerCase('en-US').includes(query))
    : items
})
</script>

<template>
  <AgentUiDemoPage title="Searchbar">
    <template #subnavbar>
      <AgentSearchbar
        v-model="searchQuery"
        class="agent-ui-demo-fill"
        clear-label="Clear search"
        disable-button
        disable-label="Cancel"
        label="Search football clubs"
        placeholder="Search"
        @disable="searchQuery = ''"
      />
    </template>

    <AgentList inset strong>
      <AgentListItem v-if="filteredItems.length === 0" title="Nothing found" />
      <AgentListItem v-for="item in filteredItems" :key="item" :title="item" />
    </AgentList>
  </AgentUiDemoPage>
</template>
