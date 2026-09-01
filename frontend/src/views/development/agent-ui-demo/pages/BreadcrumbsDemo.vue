<script setup lang="ts">
import { ref } from 'vue'

import {
  AgentBlock,
  AgentBlockHeader,
  AgentBlockTitle,
  AgentBreadcrumbs,
  AgentBreadcrumbsCollapsed,
  AgentBreadcrumbsItem,
  AgentBreadcrumbsSeparator,
  AgentList,
  AgentListItem,
  AgentPopover,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const popoverOpened = ref(false)
const popoverTarget = ref<HTMLElement | null>(null)
</script>

<template>
  <AgentUiDemoPage title="Breadcrumbs">
    <AgentBlock inset strong>
      Breadcrumbs allow users to keep track and maintain awareness of their
      locations within the app or website. They should be used for large sites
      and apps with hierarchically arranged pages.
    </AgentBlock>

    <AgentBlockTitle>Basic</AgentBlockTitle>
    <AgentBlock outline strong>
      <AgentBreadcrumbs aria-label="Basic breadcrumb">
        <AgentBreadcrumbsItem component="button">Home</AgentBreadcrumbsItem>
        <AgentBreadcrumbsSeparator />
        <AgentBreadcrumbsItem component="button">Catalog</AgentBreadcrumbsItem>
        <AgentBreadcrumbsSeparator />
        <AgentBreadcrumbsItem active>Phones</AgentBreadcrumbsItem>
      </AgentBreadcrumbs>
    </AgentBlock>

    <AgentBlockTitle>Scrollable</AgentBlockTitle>
    <AgentBlockHeader>
      Breadcrumbs will be scrollable if they don't fit the screen
    </AgentBlockHeader>
    <AgentBlock outline strong>
      <AgentBreadcrumbs aria-label="Scrollable breadcrumb">
        <AgentBreadcrumbsItem component="button">Home</AgentBreadcrumbsItem>
        <AgentBreadcrumbsSeparator />
        <AgentBreadcrumbsItem component="button">Catalog</AgentBreadcrumbsItem>
        <AgentBreadcrumbsSeparator />
        <AgentBreadcrumbsItem component="button">Phones</AgentBreadcrumbsItem>
        <AgentBreadcrumbsSeparator />
        <AgentBreadcrumbsItem component="button">Apple</AgentBreadcrumbsItem>
        <AgentBreadcrumbsSeparator />
        <AgentBreadcrumbsItem active>iPhone 12</AgentBreadcrumbsItem>
      </AgentBreadcrumbs>
    </AgentBlock>

    <AgentBlockTitle>Collapsed</AgentBlockTitle>
    <AgentBlock outline strong>
      <AgentBreadcrumbs aria-label="Collapsed breadcrumb">
        <AgentBreadcrumbsItem component="button">Home</AgentBreadcrumbsItem>
        <AgentBreadcrumbsSeparator />
        <span ref="popoverTarget" class="breadcrumbs-demo__target">
          <AgentBreadcrumbsCollapsed
            ariaControls="breadcrumbs-menu"
            ariaLabel="Show hidden breadcrumbs"
            :expanded="popoverOpened"
            @click="popoverOpened = true"
          />
        </span>
        <AgentBreadcrumbsSeparator />
        <AgentBreadcrumbsItem active>iPhone 12</AgentBreadcrumbsItem>
      </AgentBreadcrumbs>
    </AgentBlock>

    <template #fixed>
      <AgentPopover
        id="breadcrumbs-menu"
        aria-label="Hidden breadcrumbs"
        class="breadcrumbs-demo__popover"
        :opened="popoverOpened"
        :offset="0"
        role="region"
        :target="popoverTarget"
        @backdropclick="popoverOpened = false"
        @escape="popoverOpened = false"
      >
        <AgentList class="breadcrumbs-demo__menu" nested>
          <AgentListItem link title="Catalog" @click="popoverOpened = false" />
          <AgentListItem link title="Phones" @click="popoverOpened = false" />
          <AgentListItem link title="Apple" @click="popoverOpened = false" />
        </AgentList>
      </AgentPopover>
    </template>
  </AgentUiDemoPage>
</template>

<style scoped>
.breadcrumbs-demo__menu {
  width: 100%;
}

.breadcrumbs-demo__popover :deep(.agent-popover__panel) {
  width: 120px;
}

.breadcrumbs-demo__target {
  display: inline-flex;
  flex: none;
}
</style>
