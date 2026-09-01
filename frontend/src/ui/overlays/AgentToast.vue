<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    component?: string
    opened: boolean
    position?: 'center' | 'left' | 'right'
    verticalPosition?: 'bottom' | 'center' | 'top'
  }>(),
  { component: 'div', position: 'left', verticalPosition: 'bottom' },
)
</script>

<template>
  <Transition name="agent-toast-slide" appear>
    <component
      :is="component"
      v-if="opened"
      v-bind="$attrs"
      class="agent-toast"
      :class="[
        `agent-toast--${position}`,
        `agent-toast--vertical-${verticalPosition}`,
      ]"
      role="status"
      aria-live="polite"
    >
      <div class="agent-toast__inner agent-glass-surface">
        <div class="agent-toast__content">
          <div class="agent-toast__text"><slot /></div>
          <div v-if="$slots.button" class="agent-toast__button">
            <slot name="button" />
          </div>
        </div>
      </div>
    </component>
  </Transition>
</template>
