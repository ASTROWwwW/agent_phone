<script setup lang="ts">
import { ref } from 'vue'

import { AgentBlock, AgentBlockTitle, AgentList, AgentListItem, AgentStepper } from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'

const value = ref(1)
const inputValue = ref(1)
interface StepperExample {
  label: string
  large: boolean
  outline: boolean
  rounded: boolean
  small: boolean
}

interface StepperColorExample {
  className: string
  label: string
  rounded: boolean
}

const shapeExamples: readonly StepperExample[] = [
  {
    label: 'Default',
    large: false,
    outline: false,
    rounded: false,
    small: false,
  },
  { label: 'Round', large: false, outline: false, rounded: true, small: false },
  {
    label: 'Outline',
    large: false,
    outline: true,
    rounded: false,
    small: false,
  },
  {
    label: 'Rounded Outline',
    large: false,
    outline: true,
    rounded: true,
    small: false,
  },
  { label: 'Small', large: false, outline: false, rounded: false, small: true },
  {
    label: 'Small Round',
    large: false,
    outline: false,
    rounded: true,
    small: true,
  },
  {
    label: 'Small Outline',
    large: false,
    outline: true,
    rounded: false,
    small: true,
  },
  {
    label: 'Small Rounded Outline',
    large: false,
    outline: true,
    rounded: true,
    small: true,
  },
  { label: 'Large', large: true, outline: false, rounded: false, small: false },
  {
    label: 'Large Round',
    large: true,
    outline: false,
    rounded: true,
    small: false,
  },
  {
    label: 'Large Outline',
    large: true,
    outline: true,
    rounded: false,
    small: false,
  },
  {
    label: 'Large Rounded Outline',
    large: true,
    outline: true,
    rounded: true,
    small: false,
  },
]

const raisedExamples: readonly StepperExample[] = shapeExamples.map(
  (example) => ({
    ...example,
    label:
      example.label === 'Rounded Outline' ? 'Round Outline' : example.label,
  }),
)

const colorExamples: readonly StepperColorExample[] = [
  { className: 'agent-ui-demo-color-red', label: 'Red', rounded: false },
  { className: 'agent-ui-demo-color-green', label: 'Green', rounded: true },
  { className: 'agent-ui-demo-color-yellow', label: 'Yellow', rounded: false },
  { className: 'agent-ui-demo-color-purple', label: 'Purple', rounded: true },
]
</script>

<template>
  <AgentUiDemoPage title="Stepper">
    <AgentBlockTitle>Shape and size</AgentBlockTitle>
    <AgentBlock class="agent-ui-demo-stepper-grid" inset strong>
      <div v-for="example in shapeExamples" :key="example.label">
        <small>{{ example.label }}</small>
        <AgentStepper
          v-model="value"
          decrement-label="Decrease value"
          increment-label="Increase value"
          :large="example.large"
          :outline="example.outline"
          :rounded="example.rounded"
          :small="example.small"
          :min="0"
        />
      </div>
    </AgentBlock>

    <AgentBlockTitle>Raised</AgentBlockTitle>
    <AgentBlock class="agent-ui-demo-stepper-grid" inset strong>
      <div v-for="example in raisedExamples" :key="example.label">
        <small>{{ example.label }}</small>
        <AgentStepper
          v-model="value"
          decrement-label="Decrease value"
          increment-label="Increase value"
          :large="example.large"
          :outline="example.outline"
          raised
          :rounded="example.rounded"
          :small="example.small"
          :min="0"
        />
      </div>
    </AgentBlock>

    <AgentBlockTitle>With Text Input</AgentBlockTitle>
    <AgentBlock class="agent-ui-demo-stack agent-ui-demo-stepper-inputs" inset strong>
      <AgentStepper
        v-model="inputValue"
        decrement-label="Decrease input value"
        increment-label="Increase input value"
        input
        input-label="Stepper value"
        :min="0"
      />
      <AgentStepper
        v-model="inputValue"
        decrement-label="Decrease outlined input value"
        increment-label="Increase outlined input value"
        input
        input-label="Outlined stepper value"
        :min="0"
        outline
      />
    </AgentBlock>

    <AgentBlockTitle>Only Buttons</AgentBlockTitle>
    <AgentList inset strong>
      <AgentListItem
        v-for="example in [
          { label: 'Default' },
          { label: 'Outline', outline: true },
          { label: 'Raised Outline', outline: true, raised: true },
        ]"
        :key="example.label"
        :title="`Value is ${value}`"
      >
        <template #after>
          <AgentStepper
            v-model="value"
            buttons-only
            :decrement-label="`Decrease ${example.label} value`"
            :increment-label="`Increase ${example.label} value`"
            :min="0"
            :outline="example.outline"
            :raised="example.raised"
          />
        </template>
      </AgentListItem>
    </AgentList>

    <AgentBlockTitle>Colors</AgentBlockTitle>
    <AgentBlock class="agent-ui-demo-stepper-grid" inset strong>
      <AgentStepper
        v-for="example in colorExamples"
        :key="example.label"
        v-model="value"
        :class="example.className"
        :decrement-label="`Decrease ${example.label.toLowerCase()} value`"
        :increment-label="`Increase ${example.label.toLowerCase()} value`"
        :min="0"
        :rounded="example.rounded"
      />
    </AgentBlock>
  </AgentUiDemoPage>
</template>

<style scoped>
.agent-ui-demo-stepper-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--agent-space-4);
  text-align: center;
}

.agent-ui-demo-stepper-grid > div {
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: var(--agent-space-1);
}

.agent-ui-demo-stepper-inputs {
  justify-items: center;
}
</style>
