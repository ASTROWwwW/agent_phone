<script setup lang="ts">
import { Palette } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import {
  AgentAppPage,
  AgentBlockTitle,
  AgentList,
  AgentListItem,
  AgentNavbar,
  AgentPopover,
  AgentRadio,
  AgentScrollArea,
  AgentToggle,
} from '@/ui'

import demoIcon from './assets/demo-icon.png'
import { AGENT_UI_DEMO_CATALOG, AGENT_UI_EXTENSION_CATALOG } from './catalog'
import { useAgentUiDemoContext, type AgentUiDemoAccent } from './context'

const demo = useAgentUiDemoContext()
const colorPickerOpened = ref(false)
const colorPickerTarget = ref<HTMLElement | null>(null)

const accents: AgentUiDemoAccent[] = [
  { color: '#007aff', name: 'Blue', soft: 'rgba(0, 122, 255, 0.16)' },
  { color: '#ff3b30', name: 'Red', soft: 'rgba(255, 59, 48, 0.16)' },
  { color: '#4cd964', name: 'Green', soft: 'rgba(76, 217, 100, 0.16)' },
  { color: '#ffcc00', name: 'Yellow', soft: 'rgba(255, 204, 0, 0.18)' },
  { color: '#9c27b0', name: 'Purple', soft: 'rgba(156, 39, 176, 0.16)' },
]

function chooseAccent(accent: AgentUiDemoAccent): void {
  demo.accentChoice.value = accent
  colorPickerOpened.value = false
}

function syncColorPickerTarget(): void {
  colorPickerTarget.value = document.querySelector<HTMLElement>(
    '#agent-ui-demo-color-anchor',
  )
}

function handleDarkModeRowClick(event: MouseEvent): void {
  const target = event.target
  if (target instanceof Element && target.closest('.agent-toggle')) return
  demo.dark.value = !demo.dark.value
}

onMounted(() => {
  syncColorPickerTarget()
})

onBeforeUnmount(() => {
  colorPickerTarget.value = null
})
</script>

<template>
  <AgentAppPage
    class="agent-ui-demo-home"
    :accent="demo.accent.value"
    :accent-soft="demo.accentSoft.value"
    :dark="demo.dark.value"
    label="Agent UI Kitchen Sink"
  >
    <AgentNavbar
      back-label="Back to Settings"
      show-back
      title="Agent UI"
      transparent
      variant="large"
      @back="demo.exit"
    />

    <AgentScrollArea class="agent-ui-demo-home__scroll">
      <AgentBlockTitle>Theme</AgentBlockTitle>
      <AgentList inset strong>
        <AgentListItem label title="iOS Theme">
          <template #media>
            <AgentRadio aria-label="iOS Theme" checked value="ios" />
          </template>
        </AgentListItem>
        <AgentListItem
          disabled
          label
          subtitle="Agent UI currently follows the Konsta iOS reference."
          title="Material Theme"
        >
          <template #media>
            <AgentRadio
              aria-label="Material Theme (not available)"
              disabled
              value="material"
            />
          </template>
        </AgentListItem>
      </AgentList>

      <AgentList inset strong>
        <AgentListItem
          class="agent-ui-demo-home__control-row"
          title="Dark Mode"
          @click="handleDarkModeRowClick"
        >
          <template #after>
            <AgentToggle
              v-model="demo.dark.value"
              aria-label="Dark Mode"
              component="div"
            />
          </template>
        </AgentListItem>
        <AgentListItem
          id="agent-ui-demo-color-anchor"
          link
          title="Color Theme"
          @click="colorPickerOpened = true"
        >
          <template #after>
            <span
              class="agent-ui-demo-home__current-color"
              :style="{ backgroundColor: demo.accent.value }"
              :title="demo.accentChoice.value.name"
            />
          </template>
        </AgentListItem>
      </AgentList>

      <AgentBlockTitle>Components</AgentBlockTitle>
      <AgentList inset strong>
        <AgentListItem
          v-for="entry in AGENT_UI_DEMO_CATALOG"
          :key="entry.id"
          link
          :title="entry.title"
          @click="demo.navigate(entry.id)"
        >
          <template #media>
            <img
              class="agent-ui-demo-home__component-icon"
              :src="demoIcon"
              alt=""
            />
          </template>
        </AgentListItem>
      </AgentList>

      <AgentBlockTitle>Agent Extensions</AgentBlockTitle>
      <AgentList inset strong>
        <AgentListItem
          v-for="entry in AGENT_UI_EXTENSION_CATALOG"
          :key="entry.id"
          link
          :title="entry.title"
          @click="demo.navigate(entry.id)"
        >
          <template #media>
            <Palette :size="28" :stroke-width="1.8" aria-hidden="true" />
          </template>
        </AgentListItem>
      </AgentList>
    </AgentScrollArea>

    <AgentPopover
      aria-label="Choose color theme"
      :opened="colorPickerOpened"
      :target="colorPickerTarget"
      @backdropclick="colorPickerOpened = false"
      @escape="colorPickerOpened = false"
    >
      <div class="agent-ui-demo-home__palette">
        <button
          v-for="accent in accents"
          :key="accent.name"
          class="agent-ui-demo-home__color-button"
          type="button"
          :aria-label="`${accent.name} color theme`"
          :aria-pressed="accent.color === demo.accent.value"
          @click="chooseAccent(accent)"
        >
          <span
            class="agent-ui-demo-home__color-swatch"
            :style="{ backgroundColor: accent.color }"
            aria-hidden="true"
          />
        </button>
      </div>
    </AgentPopover>
  </AgentAppPage>
</template>

<style scoped>
.agent-ui-demo-home__scroll {
  padding-top: 0;
}

.agent-ui-demo-home__current-color {
  width: 24px;
  height: 24px;
  display: block;
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 50%;
}

.agent-ui-demo-home__component-icon {
  width: 28px;
  height: 28px;
  display: block;
}

.agent-ui-demo-home__control-row :deep(.agent-list-item__row) {
  cursor: pointer;
}

.agent-ui-demo-home__palette {
  display: grid;
  grid-template-columns: repeat(3, 48px);
  padding: 8px;
}

.agent-ui-demo-home__color-button {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 12px;
  background: transparent;
}

.agent-ui-demo-home__color-button:focus-visible {
  outline: 2px solid var(--agent-app-accent);
  outline-offset: -2px;
}

.agent-ui-demo-home__color-swatch {
  width: 24px;
  height: 24px;
  display: block;
  border-radius: 50%;
}

.agent-ui-demo-home__color-button[aria-pressed='true'] {
  background: var(--agent-pressed);
}
</style>
