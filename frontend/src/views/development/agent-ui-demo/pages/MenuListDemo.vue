<script setup lang="ts">
import { ref } from 'vue'

import { AgentBlock, AgentMenuList, AgentMenuListItem } from '@/ui'

import demoIcon from '../assets/demo-icon.png'
import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const firstActive = ref('home')
const secondActive = ref('home')
const items = [
  { id: 'home', subtitle: 'Home subtitle', title: 'Home' },
  { id: 'profile', subtitle: 'Profile subtitle', title: 'Profile' },
  { id: 'settings', subtitle: 'Settings subtitle', title: 'Settings' },
]
</script>

<template>
  <AgentUiDemoPage title="Menu List">
    <AgentBlock inset strong>
      <p class="menu-list-copy">
        Menu list unlike usual links list is designed to indicate currently
        active screen (or section) of your app. Think about it like a Tabbar but
        in a form of a list.
      </p>
    </AgentBlock>

    <AgentMenuList aria-label="Primary menu" outline strong>
      <AgentMenuListItem
        v-for="item in items"
        :key="item.id"
        :active="firstActive === item.id"
        :title="item.title"
        @click="firstActive = item.id"
      >
        <template #media>
          <img class="menu-list-demo__icon" :src="demoIcon" alt="" />
        </template>
      </AgentMenuListItem>
    </AgentMenuList>

    <AgentMenuList aria-label="Detailed menu" outline strong>
      <AgentMenuListItem
        v-for="item in items"
        :key="item.id"
        :active="secondActive === item.id"
        :subtitle="item.subtitle"
        :title="item.title"
        @click="secondActive = item.id"
      >
        <template #media>
          <img class="menu-list-demo__icon" :src="demoIcon" alt="" />
        </template>
      </AgentMenuListItem>
    </AgentMenuList>
  </AgentUiDemoPage>
</template>

<style scoped>
.menu-list-copy {
  margin: 0;
}

.menu-list-demo__icon {
  width: 28px;
  height: 28px;
  display: block;
}
</style>
