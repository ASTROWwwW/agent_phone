<script setup lang="ts">
import { Gamepad2, LayoutGrid, PackageOpen, Search } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import {
  AgentApp,
  AgentButton,
  AgentCard,
  AgentEmptyState,
  AgentGlass,
  AgentInfiniteLoader,
  AgentListCard,
  AgentListItem,
  AgentNavbarBackLink,
  AgentPillNavigation,
  AgentProvider,
  AgentScrollRail,
  AgentSection,
  AgentSegmented,
  AgentSegmentedButton,
  AgentSettingsGroup,
  AgentSettingsIcon,
  AgentSettingsRangeRow,
  AgentSettingsRow,
  AgentStatusCard,
  AgentSurface,
  AgentWidgetFrame,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'
import { useAgentUiDemoContext } from '../context'

const range = ref(45)
const notifications = ref(true)
const selectedChoice = ref<'automatic' | 'manual'>('automatic')
const fullTab = ref(0)
const compactTab = ref(0)
const splitTab = ref(0)
const loaderState = ref<'error' | 'loading' | 'ready'>('loading')
const demo = useAgentUiDemoContext()
const fullNavigationItems = [
  { icon: LayoutGrid, label: 'Apps' },
  { icon: Gamepad2, label: 'Games' },
  { icon: Search, label: 'Search' },
] as const

const loaderError = computed(() =>
  loaderState.value === 'error' ? 'Could not load the next page.' : false,
)

function retryLoading(): void {
  loaderState.value = 'loading'
}

function requestLoading(): void {
  loaderState.value = 'loading'
}

function resetExamples(): void {
  range.value = 45
  notifications.value = true
  selectedChoice.value = 'automatic'
  fullTab.value = 0
  compactTab.value = 0
  splitTab.value = 0
  loaderState.value = 'loading'
}
</script>

<template>
  <AgentUiDemoPage padded title="Agent Extensions">
    <AgentSection title="Status and empty states">
      <div class="agent-ui-demo-stack">
        <AgentStatusCard
          class="agent-ui-demo-extension-status"
          indicator
          subtitle="Agent-only status primitive"
          title="Ready"
          tone="success"
        />
        <AgentEmptyState
          class="agent-ui-demo-extension-empty"
          body="No additional results are available."
          compact
          title="Nothing here"
        >
          <template #icon
            ><PackageOpen :size="32" aria-hidden="true"
          /></template>
          <template #actions><AgentButton rounded>Action</AgentButton></template>
        </AgentEmptyState>
        <AgentStatusCard
          v-if="loaderState === 'error'"
          aria-live="polite"
          class="agent-ui-demo-extension-status"
          subtitle="Use Retry to return to the loading state."
          title="Additional results unavailable"
          tone="danger"
        />
        <AgentInfiniteLoader
          :error="loaderError"
          :has-more="loaderState !== 'ready'"
          :load-key="loaderState"
          :loading="loaderState === 'loading'"
          loading-label="Loading more results"
          retry-label="Retry loading results"
          @load="requestLoading"
          @retry="retryLoading"
        />
        <div
          class="agent-ui-demo-extension-state-actions"
          role="group"
          aria-label="Infinite loader state"
        >
          <AgentButton
            :aria-pressed="loaderState === 'loading'"
            inline
            rounded
            small
            :variant="loaderState === 'loading' ? 'primary' : 'secondary'"
            @click="loaderState = 'loading'"
          >
            Loading
          </AgentButton>
          <AgentButton
            :aria-pressed="loaderState === 'error'"
            inline
            rounded
            small
            :variant="loaderState === 'error' ? 'danger' : 'secondary'"
            @click="loaderState = 'error'"
          >
            Error
          </AgentButton>
          <AgentButton
            :aria-pressed="loaderState === 'ready'"
            inline
            rounded
            small
            :variant="loaderState === 'ready' ? 'primary' : 'secondary'"
            @click="loaderState = 'ready'"
          >
            Ready
          </AgentButton>
        </div>
      </div>
    </AgentSection>

    <AgentSection title="Cards and horizontal rail">
      <div class="agent-ui-demo-stack">
        <AgentListCard inset strong>
          <AgentListItem
            title="AgentListCard"
            subtitle="A list surface extension"
          />
        </AgentListCard>
        <AgentScrollRail label="Card examples">
          <AgentCard
            v-for="index in 4"
            :key="index"
            class="agent-ui-demo-extension-card"
          >
            Card {{ index }}
          </AgentCard>
        </AgentScrollRail>
      </div>
    </AgentSection>

    <AgentSection title="Surface and nested theme provider">
      <div class="agent-ui-demo-stack">
        <AgentSurface class="agent-ui-demo-extension-surface" highlight>
          <span class="agent-ui-demo-extension-preview-copy">
            <strong>AgentSurface</strong>
            <small>Accent-aware content surface</small>
          </span>
        </AgentSurface>
        <AgentProvider
          :accent="demo.accent.value"
          :accent-soft="demo.accentSoft.value"
          :dark="demo.dark.value"
          :safe-areas="false"
        >
          <AgentApp
            class="agent-ui-demo-extension-app"
            :accent="demo.accent.value"
            :accent-soft="demo.accentSoft.value"
            :dark="demo.dark.value"
            :safe-areas="false"
          >
            <span class="agent-ui-demo-extension-preview-copy">
              <strong>Nested AgentApp</strong>
              <small>Follows the current demo theme</small>
            </span>
          </AgentApp>
        </AgentProvider>
      </div>
    </AgentSection>

    <AgentSection title="Widget sizes">
      <div class="agent-ui-demo-extension-widgets">
        <AgentWidgetFrame
          v-for="size in ['small', 'medium', 'large'] as const"
          :key="size"
          :label="`${size} widget`"
          :size="size"
        >
          <AgentSurface class="agent-ui-demo-extension-widget">
            {{ size }}
          </AgentSurface>
        </AgentWidgetFrame>
      </div>
    </AgentSection>

    <AgentSection title="Glass and standalone back link">
      <div class="agent-ui-demo-extension-controls">
        <AgentGlass class="agent-ui-demo-extension-glass" component="button">
          Interactive AgentGlass
        </AgentGlass>
        <AgentNavbarBackLink
          ariaLabel="Standalone back link example"
          show-text
          text="Back"
          @click="demo.returnToCatalog"
        />
      </div>
    </AgentSection>

    <AgentSettingsGroup
      class="agent-ui-demo-extension-settings"
      title="Settings extensions"
    >
      <AgentSettingsRow kind="navigation" title="Navigation row">
        <template #leading><AgentSettingsIcon>S</AgentSettingsIcon></template>
      </AgentSettingsRow>
      <AgentSettingsRow
        v-model="notifications"
        description="Uses the toggle row variant"
        kind="toggle"
        title="Notifications"
      />
      <AgentSettingsRow
        kind="choice"
        :selected="selectedChoice === 'automatic'"
        title="Automatic"
        @activate="selectedChoice = 'automatic'"
      />
      <AgentSettingsRow
        kind="choice"
        :selected="selectedChoice === 'manual'"
        title="Manual"
        @activate="selectedChoice = 'manual'"
      />
      <AgentSettingsRow kind="value" title="Current mode" value="High" />
      <AgentSettingsRow
        kind="custom"
        title="Custom row"
        value="Slot-compatible"
      />
      <AgentSettingsRow
        kind="action"
        title="Reset examples"
        tone="danger"
        @activate="resetExamples"
      />
      <AgentSettingsRangeRow v-model="range" title="Range row" />
    </AgentSettingsGroup>

    <AgentSection title="Full pill navigation">
      <div class="agent-ui-demo-extension-navigation-stage">
        <AgentPillNavigation label="Full pill navigation" layout="full">
          <AgentSegmented
            :active-index="fullTab"
            :item-count="3"
            aria-label="Full navigation tabs"
            navigation
            rounded
            strong
          >
            <AgentSegmentedButton
              v-for="(item, index) in fullNavigationItems"
              :key="item.label"
              :active="fullTab === index"
              :aria-label="item.label"
              @click="fullTab = index"
            >
              <span class="agent-ui-demo-extension-navigation-item">
                <component :is="item.icon" :size="20" aria-hidden="true" />
                <span>{{ item.label }}</span>
              </span>
            </AgentSegmentedButton>
          </AgentSegmented>
        </AgentPillNavigation>
      </div>
    </AgentSection>

    <AgentSection title="Compact pill navigation">
      <div class="agent-ui-demo-extension-navigation-stage">
        <AgentPillNavigation
          align="start"
          label="Compact pill navigation"
          layout="compact"
        >
          <AgentSegmented
            :active-index="compactTab"
            :item-count="2"
            aria-label="Compact navigation tabs"
            compact
            navigation
            rounded
            strong
          >
            <AgentSegmentedButton
              v-for="(label, index) in ['Apps', 'Games']"
              :key="label"
              :active="compactTab === index"
              @click="compactTab = index"
            >
              {{ label }}
            </AgentSegmentedButton>
          </AgentSegmented>
        </AgentPillNavigation>
      </div>
    </AgentSection>

    <AgentSection title="Split pill navigation">
      <div class="agent-ui-demo-extension-navigation-stage">
        <AgentPillNavigation label="Split pill navigation" layout="split">
          <AgentSegmented
            :active-index="Math.min(splitTab, 1)"
            :item-count="2"
            aria-label="Primary split navigation tabs"
            compact
            navigation
            rounded
            :strong="splitTab < 2"
          >
            <AgentSegmentedButton
              v-for="(label, index) in ['Apps', 'Games']"
              :key="label"
              :active="splitTab === index"
              @click="splitTab = index"
            >
              {{ label }}
            </AgentSegmentedButton>
          </AgentSegmented>
          <template #end>
            <AgentSegmented
              :active-index="0"
              :item-count="1"
              aria-label="Secondary split navigation tabs"
              compact
              navigation
              rounded
              :strong="splitTab === 2"
            >
              <AgentSegmentedButton
                :active="splitTab === 2"
                @click="splitTab = 2"
              >
                Search
              </AgentSegmentedButton>
            </AgentSegmented>
          </template>
        </AgentPillNavigation>
      </div>
    </AgentSection>
  </AgentUiDemoPage>
</template>

<style scoped>
.agent-ui-demo-extension-status,
.agent-ui-demo-extension-card,
.agent-ui-demo-extension-empty {
  margin: 0;
}

.agent-ui-demo-extension-card {
  flex: 0 0 140px;
}

.agent-ui-demo-extension-state-actions {
  min-height: var(--agent-touch-target);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--agent-space-2);
}

.agent-ui-demo-extension-surface,
.agent-ui-demo-extension-app {
  box-sizing: border-box;
  min-height: 92px;
  display: grid;
  place-items: center;
  padding: var(--agent-space-3);
}

.agent-ui-demo-extension-surface {
  border: 1px solid var(--agent-app-accent);
}

.agent-ui-demo-extension-app {
  overflow: hidden;
  border: 1px solid var(--agent-hairline);
  border-radius: var(--agent-radius-card);
  background: var(--agent-surface);
}

.agent-ui-demo-extension-preview-copy {
  min-width: 0;
  display: grid;
  gap: var(--agent-space-1);
  text-align: center;
}

.agent-ui-demo-extension-preview-copy small {
  color: var(--agent-muted);
  font-size: 12px;
  line-height: 16px;
}

.agent-ui-demo-extension-widgets {
  --agent-widget-label-color: var(--agent-text);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: end;
  gap: var(--agent-space-3);
}

.agent-ui-demo-extension-widgets > :nth-child(1) {
  height: 112px;
}

.agent-ui-demo-extension-widgets > :nth-child(2) {
  height: 136px;
}

.agent-ui-demo-extension-widgets > :nth-child(3) {
  height: 160px;
  grid-column: 1 / -1;
}

.agent-ui-demo-extension-widget {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: var(--agent-space-3);
}

.agent-ui-demo-extension-widgets > :nth-child(1) .agent-ui-demo-extension-widget {
  border-radius: var(--agent-widget-radius-small);
}

.agent-ui-demo-extension-widgets > :nth-child(2) .agent-ui-demo-extension-widget {
  border-radius: var(--agent-widget-radius-medium);
}

.agent-ui-demo-extension-widgets > :nth-child(3) .agent-ui-demo-extension-widget {
  border-radius: var(--agent-widget-radius-large);
}

.agent-ui-demo-extension-widgets :deep(.agent-widget-frame__label) {
  text-shadow: none;
}

.agent-ui-demo-extension-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--agent-space-3);
}

.agent-ui-demo-extension-glass {
  box-sizing: border-box;
  width: 100%;
  min-height: 52px;
  padding: 0 var(--agent-space-4);
  border-radius: var(--agent-radius-pill);
  font: inherit;
  font-weight: 600;
}

.agent-ui-demo-extension-glass:focus-visible {
  outline: 2px solid var(--agent-app-accent);
  outline-offset: 2px;
}

.agent-ui-demo-extension-settings :deep(.agent-settings-group__title) {
  margin-right: 0;
  margin-left: 0;
}

.agent-ui-demo-extension-navigation-stage {
  min-height: 76px;
  position: relative;
  display: flex;
  align-items: center;
}

.agent-ui-demo-extension-navigation-stage :deep(.agent-pill-navigation) {
  position: relative;
  right: auto;
  bottom: auto;
  left: auto;
  width: 100%;
}

.agent-ui-demo-extension-navigation-item {
  min-width: 0;
  max-width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 2px;
  line-height: 1;
}

.agent-ui-demo-extension-navigation-item > span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
