<script setup lang="ts">
import { ref } from 'vue'

import {
  AgentBadge,
  AgentIcon,
  AgentLink,
  AgentList,
  AgentListItem,
  AgentTabBar,
  AgentTabButton,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'
import BadgeIosIcon from '../assets/BadgeIosIcon.vue'
import demoIcon from '../assets/demo-icon.png'

const activeTab = ref('inbox')
</script>

<template>
  <AgentUiDemoPage title="Badge" with-tabbar>
    <template #navbarRight>
      <AgentLink
        aria-label="Profile, 5 notifications"
        class="badge-demo__profile-action"
        icon-only
      >
        <AgentIcon badge="5" :badge-colors="{ bg: '#ef4444' }" :size="28">
          <BadgeIosIcon name="person-circle-fill" />
        </AgentIcon>
      </AgentLink>
    </template>

    <AgentList inset strong>
      <AgentListItem title="Foo Bar">
        <template #media>
          <img class="badge-demo__list-icon" :src="demoIcon" alt="" />
        </template>
        <template #after>
          <AgentBadge class="badge-demo__badge--gray">0</AgentBadge>
        </template>
      </AgentListItem>
      <AgentListItem title="Ivan Petrov">
        <template #media>
          <img class="badge-demo__list-icon" :src="demoIcon" alt="" />
        </template>
        <template #after><AgentBadge>CEO</AgentBadge></template>
      </AgentListItem>
      <AgentListItem title="John Doe">
        <template #media>
          <img class="badge-demo__list-icon" :src="demoIcon" alt="" />
        </template>
        <template #after>
          <AgentBadge class="badge-demo__badge--green">5</AgentBadge>
        </template>
      </AgentListItem>
      <AgentListItem title="Jane Doe">
        <template #media>
          <img class="badge-demo__list-icon" :src="demoIcon" alt="" />
        </template>
        <template #after>
          <AgentBadge class="badge-demo__badge--yellow">NEW</AgentBadge>
        </template>
      </AgentListItem>
    </AgentList>

    <template #fixed>
      <AgentTabBar label="Badge demo tabs">
        <AgentTabButton
          :active="activeTab === 'inbox'"
          label="Inbox"
          @click="activeTab = 'inbox'"
        >
          <template #icon>
            <AgentIcon badge="5" :badge-colors="{ bg: '#22c55e' }" :size="28">
              <BadgeIosIcon name="envelope-fill" />
            </AgentIcon>
          </template>
        </AgentTabButton>
        <AgentTabButton
          :active="activeTab === 'calendar'"
          label="Calendar"
          @click="activeTab = 'calendar'"
        >
          <template #icon>
            <AgentIcon badge="7" :badge-colors="{ bg: '#ef4444' }" :size="28">
              <BadgeIosIcon name="calendar" />
            </AgentIcon>
          </template>
        </AgentTabButton>
        <AgentTabButton
          :active="activeTab === 'upload'"
          label="Upload"
          @click="activeTab = 'upload'"
        >
          <template #icon>
            <AgentIcon badge="1" :badge-colors="{ bg: '#ef4444' }" :size="28">
              <BadgeIosIcon name="cloud-upload-fill" />
            </AgentIcon>
          </template>
        </AgentTabButton>
      </AgentTabBar>
    </template>
  </AgentUiDemoPage>
</template>

<style scoped>
.badge-demo__profile-action {
  box-sizing: border-box;
  width: var(--agent-touch-target, 44px);
  height: var(--agent-touch-target, 44px);
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  color: inherit;
}

.badge-demo__profile-action:focus-visible {
  outline: 2px solid var(--agent-app-accent, #007aff);
  outline-offset: 2px;
}

.badge-demo__badge--gray {
  background: #6b7280;
  color: #ffffff;
}

.badge-demo__badge--green {
  background: #22c55e;
}

.badge-demo__badge--yellow {
  background: #eab308;
}

.badge-demo__list-icon {
  width: 28px;
  height: 28px;
  display: block;
}
</style>
