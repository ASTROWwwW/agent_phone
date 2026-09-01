<script setup lang="ts">
import { AgentBlock, AgentBlockFooter, AgentBlockHeader, AgentBlockTitle } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'
</script>

<template>
  <AgentUiDemoPage title="Content Block">
    <AgentBlockTitle>Block Title</AgentBlockTitle>
    <AgentBlock>
      <p class="content-copy">
        Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.
        Suspendisse molestie velit vitae mattis tincidunt. Ut sit amet quam
        mollis, vulputate turpis vel, sagittis felis.
      </p>
    </AgentBlock>

    <AgentBlockTitle>Strong Block</AgentBlockTitle>
    <AgentBlock strong>
      <p class="content-copy">
        Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.
        Suspendisse molestie velit vitae mattis tincidunt. Ut sit amet quam
        mollis, vulputate turpis vel, sagittis felis.
      </p>
    </AgentBlock>

    <AgentBlockTitle>Strong Outline Block</AgentBlockTitle>
    <AgentBlock outline strong>
      <p class="content-copy">
        Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.
        Suspendisse molestie velit vitae mattis tincidunt. Ut sit amet quam
        mollis, vulputate turpis vel, sagittis felis.
      </p>
    </AgentBlock>

    <AgentBlockTitle>Strong Inset Block</AgentBlockTitle>
    <AgentBlock inset strong>
      <p class="content-copy">
        Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.
        Suspendisse molestie velit vitae mattis tincidunt. Ut sit amet quam
        mollis, vulputate turpis vel, sagittis felis.
      </p>
    </AgentBlock>

    <AgentBlockTitle>Strong Inset Outline Block</AgentBlockTitle>
    <AgentBlock inset outline strong>
      <p class="content-copy">
        Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.
        Suspendisse molestie velit vitae mattis tincidunt. Ut sit amet quam
        mollis, vulputate turpis vel, sagittis felis.
      </p>
    </AgentBlock>

    <AgentBlockTitle>With Header &amp; Footer</AgentBlockTitle>
    <AgentBlockHeader>Header</AgentBlockHeader>
    <AgentBlock outline strong>
      <p class="content-copy">
        Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.
        Suspendisse molestie velit vitae mattis tincidunt. Ut sit amet quam
        mollis, vulputate turpis vel, sagittis felis.
      </p>
    </AgentBlock>
    <AgentBlockFooter>Footer</AgentBlockFooter>

    <AgentBlockTitle medium>Medium Title</AgentBlockTitle>
    <AgentBlock outline strong>
      <p class="content-copy">
        Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.
        Suspendisse molestie velit vitae mattis tincidunt. Ut sit amet quam
        mollis, vulputate turpis vel, sagittis felis.
      </p>
    </AgentBlock>

    <AgentBlockTitle large>Large Title</AgentBlockTitle>
    <AgentBlock outline strong>
      <p class="content-copy">
        Donec et nulla auctor massa pharetra adipiscing ut sit amet sem.
        Suspendisse molestie velit vitae mattis tincidunt. Ut sit amet quam
        mollis, vulputate turpis vel, sagittis felis.
      </p>
    </AgentBlock>
  </AgentUiDemoPage>
</template>

<style scoped>
.content-copy {
  margin: 0;
}
</style>
