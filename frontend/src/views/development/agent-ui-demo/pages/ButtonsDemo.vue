<script setup lang="ts">
import { AgentBlock, AgentBlockTitle, AgentButton } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'
</script>

<template>
  <AgentUiDemoPage title="Buttons">
    <AgentBlockTitle>Default Buttons</AgentBlockTitle>
    <AgentBlock class="button-examples" inset strong>
      <div class="button-row">
        <AgentButton>Button</AgentButton>
        <AgentButton class="agent-ui-demo-color-red">Button</AgentButton>
        <AgentButton>Button</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton outline>Outline</AgentButton>
        <AgentButton class="agent-ui-demo-color-red" outline>Outline</AgentButton>
        <AgentButton outline>Outline</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton clear>Clear</AgentButton>
        <AgentButton class="agent-ui-demo-color-red" clear>Clear</AgentButton>
        <AgentButton clear>Clear</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton tonal>Tonal</AgentButton>
        <AgentButton class="agent-ui-demo-color-red" tonal>Tonal</AgentButton>
        <AgentButton tonal>Tonal</AgentButton>
      </div>
    </AgentBlock>

    <AgentBlockTitle>Rounded Buttons</AgentBlockTitle>
    <AgentBlock class="button-examples" inset strong>
      <div class="button-row">
        <AgentButton rounded>Button</AgentButton>
        <AgentButton class="agent-ui-demo-color-green" rounded>Button</AgentButton>
        <AgentButton rounded>Button</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton outline rounded>Outline</AgentButton>
        <AgentButton class="agent-ui-demo-color-green" outline rounded>
          Outline
        </AgentButton>
        <AgentButton outline rounded>Outline</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton clear rounded>Clear</AgentButton>
        <AgentButton class="agent-ui-demo-color-green" clear rounded>
          Clear
        </AgentButton>
        <AgentButton clear rounded>Clear</AgentButton>
      </div>
    </AgentBlock>

    <AgentBlockTitle>Large Buttons</AgentBlockTitle>
    <AgentBlock class="button-examples" inset strong>
      <div class="button-row">
        <AgentButton large>Button</AgentButton>
        <AgentButton class="agent-ui-demo-color-yellow" large>Button</AgentButton>
        <AgentButton large rounded>Button</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton large outline>Outline</AgentButton>
        <AgentButton class="agent-ui-demo-color-yellow" large outline>
          Outline
        </AgentButton>
        <AgentButton large outline rounded>Outline</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton clear large>Clear</AgentButton>
        <AgentButton class="agent-ui-demo-color-yellow" clear large>
          Clear
        </AgentButton>
        <AgentButton clear large rounded>Clear</AgentButton>
      </div>
    </AgentBlock>

    <AgentBlockTitle>Small Buttons</AgentBlockTitle>
    <AgentBlock class="button-examples" inset strong>
      <div class="button-row">
        <AgentButton small>Button</AgentButton>
        <AgentButton small>Button</AgentButton>
        <AgentButton rounded small>Button</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton outline small>Outline</AgentButton>
        <AgentButton outline small>Outline</AgentButton>
        <AgentButton outline rounded small>Outline</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton clear small>Clear</AgentButton>
        <AgentButton clear small>Clear</AgentButton>
        <AgentButton clear rounded small>Clear</AgentButton>
      </div>
    </AgentBlock>

    <AgentBlockTitle>Raised Buttons</AgentBlockTitle>
    <AgentBlock class="button-examples" inset strong>
      <div class="button-row">
        <AgentButton raised>Button</AgentButton>
        <AgentButton raised>Button</AgentButton>
        <AgentButton raised rounded>Button</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton outline raised>Outline</AgentButton>
        <AgentButton outline raised>Outline</AgentButton>
        <AgentButton outline raised rounded>Outline</AgentButton>
      </div>
      <div class="button-row">
        <AgentButton clear raised>Clear</AgentButton>
        <AgentButton clear raised>Clear</AgentButton>
        <AgentButton clear raised rounded>Clear</AgentButton>
      </div>
    </AgentBlock>

    <AgentBlockTitle>Disabled Buttons</AgentBlockTitle>
    <AgentBlock inset strong>
      <div class="button-row">
        <AgentButton disabled>Button</AgentButton>
        <AgentButton disabled outline>Outline</AgentButton>
        <AgentButton clear disabled>Clear</AgentButton>
      </div>
    </AgentBlock>
  </AgentUiDemoPage>
</template>

<style scoped>
.button-examples {
  display: grid;
  gap: var(--agent-space-2, 8px);
}

.button-row {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: var(--agent-space-4, 16px);
}
</style>
