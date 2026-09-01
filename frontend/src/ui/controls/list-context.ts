import type { ComputedRef, InjectionKey } from 'vue'

export interface AgentListContext {
  dividers: boolean
  nested: boolean
}

export const agentListContextKey: InjectionKey<ComputedRef<AgentListContext>> =
  Symbol('agent-list-context')
