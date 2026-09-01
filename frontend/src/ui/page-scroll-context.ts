import {
  inject,
  provide,
  shallowRef,
  type InjectionKey,
  type ShallowRef,
} from 'vue'

interface AgentPageScrollContext {
  collapseOffset: ShallowRef<number>
  element: ShallowRef<HTMLElement | null>
  register: (element: HTMLElement) => () => void
}

const agentPageScrollKey: InjectionKey<AgentPageScrollContext> =
  Symbol('agent-ui-page-scroll')

export function provideAgentPageScroll(): AgentPageScrollContext {
  const collapseOffset = shallowRef(0)
  const elements = shallowRef<HTMLElement[]>([])
  const element = shallowRef<HTMLElement | null>(null)

  const register = (nextElement: HTMLElement): (() => void) => {
    elements.value = [
      ...elements.value.filter((candidate) => candidate !== nextElement),
      nextElement,
    ]
    element.value = nextElement

    return () => {
      elements.value = elements.value.filter(
        (candidate) => candidate !== nextElement,
      )
      element.value = elements.value.at(-1) ?? null
    }
  }

  const context: AgentPageScrollContext = { collapseOffset, element, register }
  provide(agentPageScrollKey, context)
  return context
}

export function useAgentPageScroll(): AgentPageScrollContext | null {
  return inject(agentPageScrollKey, null)
}
