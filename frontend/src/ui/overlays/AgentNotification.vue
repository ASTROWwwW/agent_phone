<script setup lang="ts">
import { computed, useId, useSlots } from 'vue'

import AgentChipDeleteIcon from '../controls/AgentChipDeleteIcon.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    ariaDescribedby?: string
    ariaLabel?: string
    ariaLabelledby?: string
    ariaLive?: 'assertive' | 'off' | 'polite'
    button?: string
    closeLabel?: string
    component?: 'div' | 'section'
    icon?: string
    opened: boolean
    role?: 'alert' | 'status'
    subtitle?: number | string
    text?: number | string
    title?: number | string
    titleRightText?: number | string
  }>(),
  {
    component: 'section',
    role: 'status',
  },
)

const emit = defineEmits<{
  close: [event: MouseEvent]
}>()

const slots = useSlots()
const titleId = useId()
const hasTitle = computed(
  () => props.title !== undefined || Boolean(slots.title),
)
const hasCloseButton = computed(
  () =>
    props.button !== undefined ||
    props.closeLabel !== undefined ||
    Boolean(slots.button),
)
const resolvedAriaLive = computed(
  () => props.ariaLive ?? (props.role === 'alert' ? 'assertive' : 'polite'),
)
const resolvedAriaLabelledby = computed(() => {
  if (props.ariaLabel) return undefined
  return props.ariaLabelledby ?? (hasTitle.value ? titleId : undefined)
})
const resolvedCloseLabel = computed(() => props.closeLabel ?? props.button)
</script>

<template>
  <Transition name="agent-notification-slide" appear>
    <component
      :is="component"
      v-if="opened"
      v-bind="$attrs"
      class="agent-notification agent-glass-surface"
      :role="role"
      :aria-atomic="true"
      :aria-describedby="ariaDescribedby"
      :aria-label="ariaLabel"
      :aria-labelledby="resolvedAriaLabelledby"
      :aria-live="resolvedAriaLive"
    >
      <div
        v-if="icon !== undefined || $slots.icon"
        class="agent-notification__icon"
      >
        <slot name="icon">{{ icon }}</slot>
      </div>

      <div class="agent-notification__content">
        <div
          class="agent-notification__header"
          :class="{
            'agent-notification__header--with-close': hasCloseButton,
          }"
        >
          <strong v-if="hasTitle" :id="titleId" class="agent-notification__title">
            <slot name="title">{{ title }}</slot>
          </strong>

          <span
            v-if="titleRightText !== undefined || $slots.titleRightText"
            class="agent-notification__time"
          >
            <slot name="titleRightText">{{ titleRightText }}</slot>
          </span>

          <button
            v-if="hasCloseButton"
            type="button"
            class="agent-notification__close"
            :aria-label="resolvedCloseLabel"
            @click="emit('close', $event)"
          >
            <AgentChipDeleteIcon class="agent-notification__close-icon" />
            <slot name="button" />
          </button>
        </div>

        <div
          v-if="subtitle !== undefined || $slots.subtitle"
          class="agent-notification__subtitle"
        >
          <slot name="subtitle">{{ subtitle }}</slot>
        </div>

        <div
          v-if="text !== undefined || $slots.text"
          class="agent-notification__text"
        >
          <slot name="text">{{ text }}</slot>
        </div>

        <slot />
      </div>
    </component>
  </Transition>
</template>
