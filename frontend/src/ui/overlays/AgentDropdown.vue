<script setup lang="ts">
import { Check, ChevronRight } from 'lucide-vue-next'
import { computed } from 'vue'

import AgentPopover from './AgentPopover.vue'

defineOptions({ inheritAttrs: false })

interface AgentDropdownItem {
  checked?: boolean
  destructive?: boolean
  disabled?: boolean
  group?: string
  groupLabel?: string
  id: string
  label: string
  separatorBefore?: boolean
  submenu?: boolean
}

const props = withDefaults(
  defineProps<{
    items: readonly AgentDropdownItem[]
    label: string
    opened: boolean
    placement?: 'auto' | 'bottom' | 'left' | 'right' | 'top'
    target: HTMLElement | string | null
  }>(),
  {
    placement: 'bottom',
  },
)

const emit = defineEmits<{
  backdropclick: [event: MouseEvent]
  escape: [event: KeyboardEvent]
  positionerror: [reason: string]
  select: [id: string, event: MouseEvent]
}>()

const menuSections = computed(() => {
  const sections: Array<{
    group: string | null
    items: AgentDropdownItem[]
    key: string
    label?: string
  }> = []

  props.items.forEach((item) => {
    const group = item.group ?? null
    const previous = sections[sections.length - 1]
    if (!previous || previous.group !== group) {
      sections.push({
        group,
        items: [item],
        key: `${group ?? 'items'}:${sections.length}`,
        label: item.groupLabel,
      })
      return
    }

    previous.items.push(item)
  })

  return sections
})
</script>

<template>
  <AgentPopover
    v-bind="$attrs"
    class="agent-dropdown"
    :aria-label="label"
    :opened="opened"
    :placement="placement"
    role="menu"
    :target="target"
    @backdropclick="emit('backdropclick', $event)"
    @escape="emit('escape', $event)"
    @positionerror="emit('positionerror', $event)"
  >
    <div class="agent-dropdown__menu">
      <div
        v-for="section in menuSections"
        :key="section.key"
        :aria-label="section.group ? section.label : undefined"
        :role="section.group ? 'group' : 'presentation'"
      >
        <button
          v-for="item in section.items"
          :key="item.id"
          class="agent-dropdown__item"
          :class="{
            'agent-dropdown__item--destructive': item.destructive,
            'agent-dropdown__item--separator': item.separatorBefore,
          }"
          :aria-checked="item.checked === undefined ? undefined : item.checked"
          :aria-haspopup="item.submenu ? 'menu' : undefined"
          :disabled="item.disabled"
          :role="item.checked === undefined ? 'menuitem' : 'menuitemradio'"
          type="button"
          @click="emit('select', item.id, $event)"
        >
          <span class="agent-dropdown__indicator" aria-hidden="true">
            <Check v-if="item.checked" :size="21" :stroke-width="2.5" />
          </span>
          <span class="agent-dropdown__label">{{ item.label }}</span>
          <ChevronRight
            v-if="item.submenu"
            class="agent-dropdown__chevron"
            :size="21"
            :stroke-width="2.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  </AgentPopover>
</template>
