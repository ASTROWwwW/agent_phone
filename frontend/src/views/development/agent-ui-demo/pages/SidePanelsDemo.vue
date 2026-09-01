<script setup lang="ts">
import Xmark from 'framework7-icons/vue/vue/Xmark.vue'
import { reactive } from 'vue'

import {
  AgentAppPage,
  AgentBlock,
  AgentBlockTitle,
  AgentButton,
  AgentIcon,
  AgentLink,
  AgentNavbar,
  AgentPanel,
  AgentScrollArea,
} from '@/ui'

import AgentUiDemoPage from '../AgentUiDemoPage.vue'
import { useAgentUiDemoContext } from '../context'

type PanelId = 'left' | 'leftFloating' | 'right' | 'rightFloating'

const panels = [
  { floating: false, id: 'left', side: 'left', title: 'Left Panel' },
  { floating: false, id: 'right', side: 'right', title: 'Right Panel' },
  { floating: true, id: 'leftFloating', side: 'left', title: 'Left Panel' },
  { floating: true, id: 'rightFloating', side: 'right', title: 'Right Panel' },
] as const
const opened = reactive<Record<PanelId, boolean>>({
  left: false,
  leftFloating: false,
  right: false,
  rightFloating: false,
})
const demo = useAgentUiDemoContext()

function openPanel(id: PanelId): void {
  opened[id] = true
}

function closePanel(id: PanelId): void {
  opened[id] = false
}
</script>

<template>
  <AgentUiDemoPage title="Panel / Side Panel">
    <AgentBlock class="agent-ui-demo-stack" inset strong>
      <p class="agent-ui-demo-copy">
        Konsta UI comes with 2 panels (on left and on right), both are optional.
        You can put absolutely anything inside: data lists, forms, custom
        content, etc.
      </p>
    </AgentBlock>

    <AgentBlock class="agent-ui-demo-panel-actions" inset strong>
      <AgentButton block rounded @click="openPanel('left')">Left Panel</AgentButton>
      <AgentButton block rounded @click="openPanel('right')"
        >Right Panel</AgentButton
      >
    </AgentBlock>

    <AgentBlockTitle>Floating Panels</AgentBlockTitle>
    <AgentBlock class="agent-ui-demo-panel-actions" inset strong>
      <AgentButton block rounded @click="openPanel('leftFloating')">
        Left Panel
      </AgentButton>
      <AgentButton block rounded @click="openPanel('rightFloating')">
        Right Panel
      </AgentButton>
    </AgentBlock>

    <template #fixed>
      <AgentPanel
        v-for="panel in panels"
        :key="panel.id"
        :aria-label="panel.title"
        class="agent-ui-demo-panel"
        :floating="panel.floating"
        :opened="opened[panel.id]"
        :side="panel.side"
        @backdropclick="closePanel(panel.id)"
        @escape="closePanel(panel.id)"
      >
        <AgentAppPage
          :accent="demo.accent.value"
          :accent-soft="demo.accentSoft.value"
          class="agent-ui-demo-panel-page"
          component="div"
          :class="{
            'agent-ui-demo-panel-page--floating': panel.floating,
          }"
          :dark="demo.dark.value"
          :label="panel.title"
        >
          <AgentNavbar :title="panel.title">
            <template #right>
              <AgentLink
                :aria-label="`Close ${panel.title.toLowerCase()}`"
                icon-only
                @click="closePanel(panel.id)"
              >
                <AgentIcon :size="20"><Xmark /></AgentIcon>
              </AgentLink>
            </template>
          </AgentNavbar>
          <AgentScrollArea>
            <AgentBlock class="agent-ui-demo-stack agent-ui-demo-panel-copy">
              <p class="agent-ui-demo-copy">Here comes {{ panel.side }} panel.</p>
              <p v-if="panel.side === 'left'" class="agent-ui-demo-copy">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Suspendisse faucibus mauris leo, eu bibendum neque congue non.
                Ut leo mauris, eleifend eu commodo a, egestas ac urna. Maecenas
                in lacus faucibus, viverra ipsum pulvinar, molestie arcu. Etiam
                lacinia venenatis dignissim. Suspendisse non nisl semper tellus
                malesuada suscipit eu et eros. Nulla eu enim quis quam elementum
                vulputate. Mauris ornare consequat nunc viverra pellentesque.
                Aenean semper eu massa sit amet aliquam. Integer et neque sed
                libero mollis elementum at vitae ligula. Vestibulum pharetra sed
                libero sed porttitor. Suspendisse a faucibus lectus.
              </p>
              <p v-else class="agent-ui-demo-copy">
                Duis ut mauris sollicitudin, venenatis nisi sed, luctus ligula.
                Phasellus blandit nisl ut lorem semper pharetra. Nullam tortor
                nibh, suscipit in consequat vel, feugiat sed quam. Nam risus
                libero, auctor vel tristique ac, malesuada ut ante. Sed
                molestie, est in eleifend sagittis, leo tortor ullamcorper erat,
                at vulputate eros sapien nec libero. Mauris dapibus laoreet nibh
                quis bibendum. Fusce dolor sem, suscipit in iaculis id, pharetra
                at urna. Pellentesque tempor congue massa quis faucibus.
                Vestibulum nunc eros, convallis blandit dui sit amet, gravida
                adipiscing libero.
              </p>
            </AgentBlock>
          </AgentScrollArea>
        </AgentAppPage>
      </AgentPanel>
    </template>
  </AgentUiDemoPage>
</template>

<style scoped>
.agent-ui-demo-panel-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--agent-space-4);
}

.agent-ui-demo-panel-page {
  min-height: 100%;
}

.agent-ui-demo-panel-page--floating {
  --agent-safe-area-top: 0px;
  --agent-safe-area-bottom: 0px;
  background: transparent;
}

.agent-ui-demo-panel-page--floating :deep(.agent-app-page__backdrop) {
  background: transparent;
}

.agent-ui-demo-panel-copy {
  gap: var(--agent-space-4);
}
</style>
