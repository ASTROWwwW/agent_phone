<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    active?: boolean
    ariaLabel?: string
    component?: 'a' | 'button'
    disabled?: boolean
    href?: string
    label?: string
    linkProps?: Record<string, unknown>
    type?: 'button' | 'reset' | 'submit'
  }>(),
  {
    active: false,
    ariaLabel: '',
    component: 'button',
    disabled: false,
    href: undefined,
    label: '',
    linkProps: () => ({}),
    type: 'button',
  },
)

defineEmits<{
  click: [event: MouseEvent]
}>()

const elementProps = computed<Record<string, unknown>>(() => {
  if (props.component === 'a') {
    return {
      ...props.linkProps,
      'aria-disabled': props.disabled || undefined,
      href: props.disabled ? undefined : props.href,
      tabindex: props.disabled ? -1 : undefined,
    }
  }

  return {
    ...props.linkProps,
    disabled: props.disabled,
    type: props.linkProps.type ?? props.type,
  }
})
</script>

<template>
  <component
    :is="component"
    v-bind="{ ...$attrs, ...elementProps }"
    class="agent-tab-button"
    :class="{ 'agent-tab-button--active': active }"
    :aria-current="active ? 'page' : undefined"
    :aria-label="ariaLabel || undefined"
    @click="$emit('click', $event)"
  >
    <span v-if="$slots.icon" class="agent-tab-button__icon">
      <slot name="icon" />
    </span>
    <span v-if="label || $slots.label" class="agent-tab-button__label">
      <slot name="label">{{ label }}</slot>
    </span>
    <slot />
  </component>
</template>
