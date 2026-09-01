import {
  computed,
  inject,
  provide,
  type ComputedRef,
  type InjectionKey,
} from 'vue'

export interface AgentThemeContext {
  accent: ComputedRef<string>
  accentSoft: ComputedRef<string>
  dark: ComputedRef<boolean>
  safeAreas: ComputedRef<boolean>
}

interface AgentThemeSource {
  accent: () => string
  accentSoft: () => string
  dark: () => boolean
  safeAreas: () => boolean
}

const agentThemeKey: InjectionKey<AgentThemeContext> = Symbol('agent-ui-theme')

export function provideAgentTheme(source: AgentThemeSource): AgentThemeContext {
  const context: AgentThemeContext = {
    accent: computed(source.accent),
    accentSoft: computed(source.accentSoft),
    dark: computed(source.dark),
    safeAreas: computed(source.safeAreas),
  }

  provide(agentThemeKey, context)
  return context
}

export function useAgentTheme(): AgentThemeContext | null {
  return inject(agentThemeKey, null)
}
