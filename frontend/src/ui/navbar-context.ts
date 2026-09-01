import { inject, provide, type InjectionKey } from 'vue'

const agentNavbarKey: InjectionKey<boolean> = Symbol('agent-ui-navbar')

export function provideAgentNavbar(): void {
  provide(agentNavbarKey, true)
}

export function useAgentNavbar(): boolean {
  return inject(agentNavbarKey, false)
}
