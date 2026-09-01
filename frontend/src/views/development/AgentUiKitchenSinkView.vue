<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { usePhoneStore } from '@/stores/phone'
import { isAgentUiDemoId, type AgentUiDemoId } from './agent-ui-demo/catalog'
import {
  createAgentUiDemoTheme,
  provideAgentUiDemoContext,
  type AgentUiDemoAccent,
} from './agent-ui-demo/context'
import AgentUiDemoHome from './agent-ui-demo/AgentUiDemoHome.vue'
import './agent-ui-demo/demo.css'

const phone = usePhoneStore()
const route = useRoute()
const router = useRouter()

const initialAccent: AgentUiDemoAccent = {
  color: '#007aff',
  name: 'Blue',
  soft: 'rgba(0, 122, 255, 0.16)',
}
const dark = computed({
  get: () => phone.isDarkMode,
  set: (value: boolean) =>
    phone.setPreference('appearanceMode', value ? 'dark' : 'light'),
})
const accentChoice = ref(initialAccent)

const demoPages: Record<AgentUiDemoId, Component> = {
  'action-sheet': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/ActionSheetDemo.vue'),
  ),
  badge: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/BadgeDemo.vue'),
  ),
  breadcrumbs: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/BreadcrumbsDemo.vue'),
  ),
  buttons: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/ButtonsDemo.vue'),
  ),
  cards: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/CardsDemo.vue'),
  ),
  checkbox: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/CheckboxDemo.vue'),
  ),
  chips: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/ChipsDemo.vue'),
  ),
  'contacts-list': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/ContactsListDemo.vue'),
  ),
  'content-block': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/ContentBlockDemo.vue'),
  ),
  'data-table': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/DataTableDemo.vue'),
  ),
  dialog: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/DialogDemo.vue'),
  ),
  fab: defineAsyncComponent(() => import('./agent-ui-demo/pages/FabDemo.vue')),
  'form-inputs': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/FormInputsDemo.vue'),
  ),
  list: defineAsyncComponent(() => import('./agent-ui-demo/pages/ListDemo.vue')),
  'list-button': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/ListButtonDemo.vue'),
  ),
  'menu-list': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/MenuListDemo.vue'),
  ),
  messages: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/MessagesDemo.vue'),
  ),
  navbar: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/NavbarDemo.vue'),
  ),
  notification: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/NotificationDemo.vue'),
  ),
  'side-panels': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/SidePanelsDemo.vue'),
  ),
  popover: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/PopoverDemo.vue'),
  ),
  popup: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/PopupDemo.vue'),
  ),
  preloader: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/PreloaderDemo.vue'),
  ),
  progressbar: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/ProgressbarDemo.vue'),
  ),
  radio: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/RadioDemo.vue'),
  ),
  'range-slider': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/RangeSliderDemo.vue'),
  ),
  searchbar: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/SearchbarDemo.vue'),
  ),
  'segmented-control': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/SegmentedControlDemo.vue'),
  ),
  'sheet-modal': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/SheetModalDemo.vue'),
  ),
  stepper: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/StepperDemo.vue'),
  ),
  subnavbar: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/SubnavbarDemo.vue'),
  ),
  tabbar: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/TabbarDemo.vue'),
  ),
  toast: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/ToastDemo.vue'),
  ),
  toggle: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/ToggleDemo.vue'),
  ),
  toolbar: defineAsyncComponent(
    () => import('./agent-ui-demo/pages/ToolbarDemo.vue'),
  ),
  'agent-extensions': defineAsyncComponent(
    () => import('./agent-ui-demo/pages/AgentExtensionsDemo.vue'),
  ),
}

const requestedDemo = computed(() => route.params.demo)
const activeDemo = computed<AgentUiDemoId | null>(() =>
  isAgentUiDemoId(requestedDemo.value) ? requestedDemo.value : null,
)
const activePage = computed(() =>
  activeDemo.value ? demoPages[activeDemo.value] : AgentUiDemoHome,
)
const theme = createAgentUiDemoTheme(dark, accentChoice)

function navigate(id: AgentUiDemoId): void {
  void router.push({ name: 'development-agent-ui', params: { demo: id } })
}

function returnToCatalog(): void {
  const previousPath = window.history.state?.back
  const catalogPath = router.resolve({ name: 'development-agent-ui' }).fullPath

  if (previousPath === catalogPath) {
    router.back()
    return
  }

  void router.replace({ name: 'development-agent-ui' })
}

function exit(): void {
  router.back()
}

provideAgentUiDemoContext({
  ...theme,
  exit,
  navigate,
  returnToCatalog,
})

watch(
  requestedDemo,
  (value) => {
    if (value === undefined || isAgentUiDemoId(value)) return
    void router.replace({ name: 'development-agent-ui' })
  },
  { immediate: true },
)
</script>

<template>
  <div class="agent-ui-kitchen-sink">
    <Transition name="agent-ui-demo-page" mode="out-in">
      <component :is="activePage" :key="activeDemo ?? 'catalog'" />
    </Transition>
  </div>
</template>

<style scoped>
.agent-ui-kitchen-sink {
  width: 100%;
  height: 100%;
}

.agent-ui-demo-page-enter-active,
.agent-ui-demo-page-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.agent-ui-demo-page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.agent-ui-demo-page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@media (prefers-reduced-motion: reduce) {
  .agent-ui-demo-page-enter-active,
  .agent-ui-demo-page-leave-active {
    transition-duration: 0.01ms;
  }

  .agent-ui-demo-page-enter-from,
  .agent-ui-demo-page-leave-to {
    transform: none;
  }
}
</style>
