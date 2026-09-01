import {
  computed,
  inject,
  provide,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from 'vue'

import type { AgentUiDemoId } from './catalog'

export interface AgentUiDemoAccent {
  color: string
  name: string
  soft: string
}

export interface AgentUiDemoContext {
  accent: ComputedRef<string>
  accentChoice: Ref<AgentUiDemoAccent>
  accentSoft: ComputedRef<string>
  dark: Ref<boolean>
  exit: () => void
  navigate: (id: AgentUiDemoId) => void
  returnToCatalog: () => void
}

const agentUiDemoContextKey: InjectionKey<AgentUiDemoContext> = Symbol(
  'agent-ui-demo-context',
)

export function provideAgentUiDemoContext(context: AgentUiDemoContext): void {
  provide(agentUiDemoContextKey, context)
}

export function createAgentUiDemoTheme(
  dark: Ref<boolean>,
  accentChoice: Ref<AgentUiDemoAccent>,
): Pick<AgentUiDemoContext, 'accent' | 'accentChoice' | 'accentSoft' | 'dark'> {
  return {
    accent: computed(() => accentChoice.value.color),
    accentChoice,
    accentSoft: computed(() => accentChoice.value.soft),
    dark,
  }
}

export function useAgentUiDemoContext(): AgentUiDemoContext {
  const context = inject(agentUiDemoContextKey)
  if (!context) throw new Error('Agent UI demo context is unavailable.')
  return context
}
