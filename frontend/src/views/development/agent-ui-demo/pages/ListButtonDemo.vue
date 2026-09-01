<script setup lang="ts">
import { AgentList, AgentListButton } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'
</script>

<template>
  <AgentUiDemoPage title="List Button">
    <AgentList dividers outline strong>
      <AgentListButton>Button 1</AgentListButton>
      <AgentListButton>Button 2</AgentListButton>
      <AgentListButton>Button 3</AgentListButton>
    </AgentList>
    <AgentList dividers inset strong>
      <AgentListButton>Button 1</AgentListButton>
      <AgentListButton>Button 2</AgentListButton>
      <AgentListButton>Button 3</AgentListButton>
    </AgentList>
    <AgentList inset strong>
      <AgentListButton variant="danger">Red Button</AgentListButton>
    </AgentList>
  </AgentUiDemoPage>
</template>
