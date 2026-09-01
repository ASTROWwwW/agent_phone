<script setup lang="ts">
import { computed } from 'vue'

import AgentGlass from './AgentGlass.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    block?: boolean
    clear?: boolean
    component?: 'a' | 'button'
    disabled?: boolean
    glass?: boolean
    href?: string
    iconOnly?: boolean
    inline?: boolean
    large?: boolean
    outline?: boolean
    raised?: boolean
    rounded?: boolean
    small?: boolean
    tonal?: boolean
    type?: 'button' | 'reset' | 'submit'
    variant?: 'danger' | 'plain' | 'primary' | 'secondary'
  }>(),
  {
    block: false,
    clear: false,
    component: 'button',
    disabled: false,
    glass: false,
    href: undefined,
    iconOnly: false,
    inline: false,
    large: false,
    outline: false,
    raised: false,
    rounded: false,
    small: false,
    tonal: false,
    type: 'button',
    variant: 'primary',
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => [
  `agent-button--${props.variant}`,
  {
    'agent-button--block': props.block,
    'agent-button--clear': props.clear,
    'agent-button--glass': props.glass,
    'agent-button--icon-only': props.iconOnly,
    'agent-button--inline': props.inline,
    'agent-button--large': props.large,
    'agent-button--outline': props.outline,
    'agent-button--raised': props.raised,
    'agent-button--rounded': props.rounded,
    'agent-button--small': props.small && !props.large,
    'agent-button--tonal': props.tonal,
  },
])

const elementProps = computed<Record<string, unknown>>(() => {
  if (props.component === 'a') {
    return {
      'aria-disabled': props.disabled || undefined,
      href: props.disabled ? undefined : props.href,
      tabindex: props.disabled ? -1 : undefined,
    }
  }

  return {
    disabled: props.disabled,
    type: props.type,
  }
})

function handleClick(event: MouseEvent): void {
  if (props.disabled) {
    event.preventDefault()
    event.stopPropagation()
    return
  }

  emit('click', event)
}
</script>

<template>
  <AgentGlass
    v-if="glass"
    :component="component"
    v-bind="{ ...$attrs, ...elementProps }"
    class="agent-button"
    :class="buttonClasses"
    :disabled="disabled"
    :href="href"
    :type="type"
    @click="handleClick"
  >
    <slot />
  </AgentGlass>
  <component
    v-else
    :is="component"
    v-bind="{ ...$attrs, ...elementProps }"
    class="agent-button"
    :class="buttonClasses"
    @click="handleClick"
  >
    <slot />
  </component>
</template>
